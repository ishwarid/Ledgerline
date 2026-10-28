/**
 * Small seeded PRNG (mulberry32). The mock bank needs to produce the same
 * data on the server and on every deploy, otherwise charts jump around
 * between refreshes and snapshot tests become useless.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  return {
    next,
    int(min: number, max: number) {
      return Math.floor(next() * (max - min + 1)) + min;
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error("pick() called with an empty list");
      return item;
    },
    chance(probability: number) {
      return next() < probability;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;
