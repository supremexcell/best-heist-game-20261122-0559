// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between six screens: title,
// play, paused, caught, level complete and the getaway win.
//
// ?seed=N fixes the layout jitter. ?shot=cover|alert|vault|win (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import {
  EVENT_CAUGHT,
  EVENT_EMERALD,
  EVENT_LEVEL,
  EVENT_PICKUP,
  EVENT_SPOTTED,
  EVENT_TOOL,
  EVENT_WON,
  PHASE_CAUGHT,
  PHASE_LEVEL,
  PHASE_PLAY,
  PHASE_WON,
  createWorld,
} from './world.js';
import { ACTION_COIN, ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_SMOKE, createInput } from './input.js';
import { createRenderer, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();
window.__world = world;
/** The screen the loop is on, exposed so an automated playtest can read it. */
let screen = SCREEN_TITLE;
window.__getScreen = () => screen;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  /** One-shot tool presses, taken once in handleActions and spent by the next step. */
  let pendingTools = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Bermain. Ambil Zamrud Garuda, lalu kabur.');
  }

  function finishRun() {
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Suara mati.' : 'Suara hidup.');
    }
    if (actions & (ACTION_COIN | ACTION_SMOKE)) pendingTools |= actions & (ACTION_COIN | ACTION_SMOKE);
    if (actions & ACTION_CONFIRM) audio.unlock();
    if (screen === SCREEN_TITLE && actions & ACTION_CONFIRM) {
      startGame();
    } else if (screen === SCREEN_OVER && actions & ACTION_CONFIRM) {
      startGame();
    } else if (screen === SCREEN_WON && actions & ACTION_CONFIRM) {
      startGame();
    } else if (screen === SCREEN_LEVEL && actions & ACTION_CONFIRM) {
      world.nextLevel();
      screen = SCREEN_PLAY;
      announce(`Ruangan ${world.state.levelIndex + 1}: ${world.state.level.name}.`);
    } else if (screen === SCREEN_PLAY && actions & ACTION_PAUSE) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (screen === SCREEN_PAUSED && (actions & (ACTION_PAUSE | ACTION_CONFIRM))) {
      screen = SCREEN_PLAY;
      announce('Bermain.');
    }
  }

  function step() {
    const steering = input.steering(world.state.player);
    const mouse = input.mouse();
    const tools = pendingTools;
    pendingTools = 0;
    const events = world.step(STEP, {
      x: steering.x,
      y: steering.y,
      sneak: steering.sneak,
      useCoin: Boolean(tools & ACTION_COIN),
      useSmoke: Boolean(tools & ACTION_SMOKE),
      mouseX: mouse.x,
      mouseY: mouse.y,
    });
    audio.alarmBeep(world.state.alarm, STEP);
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_EMERALD) {
      audio.emerald();
      announce('Zamrud didapat! Ke pintu hijau!');
    }
    if (events & EVENT_TOOL) audio.coin();
    if (events & EVENT_SPOTTED) {
      audio.spotted();
      announce('Terlihat! Sembunyi!');
    }
    if (events & EVENT_LEVEL) {
      audio.levelDone();
      screen = SCREEN_LEVEL;
      announce(`Ruangan bersih. Loot ${world.state.score}.`);
    }
    if (events & EVENT_WON) {
      audio.win();
      finishRun();
      screen = SCREEN_WON;
      announce(`Kabur! Loot ${world.state.score}. Terbaik ${best}.`);
    }
    if (events & EVENT_CAUGHT) {
      audio.caught();
      finishRun();
      screen = SCREEN_OVER;
      announce(`Tertangkap. Loot ${world.state.score}.`);
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Jeda.');
    }
  });

  announce('Malam di Museum Garuda. Tekan Spasi atau klik untuk mulai.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
