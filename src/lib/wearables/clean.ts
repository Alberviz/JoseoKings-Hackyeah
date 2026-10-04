// A1 — Hampel cleaning.
// Centred window of W = 7 days (k-3 ... k+3), using only valid days inside it;
// at least 5 non-missing values required, otherwise no replacement is attempted.
// sigma = 1.4826 * MAD. Strict replacement: |x - m| > 3 * sigma.

import { median } from "./stats";

const WINDOW = 7;
const MIN_POINTS = 5;
const CONSISTENCY = 1.4826;
const THRESHOLD = 3;

export type HampelResult = {
  values: (number | null)[];
  replacedIndices: number[];
};

export function hampel(
  series: (number | null | undefined)[],
  options: { window?: number; minPoints?: number; threshold?: number } = {},
): HampelResult {
  const windowSize = options.window ?? WINDOW;
  const minPoints = options.minPoints ?? MIN_POINTS;
  const threshold = options.threshold ?? THRESHOLD;
  const half = Math.floor(windowSize / 2);

  const original = series.map((value) =>
    value === null || value === undefined || Number.isNaN(value) ? null : value,
  );

  const replacedIndices: number[] = [];
  const values = original.map((value, index) => {
    if (value === null) return null;

    const inWindow: number[] = [];
    for (let i = index - half; i <= index + half; i += 1) {
      if (i < 0 || i >= original.length) continue;
      const v = original[i];
      if (v !== null) inWindow.push(v);
    }

    if (inWindow.length < minPoints) return value;

    const center = median(inWindow);
    if (center === null) return value;

    const mad = median(inWindow.map((point) => Math.abs(point - center)));
    if (mad === null) return value;

    const sigma = CONSISTENCY * mad;
    if (sigma > 0 && Math.abs(value - center) > threshold * sigma) {
      replacedIndices.push(index);
      return center;
    }

    return value;
  });

  return { values, replacedIndices };
}
