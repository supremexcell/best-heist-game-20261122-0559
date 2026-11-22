// The guards: patrol their waypoints, investigate a thrown coin, and chase
// the thief when the alarm runs hot. A guard only ever moves toward a point
// it can see or was told about; it never knows where the thief is for free.

import { GUARD } from './config.js';
import { canSee } from './vision.js';
import { moveCircle } from './player.js';

export const GUARD_PATROL = 0;
export const GUARD_INVESTIGATE = 1;
export const GUARD_CHASE = 2;

export function createGuards(definitions) {
  return definitions.map((definition) => ({
    name: definition.name,
    waypoints: definition.waypoints,
    waypointIndex: 1,
    x: definition.waypoints[0][0],
    y: definition.waypoints[0][1],
    radius: GUARD.radius,
    angle: 0,
    mode: GUARD_PATROL,
    investigateX: 0,
    investigateY: 0,
    investigateLeft: 0,
    lastSeenX: 0,
    lastSeenY: 0,
    seesThief: false,
    pauseLeft: 0,
  }));
}

function moveToward(guard, targetX, targetY, speed, dt, walls) {
  const dx = targetX - guard.x;
  const dy = targetY - guard.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance < 2) return 0;
  const step = Math.min(distance, speed * dt);
  const beforeX = guard.x;
  const beforeY = guard.y;
  moveCircle(guard, (dx / distance) * step, (dy / distance) * step, walls);
  guard.angle = Math.atan2(guard.y - beforeY, guard.x - beforeX);
  return Math.sqrt((guard.x - beforeX) ** 2 + (guard.y - beforeY) ** 2);
}

/**
 * One step for every guard. Returns true when any guard can lay a hand on the
 * thief (the fair catch: it has to reach the thief, the alarm alone never
 * ends the run until it fills).
 */
export function stepGuards(guards, thief, alarm, dt, walls, smokes) {
  let caught = false;
  const sneakFactor = thief.sneaking ? 0.55 : 1;
  for (let index = 0; index < guards.length; index += 1) {
    const guard = guards[index];
    const watcher = { x: guard.x, y: guard.y, angle: guard.angle, range: GUARD.viewRange, halfAngle: GUARD.viewHalfAngle };
    guard.seesThief = canSee(watcher, thief, walls, smokes, sneakFactor);
    if (guard.seesThief) {
      guard.lastSeenX = thief.x;
      guard.lastSeenY = thief.y;
    }
    if (alarm >= GUARD.chaseAt && guard.seesThief) {
      guard.mode = GUARD_CHASE;
    } else if (guard.mode === GUARD_CHASE && !guard.seesThief && alarm < GUARD.suspiciousAt) {
      guard.mode = GUARD_PATROL;
    } else if (guard.mode === GUARD_PATROL && alarm >= GUARD.suspiciousAt && guard.seesThief) {
      guard.mode = GUARD_INVESTIGATE;
      guard.investigateX = guard.lastSeenX;
      guard.investigateY = guard.lastSeenY;
      guard.investigateLeft = 2;
    }

    if (guard.mode === GUARD_CHASE) {
      moveToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed, dt, walls);
      if (!guard.seesThief) {
        const dx = guard.lastSeenX - guard.x;
        const dy = guard.lastSeenY - guard.y;
        if (Math.sqrt(dx * dx + dy * dy) < 12) guard.mode = GUARD_PATROL;
      }
    } else if (guard.mode === GUARD_INVESTIGATE) {
      const moved = moveToward(guard, guard.investigateX, guard.investigateY, GUARD.investigateSpeed, dt, walls);
      if (moved < 0.01) {
        guard.investigateLeft -= dt;
        guard.angle += dt * 1.5;
        if (guard.investigateLeft <= 0) guard.mode = GUARD_PATROL;
      }
    } else {
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
      } else {
        const target = guard.waypoints[guard.waypointIndex];
        const moved = moveToward(guard, target[0], target[1], GUARD.patrolSpeed, dt, walls);
        if (moved < 0.01) {
          guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
          guard.pauseLeft = 0.8;
        }
      }
    }

    const dx = thief.x - guard.x;
    const dy = thief.y - guard.y;
    if (Math.sqrt(dx * dx + dy * dy) < GUARD.catchDistance) caught = true;
  }
  return caught;
}

/** Send every guard close enough to the coin's landing spot to look at it. */
export function lureGuards(guards, x, y, radius) {
  let lured = 0;
  for (let index = 0; index < guards.length; index += 1) {
    const guard = guards[index];
    const dx = x - guard.x;
    const dy = y - guard.y;
    if (Math.sqrt(dx * dx + dy * dy) <= radius) {
      guard.mode = GUARD_INVESTIGATE;
      guard.investigateX = x;
      guard.investigateY = y;
      guard.investigateLeft = 3.5;
      lured += 1;
    }
  }
  return lured;
}
