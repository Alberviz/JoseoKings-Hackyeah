import { mulberry32, percentileInterval, resample, spearman } from "@/lib/wearables/stats";
import type { CrossComparisonRow, DayStripEntry, WearableDailyPoint } from "./types";

/** Fewer paired days than this and no correlation is shown. */
export const MIN_PAIRED_DAYS = 14;
const BOOTSTRAP_REPLICATES = 1000;
const SEED = 20261004;

type WearableMetricKey = "steps" | "restingHr" | "sleepHours";

const METRICS: { key: WearableMetricKey; label: string }[] = [
  { key: "steps", label: "Steps" },
  { key: "restingHr", label: "Resting heart rate at night" },
  { key: "sleepHours", label: "Sleep (wearable)" },
];

type Signal = {
  source: "Child" | "Family";
  label: string;
  value: (day: DayStripEntry) => number | null;
  /** Restrict to some wearable metrics; default is all of them. */
  only?: WearableMetricKey[];
};

const SIGNALS: Signal[] = [
  { source: "Child", label: "Belly comfort answer", value: (d) => d.bellyComfort },
  { source: "Child", label: "Energy answer", value: (d) => d.energy },
  {
    source: "Child",
    label: "Day with discomfort",
    value: (d) => (d.hasCheckIn ? (d.hadDiscomfort ? 1 : 0) : null),
  },
  {
    source: "Family",
    label: "School day affected",
    value: (d) => (d.schoolImpacted === undefined ? null : d.schoolImpacted ? 1 : 0),
  },
  {
    source: "Family",
    label: "Sleep logged",
    value: (d) => d.sleepHours ?? null,
    only: ["sleepHours"],
  },
];

function bootstrapInterval(xs: number[], ys: number[]): { low: number; high: number } | null {
  const rng = mulberry32(SEED);
  const idx = xs.map((_, i) => i);
  const rhos: number[] = [];
  for (let r = 0; r < BOOTSTRAP_REPLICATES; r += 1) {
    const pick = resample(idx, rng);
    const rho = spearman(
      pick.map((i) => xs[i]),
      pick.map((i) => ys[i]),
    );
    if (rho !== null) rhos.push(rho);
  }
  return rhos.length < BOOTSTRAP_REPLICATES / 2 ? null : percentileInterval(rhos);
}

/**
 * Child and family signals against wearable values, day by day (Spearman rho with a bootstrap
 * 95% interval). Only pairs with at least MIN_PAIRED_DAYS days are returned. Association only.
 */
export function compareChildWithWearable(
  days: DayStripEntry[],
  wearableSeries: WearableDailyPoint[],
): CrossComparisonRow[] {
  const wearableByDate = new Map(wearableSeries.map((w) => [w.date, w]));
  const rows: CrossComparisonRow[] = [];

  for (const signal of SIGNALS) {
    for (const metric of METRICS) {
      if (signal.only && !signal.only.includes(metric.key)) continue;
      const xs: number[] = [];
      const ys: number[] = [];
      for (const day of days) {
        const x = signal.value(day);
        const y = wearableByDate.get(day.date)?.[metric.key] ?? null;
        if (x !== null && y !== null) {
          xs.push(x);
          ys.push(y);
        }
      }
      if (xs.length < MIN_PAIRED_DAYS) continue;
      const rho = spearman(xs, ys);
      const interval = rho === null ? null : bootstrapInterval(xs, ys);
      if (rho === null || interval === null) continue;
      rows.push({
        source: signal.source,
        signal: signal.label,
        metric: metric.label,
        n: xs.length,
        rho: Math.round(rho * 100) / 100,
        low: Math.round(interval.low * 100) / 100,
        high: Math.round(interval.high * 100) / 100,
      });
    }
  }
  return rows;
}
