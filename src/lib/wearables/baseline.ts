// Personal baseline, robust deviation, and outside-usual-range rules.
// D_t is internal. Bands are the three neutral words: below, within, above.

import { median, quartiles } from "./stats";

export const S_MIN = {
  nocturnalHr: 1.5,
  steps: 300,
  sleepMinutes: 15,
  sleepMidpointMinutes: 15,
};

const BASELINE_DAYS = 14;
const IQR_TO_SIGMA = 0.7413;

function isValue(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

export type RangeBand = "below" | "within" | "above";

/** |D| === 2 stays "within": uses strict inequalities. */
export function rangeBand(d: number): RangeBand {
  if (d < -2) return "below";
  if (d > 2) return "above";
  return "within";
}

export interface BaselineValueResult {
  kind: "value";
  median: number | null;
  q1: number | null;
  q3: number | null;
  iqr: number | null;
  s: number;
  d: number;
  band: RangeBand;
}

export interface BaselineInsufficientResult {
  kind: "insufficient-data";
  reason: "collecting-baseline" | "zero-scale";
  have: number;
  need: number;
}

export type BaselineResult = BaselineValueResult | BaselineInsufficientResult | null;

/**
 * Trailing median of the previous 14 non-missing days, excluding day t and every later day.
 * `breaks` are device/source change indices: the window does not
 * use days before the latest break at or before t, and collection restarts.
 */
export function personalBaseline(
  series: Array<number | null | undefined>,
  { sMin = S_MIN.nocturnalHr, breaks = [] }: { sMin?: number; breaks?: number[] } = {},
): BaselineResult[] {
  const orderedBreaks = [...breaks].sort((a, b) => a - b);
  return series.map((value, t) => {
    if (!isValue(value)) return null;
    let breakAt = -1;
    for (const point of orderedBreaks) {
      if (point <= t) breakAt = point;
      else break;
    }
    const previous: number[] = [];
    for (let i = t - 1; i >= 0 && previous.length < BASELINE_DAYS; i -= 1) {
      if (i < breakAt) break;
      if (!isValue(series[i])) continue;
      previous.push(series[i] as number);
    }
    if (previous.length < BASELINE_DAYS) {
      return {
        kind: "insufficient-data",
        reason: "collecting-baseline",
        have: previous.length,
        need: BASELINE_DAYS,
      };
    }
    const center = median(previous);
    const { q1, q3, iqr } = quartiles(previous);
    const s = Math.max(IQR_TO_SIGMA * (iqr ?? 0), sMin);
    if (!(s > 0) || center === null) {
      return {
        kind: "insufficient-data",
        reason: "zero-scale",
        have: previous.length,
        need: BASELINE_DAYS,
      };
    }
    const d = (value - center) / s;
    return {
      kind: "value",
      median: center,
      q1,
      q3,
      iqr,
      s,
      d,
      band: rangeBand(d),
    };
  });
}

/**
 * Rule 1: |D| > 3. Rule 2: in a block of 3 consecutive calendar days that all
 * have a D, at least 2 have |D| > 2 on the same side. A null day breaks the block.
 * Only the days that themselves sit past |D| > 2 are marked by rule 2.
 * Days without a D are not marked.
 */
export function outsideUsualRange(deviations: Array<number | null | undefined>): boolean[] {
  const marked = deviations.map(() => false);
  for (let i = 0; i < deviations.length; i += 1) {
    const d = deviations[i];
    if (typeof d === "number" && Math.abs(d) > 3) marked[i] = true;
  }
  for (let i = 0; i <= deviations.length - 3; i += 1) {
    const block = [deviations[i], deviations[i + 1], deviations[i + 2]];
    if (block.some((d) => typeof d !== "number")) continue;
    const nums = block as number[];
    if (nums.filter((d) => d > 2).length >= 2) {
      for (let k = 0; k < 3; k += 1) {
        if (nums[k] > 2) marked[i + k] = true;
      }
    }
    if (nums.filter((d) => d < -2).length >= 2) {
      for (let k = 0; k < 3; k += 1) {
        if (nums[k] < -2) marked[i + k] = true;
      }
    }
  }
  return marked;
}
