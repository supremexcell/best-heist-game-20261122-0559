// Sight: vision cones and line of sight. A watcher (guard or camera) sees the
// thief only when the thief is inside its cone, inside its range, and no wall
// stands between them. Smoke clouds block sight the same way a wall does.

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Shrink the rectangle a hair: a sight line that only grazes a wall's edge
  // (a camera mounted on that wall, a ray along it) is not blocked by it.
  const rx = rect.x + 1;
  const ry = rect.y + 1;
  const rw = rect.w - 2;
  const rh = rect.h - 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  let low = 0;
  let high = 1;
  if (dx === 0) {
    if (x1 < rx || x1 > rx + rw) return false;
  } else {
    let t1 = (rx - x1) / dx;
    let t2 = (rx + rw - x1) / dx;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return false;
  }
  if (dy === 0) {
    if (y1 < ry || y1 > ry + rh) return false;
  } else {
    let t1 = (ry - y1) / dy;
    let t2 = (ry + rh - y1) / dy;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    low = Math.max(low, t1);
    high = Math.min(high, t2);
    if (low > high) return false;
  }
  return true;
}

/** True when no wall and no smoke cloud stands between the two points. */
export function hasLineOfSight(x1, y1, x2, y2, walls, smokes) {
  for (let index = 0; index < walls.length; index += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, walls[index])) return false;
  }
  for (let index = 0; index < smokes.length; index += 1) {
    const cloud = smokes[index];
    if (cloud.left > 0) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const fx = x1 - cloud.x;
      const fy = y1 - cloud.y;
      const a = dx * dx + dy * dy;
      const b = 2 * (fx * dx + fy * dy);
      const c = fx * fx + fy * fy - cloud.radius * cloud.radius;
      const disc = b * b - 4 * a * c;
      if (disc >= 0) {
        const root = Math.sqrt(disc);
        const t1 = (-b - root) / (2 * a);
        const t2 = (-b + root) / (2 * a);
        if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1)) return false;
      }
    }
  }
  return true;
}

function angleDifference(a, b) {
  let diff = a - b;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

/**
 * True when `target` sits inside the watcher's cone and line of sight is clear.
 * `sneakFactor` shrinks the effective range (a sneaking thief is harder to spot).
 */
export function canSee(watcher, target, walls, smokes, sneakFactor) {
  const dx = target.x - watcher.x;
  const dy = target.y - watcher.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > watcher.range * sneakFactor) return false;
  if (distance > 26 && Math.abs(angleDifference(Math.atan2(dy, dx), watcher.angle)) > watcher.halfAngle) return false;
  return hasLineOfSight(watcher.x, watcher.y, target.x, target.y, walls, smokes);
}
