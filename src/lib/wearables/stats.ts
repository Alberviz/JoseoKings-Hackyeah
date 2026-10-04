// Shared statistical and numerical utilities for clinical wearable analysis.

/** Inclusive sample median. Even n: mean of the two central values. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Quartiles as medians of the lower and upper halves (Tukey hinges).
 * Even n splits in half; odd n leaves the median out of both halves.
 */
export function quartiles(values: number[]): {
  q1: number | null;
  q3: number | null;
  iqr: number | null;
} {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { q1: null, q3: null, iqr: null };
  if (n === 1) return { q1: sorted[0], q3: sorted[0], iqr: 0 };
  const mid = Math.floor(n / 2);
  const upperStart = n % 2 === 0 ? mid : mid + 1;
  const q1 = median(sorted.slice(0, mid));
  const q3 = median(sorted.slice(upperStart));
  const iqr = q1 !== null && q3 !== null ? q3 - q1 : null;
  return { q1, q3, iqr };
}

/**
 * Hyndman-Fan type 7 percentile on an already sorted sample.
 */
export function quantileType7(sorted: number[], p: number): number | null {
  const n = sorted.length;
  if (n === 0) return null;
  if (n === 1) return sorted[0];
  const h = 1 + (n - 1) * p;
  const lo = Math.floor(h);
  const gamma = h - lo;
  if (gamma === 0 || lo >= n) return sorted[lo - 1];
  return sorted[lo - 1] * (1 - gamma) + sorted[lo] * gamma;
}

/** 95% Percentile interval (2.5% and 97.5%) using Hyndman-Fan type 7. */
export function percentileInterval(samples: number[]): {
  low: number;
  high: number;
} {
  const sorted = [...samples].sort((a, b) => a - b);
  const low = quantileType7(sorted, 0.025);
  const high = quantileType7(sorted, 0.975);
  return { low: low ?? 0, high: high ?? 0 };
}

/** Seeded PRNG (Mulberry32) for reproducible statistical algorithms. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal generator. */
export function randn(rng: () => number): number {
  const u1 = Math.max(rng(), Number.EPSILON);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Independent bootstrap resample of values. */
export function resample<T>(values: T[], rng: () => number): T[] {
  const n = values.length;
  const out = new Array<T>(n);
  for (let i = 0; i < n; i += 1) {
    out[i] = values[Math.floor(rng() * n)];
  }
  return out;
}

/** Circular moving-block draw, trimmed to n. Block length is caller's. */
export function movingBlockSample<T>(values: T[], blockLength: number, rng: () => number): T[] {
  const n = values.length;
  if (n === 0) return [];
  const b = Math.max(1, Math.min(blockLength, n));
  const out: T[] = [];
  while (out.length < n) {
    const start = Math.floor(rng() * n);
    for (let k = 0; k < b && out.length < n; k += 1) {
      out.push(values[(start + k) % n]);
    }
  }
  return out;
}

/** Circular block permutation: random rotation, then shuffle non-overlapping blocks. */
export function circularBlockPermute<T>(series: T[], blockLength: number, rng: () => number): T[] {
  const n = series.length;
  if (n === 0) return [];
  const b = Math.max(1, Math.min(blockLength, n));
  const shift = Math.floor(rng() * n);
  const rotated = new Array<T>(n);
  for (let i = 0; i < n; i += 1) rotated[i] = series[(i + shift) % n];
  const blocks: T[][] = [];
  for (let i = 0; i < n; i += b) blocks.push(rotated.slice(i, i + b));
  for (let i = blocks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = blocks[i];
    blocks[i] = blocks[j];
    blocks[j] = tmp;
  }
  return blocks.flat();
}

function midranks(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j].v === indexed[i].v) j += 1;
    const mid = (i + 1 + j) / 2;
    for (let k = i; k < j; k += 1) {
      ranks[indexed[k].i] = mid;
    }
    i = j;
  }
  return ranks;
}

/** Pearson correlation on two series. */
export function pearson(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n !== ys.length || n < 2) return null;
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < n; i += 1) {
    meanX += xs[i];
    meanY += ys[i];
  }
  meanX /= n;
  meanY /= n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i += 1) {
    const a = xs[i] - meanX;
    const b = ys[i] - meanY;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

/** Spearman rank correlation with midranks for ties. */
export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) return null;
  return pearson(midranks(xs), midranks(ys));
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export function enumerateDates(startExclusive: string, endInclusive: string): string[] {
  if (endInclusive <= startExclusive) return [];
  const out: string[] = [];
  let cursor = addDays(startExclusive, 1);
  while (cursor <= endInclusive) {
    out.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return out;
}
