// The screenshot scenes behind ?shot=cover|alert|vault|win. Each one plays
// the real rules forward from a fresh run: a waypoint autopilot steers the
// thief (or, for the win, walks it briskly along the same route), guards
// patrol and cameras sweep, and the alarm, loot and catches are whatever the
// rules produce — so the frame is what a short game really looks like, and
// the same seed always gives the same frame.

import { STEP } from './config.js';
import { PHASE_LEVEL, PHASE_PLAY, PHASE_WON } from './world.js';
import { SCREEN_LEVEL, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WON } from './render.js';

const SAMPLE = STEP;

/** Steer toward a point, as a normalised { x, y } vector. */
function steerToward(fromX, fromY, toX, toY) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 1) return { x: 0, y: 0 };
  return { x: dx / distance, y: dy / distance };
}

/**
 * Follow `waypoints` with the real movement rules for up to `seconds`,
 * advancing when a waypoint is reached or when the thief is stuck on a wall.
 */
function followWaypoints(world, waypoints, seconds) {
  const state = world.state;
  let target = 0;
  let stuck = 0;
  let lastX = state.player.x;
  let lastY = state.player.y;
  const steps = Math.floor(seconds / SAMPLE);
  for (let index = 0; index < steps; index += 1) {
    if (state.phase !== PHASE_PLAY || target >= waypoints.length) break;
    const point = waypoints[target];
    const steering = steerToward(state.player.x, state.player.y, point[0], point[1]);
    world.step(SAMPLE, { x: steering.x, y: steering.y, sneak: false, useCoin: false, useSmoke: false, mouseX: 0, mouseY: 0 });
    const dx = point[0] - state.player.x;
    const dy = point[1] - state.player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 20) {
      target += 1;
      stuck = 0;
    } else if (Math.abs(state.player.x - lastX) + Math.abs(state.player.y - lastY) < 0.05) {
      stuck += 1;
      if (stuck > 90) {
        target += 1;
        stuck = 0;
      }
    } else {
      stuck = 0;
    }
    lastX = state.player.x;
    lastY = state.player.y;
  }
}

/** Walk into a camera's cone and stand there until the alarm runs hot. The
 * spot (340, 300) sits under the Galeri camera's sweep but off the guards'
 * patrol lanes, so the alarm — not a guard's hands — makes the moment. */
function seekAlarm(world, seconds) {
  const state = world.state;
  const steps = Math.floor(seconds / SAMPLE);
  for (let index = 0; index < steps; index += 1) {
    if (state.phase !== PHASE_PLAY) break;
    if (state.alarm >= 72) break;
    world.step(SAMPLE, { x: 0, y: 0, sneak: false, useCoin: false, useSmoke: false, mouseX: 0, mouseY: 0 });
  }
  // Wait for a frame where a camera actually has the thief in its cone,
  // unless the alarm is about to fill first.
  for (let index = 0; index < 90; index += 1) {
    if (state.phase !== PHASE_PLAY || state.alarm >= 92) break;
    if (state.cameras.some((camera) => camera.seesThief)) break;
    world.step(SAMPLE, { x: 0, y: 0, sneak: false, useCoin: false, useSmoke: false, mouseX: 0, mouseY: 0 });
  }
}

/**
 * Walk the win route briskly: the staging script moves the thief along the
 * waypoints and every step still runs the real pickup, alarm and exit rules.
 */
function briskWin(world, waypoints, seconds) {
  const state = world.state;
  let target = 0;
  const steps = Math.floor(seconds / SAMPLE);
  for (let index = 0; index < steps; index += 1) {
    if (state.phase === PHASE_WON || state.phase === PHASE_LEVEL) break;
    if (target >= waypoints.length) break;
    const point = waypoints[target];
    const steering = steerToward(state.player.x, state.player.y, point[0], point[1]);
    world.placePlayer(state.player.x + steering.x * 11, state.player.y + steering.y * 11);
    world.step(SAMPLE, { x: 0, y: 0, sneak: false, useCoin: false, useSmoke: false, mouseX: 0, mouseY: 0 });
    const dx = point[0] - state.player.x;
    const dy = point[1] - state.player.y;
    if (Math.sqrt(dx * dx + dy * dy) < 14) target += 1;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show.
 */
export function stageShot(name, world) {
  if (name === 'alert') {
    world.loadLevel(0);
    // (150, 280) sits in the Galeri camera's sweep, clear of any wall, but
    // off the guards' patrol lanes and at a right angle to their facing, so
    // the alarm climbs on camera sight alone and no guard can walk in.
    followWaypoints(world, [[200, 620], [200, 280], [150, 280]], 14);
    seekAlarm(world, 20);
    return { screen: world.state.phase === 'caught' ? SCREEN_OVER : SCREEN_PLAY, best: 0 };
  }
  if (name === 'vault') {
    world.loadLevel(2);
    followWaypoints(world, world.state.level.coverWaypoints, 14);
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    world.reset();
    for (let level = 0; level < 3; level += 1) {
      briskWin(world, world.state.level.winWaypoints, 40);
      if (world.state.phase === PHASE_WON) break;
      if (world.state.phase === PHASE_LEVEL) world.nextLevel();
      else break;
    }
    if (world.state.phase === PHASE_WON) return { screen: SCREEN_WON, best: world.state.score };
    if (world.state.phase === PHASE_LEVEL) return { screen: SCREEN_LEVEL, best: world.state.score };
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  world.reset();
  followWaypoints(world, world.state.level.coverWaypoints, 16);
  return { screen: SCREEN_PLAY, best: 0 };
}
