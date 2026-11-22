// The thief: a circle that slides along walls. Movement is axis-separated, so
// pressing into a wall still slides along it instead of sticking.

import { FIELD, PLAYER } from './config.js';

function circleHitsWalls(x, y, radius, walls) {
  for (let index = 0; index < walls.length; index += 1) {
    const rect = walls[index];
    const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
    const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
    const dx = x - nearestX;
    const dy = y - nearestY;
    if (dx * dx + dy * dy < radius * radius) return true;
  }
  return false;
}

/** Move a circle through the walls, sliding on each axis it can still travel. */
export function moveCircle(body, dx, dy, walls) {
  const nextX = Math.min(FIELD.width - 16 - body.radius, Math.max(16 + body.radius, body.x + dx));
  if (!circleHitsWalls(nextX, body.y, body.radius, walls)) body.x = nextX;
  const nextY = Math.max(80 + body.radius, Math.min(704 - body.radius, body.y + dy));
  if (!circleHitsWalls(body.x, nextY, body.radius, walls)) body.y = nextY;
}

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    radius: PLAYER.radius,
    facing: 0,
    moving: false,
    sneaking: false,
  };
}

/** Step the thief from a steering vector; returns how far it actually moved. */
export function stepPlayer(player, steering, dt, walls) {
  const speed = steering.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  const dx = steering.x * speed * dt;
  const dy = steering.y * speed * dt;
  const beforeX = player.x;
  const beforeY = player.y;
  moveCircle(player, dx, dy, walls);
  player.moving = Math.abs(player.x - beforeX) + Math.abs(player.y - beforeY) > 0.01;
  player.sneaking = steering.sneak;
  if (player.moving) player.facing = Math.atan2(player.y - beforeY, player.x - beforeX);
  return Math.sqrt((player.x - beforeX) ** 2 + (player.y - beforeY) ** 2);
}
