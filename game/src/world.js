// The game's rules and state, with no drawing and no browser in it: the thief,
// the guards, the cameras, the loot, the alarm meter, the tools and the win
// and caught states. step() advances one fixed step and returns what happened
// as bit flags, so the caller can react without the world knowing about
// screens or sound. Nothing here allocates after createWorld returns.

import { ALARM, CAMERA, GUARD, LEVELS, LOOT, TOOLS } from './config.js';
import { LEVELS as LEVEL_DEFS } from './levels.js';
import { createPlayer, stepPlayer } from './player.js';
import { createGuards, lureGuards, stepGuards } from './guards.js';
import { createCameras, stepCameras } from './cameras.js';

export const EVENT_PICKUP = 1;
export const EVENT_TOOL = 2;
export const EVENT_SPOTTED = 4;
export const EVENT_CAUGHT = 8;
export const EVENT_LEVEL = 16;
export const EVENT_WON = 32;
export const EVENT_EMERALD = 64;

export const PHASE_PLAY = 'play';
export const PHASE_CAUGHT = 'caught';
export const PHASE_LEVEL = 'level';
export const PHASE_WON = 'won';

export function createWorld(random) {
  const state = {
    levelIndex: 0,
    level: LEVEL_DEFS[0],
    player: null,
    guards: [],
    cameras: [],
    gems: [],
    emeraldTaken: false,
    alarm: 0,
    score: 0,
    coinsLeft: TOOLS.coin.uses,
    smokesLeft: TOOLS.smoke.uses,
    smokes: [],
    coin: null,
    phase: PHASE_PLAY,
    time: 0,
    spotted: false,
    wasSpotted: false,
    caughtReason: '',
    levelTime: 0,
    totalLoot: 0,
  };

  function loadLevel(index) {
    const level = LEVEL_DEFS[index];
    state.levelIndex = index;
    state.level = level;
    state.player = createPlayer(level.start);
    state.guards = createGuards(level.guards);
    state.cameras = createCameras(level.cameras);
    state.gems = level.gems.map((gem) => ({ x: gem.x, y: gem.y, taken: false }));
    state.emeraldTaken = false;
    state.alarm = 0;
    state.coinsLeft = TOOLS.coin.uses;
    state.smokesLeft = TOOLS.smoke.uses;
    state.smokes = [];
    state.coin = null;
    state.phase = PHASE_PLAY;
    state.spotted = false;
    state.wasSpotted = false;
    state.caughtReason = '';
    state.levelTime = 0;
  }

  function reset() {
    state.score = 0;
    state.totalLoot = 0;
    state.time = 0;
    loadLevel(0);
  }

  function useCoin(mouseX, mouseY) {
    if (state.coinsLeft <= 0 || state.score < TOOLS.coin.cost) return false;
    state.score -= TOOLS.coin.cost;
    state.coinsLeft -= 1;
    const x = Math.max(24, Math.min(1256, mouseX));
    const y = Math.max(88, Math.min(696, mouseY));
    state.coin = { x, y, left: 0.9 };
    lureGuards(state.guards, x, y, TOOLS.coin.lureRadius);
    return true;
  }

  function useSmoke() {
    if (state.smokesLeft <= 0 || state.score < TOOLS.smoke.cost) return false;
    state.score -= TOOLS.smoke.cost;
    state.smokesLeft -= 1;
    state.smokes.push({ x: state.player.x, y: state.player.y, radius: TOOLS.smoke.radius, left: TOOLS.smoke.seconds });
    return true;
  }

  /**
   * One fixed step. `input` is { x, y, sneak, useCoin, useSmoke, mouseX, mouseY }.
   * Only runs while the level is being played; the caught and win screens freeze it.
   */
  function step(dt, input) {
    let events = 0;
    if (state.phase !== PHASE_PLAY) return events;
    state.time += dt;
    state.levelTime += dt;

    stepPlayer(state.player, input, dt, state.level.walls);

    if (input.useCoin && useCoin(input.mouseX, input.mouseY)) events |= EVENT_TOOL;
    if (input.useSmoke && useSmoke()) events |= EVENT_TOOL;

    for (let index = state.smokes.length - 1; index >= 0; index -= 1) {
      state.smokes[index].left -= dt;
      if (state.smokes[index].left <= 0) state.smokes.splice(index, 1);
    }
    if (state.coin !== null) {
      state.coin.left -= dt;
      if (state.coin.left <= 0) state.coin = null;
    }

    const cameraSees = stepCameras(state.cameras, state.player, state.time, dt, state.level.walls, state.smokes);
    const guardCaught = stepGuards(state.guards, state.player, state.alarm, dt, state.level.walls, state.smokes);
    const guardSees = state.guards.some((guard) => guard.seesThief);
    state.spotted = guardSees || cameraSees;

    if (state.spotted) {
      state.alarm = Math.min(ALARM.max, state.alarm + (guardSees ? GUARD.spotRate : CAMERA.spotRate) * dt);
      if (!state.wasSpotted) events |= EVENT_SPOTTED;
    } else {
      state.alarm = Math.max(0, state.alarm - ALARM.decay * dt);
    }
    state.wasSpotted = state.spotted;

    const player = state.player;
    for (let index = 0; index < state.gems.length; index += 1) {
      const gem = state.gems[index];
      if (gem.taken) continue;
      const dx = gem.x - player.x;
      const dy = gem.y - player.y;
      if (dx * dx + dy * dy < 28 * 28) {
        gem.taken = true;
        state.score += LOOT.gemValue;
        state.totalLoot += LOOT.gemValue;
        events |= EVENT_PICKUP;
      }
    }
    if (!state.emeraldTaken) {
      const dx = state.level.emerald.x - player.x;
      const dy = state.level.emerald.y - player.y;
      if (dx * dx + dy * dy < 32 * 32) {
        state.emeraldTaken = true;
        state.score += LOOT.emeraldValue;
        state.totalLoot += LOOT.emeraldValue;
        events |= EVENT_EMERALD;
      }
    }

    if (state.emeraldTaken) {
      const exit = state.level.exit;
      if (player.x > exit.x && player.x < exit.x + exit.w && player.y > exit.y && player.y < exit.y + exit.h) {
        state.score += LOOT.levelBonus;
        if (state.levelIndex + 1 >= LEVELS) {
          state.phase = PHASE_WON;
          events |= EVENT_WON;
        } else {
          state.phase = PHASE_LEVEL;
          events |= EVENT_LEVEL;
        }
        return events;
      }
    }

    if (guardCaught) {
      state.phase = PHASE_CAUGHT;
      state.caughtReason = 'Seorang penjaga menangkapmu.';
      events |= EVENT_CAUGHT;
    } else if (state.alarm >= ALARM.caughtAt) {
      state.phase = PHASE_CAUGHT;
      state.caughtReason = 'Alarm penuh — museum dikunci.';
      events |= EVENT_CAUGHT;
    }
    return events;
  }

  function nextLevel() {
    if (state.phase === PHASE_LEVEL) loadLevel(state.levelIndex + 1);
  }

  /** Staging helper for the screenshot scenes: put the thief somewhere directly. */
  function placePlayer(x, y) {
    state.player.x = x;
    state.player.y = y;
  }

  reset();
  return { state, reset, step, loadLevel, nextLevel, placePlayer };
}
