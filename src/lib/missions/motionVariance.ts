/** Fewer readings than this say nothing about movement. */
export const MOTION_MIN_SAMPLES = 30;

/**
 * Running variance (Welford). Keeps three numbers only, never the raw signal.
 */
export function createVarianceAccumulator() {
  let count = 0;
  let mean = 0;
  let m2 = 0;
  return {
    add(value: number) {
      if (!Number.isFinite(value)) return;
      count += 1;
      const delta = value - mean;
      mean += delta / count;
      m2 += delta * (value - mean);
    },
    /** Population variance, or null when there were too few readings. */
    result(): number | null {
      return count >= MOTION_MIN_SAMPLES ? m2 / count : null;
    },
  };
}
