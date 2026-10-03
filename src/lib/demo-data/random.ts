// Small seeded random generator (mulberry32), so the demo data is the same on every run.

export type Random = {
  next: () => number;
  chance: (probability: number) => boolean;
  /** Integer in [min, max], both included. */
  int: (min: number, max: number) => number;
  /** Float in [-amount, amount]. */
  jitter: (amount: number) => number;
  pick: <T>(items: readonly T[]) => T;
};

export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (probability) => next() < probability,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    jitter: (amount) => (next() * 2 - 1) * amount,
    pick: (items) => items[Math.floor(next() * items.length)],
  };
}
