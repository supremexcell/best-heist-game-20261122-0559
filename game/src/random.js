// A small seeded random number generator (xorshift32): the same seed gives the
// same game, which is what makes the screenshot scenes repeatable. Layouts in
// levels.js are hand-placed, so this is only used for small cosmetic jitter.

export function createRandom(seed) {
  let a = (seed | 0) || 1;
  return function random() {
    a ^= a << 13;
    a ^= a >>> 17;
    a ^= a << 5;
    return ((a >>> 0) / 4294967296);
  };
}
