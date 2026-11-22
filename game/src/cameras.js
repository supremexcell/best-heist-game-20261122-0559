// The security cameras: fixed to the wall, sweeping their cone back and forth
// on a sine. A camera never moves, so its cone is a rhythm the thief reads
// before crossing — wait for the sweep to pass, then go.

import { CAMERA } from './config.js';
import { canSee } from './vision.js';

export function createCameras(definitions) {
  return definitions.map((definition, index) => ({
    x: definition.x,
    y: definition.y,
    base: definition.base,
    sweep: definition.sweep,
    angle: definition.base,
    // Staggered starts, each near its base angle: every cone sweeps across
    // its room from the first seconds, never stuck at one extreme.
    phase: index * 1.7,
    seesThief: false,
    blink: 0,
  }));
}

/** Advance every sweep; returns true when any camera has the thief in frame. */
export function stepCameras(cameras, thief, time, dt, walls, smokes) {
  let anySees = false;
  const sneakFactor = thief.sneaking ? 0.55 : 1;
  for (let index = 0; index < cameras.length; index += 1) {
    const camera = cameras[index];
    camera.angle = camera.base + Math.sin(time * CAMERA.sweepSpeed + camera.phase) * camera.sweep;
    camera.blink += dt;
    const watcher = { x: camera.x, y: camera.y, angle: camera.angle, range: CAMERA.viewRange, halfAngle: CAMERA.viewHalfAngle };
    camera.seesThief = canSee(watcher, thief, walls, smokes, sneakFactor);
    if (camera.seesThief) anySees = true;
  }
  return anySees;
}
