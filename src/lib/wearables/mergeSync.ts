// Merges the result of one sync into what is already saved, metric by metric.
// A metric that could not be read in this sync keeps its saved values; only metrics that were read
// are overwritten. Pure functions: no React, no storage.
import type { DeviceMetric, WearableDay, WearableDevice } from "@/types/wearable";
import type { FetchedMetricKey, MetricFetchStatus } from "./browserGoogleHealth";
import type { WearableSample } from "./types";

type StatusMap = Partial<Record<FetchedMetricKey, MetricFetchStatus>>;

const SAMPLE_METRICS: Record<FetchedMetricKey, WearableSample["metric"][]> = {
  steps: ["steps"],
  heartRate: ["heartRate"],
  restingHrDaily: ["restingHrDaily"],
  sleep: ["sleepSession", "sleepSegment"],
};

const DEVICE_METRIC_OF: Record<FetchedMetricKey, DeviceMetric> = {
  steps: "steps",
  heartRate: "heartRate",
  restingHrDaily: "heartRate",
  sleep: "sleep",
};

function keysWhere(
  metricStatus: StatusMap,
  test: (status: MetricFetchStatus) => boolean,
): Set<FetchedMetricKey> {
  const keys = new Set<FetchedMetricKey>();
  for (const [key, value] of Object.entries(metricStatus) as [
    FetchedMetricKey,
    MetricFetchStatus | undefined,
  ][]) {
    if (value && test(value)) keys.add(key);
  }
  return keys;
}

/** The metrics that were requested but not read (any status other than "ok"). */
export function failedMetrics(metricStatus: StatusMap): Set<FetchedMetricKey> {
  return keysWhere(metricStatus, (s) => s.status !== "ok");
}

/** The metrics that were read only in part because the page limit was reached. */
export function partialMetrics(metricStatus: StatusMap): Set<FetchedMetricKey> {
  return keysWhere(metricStatus, (s) => s.status === "ok" && s.partial === true);
}

/**
 * New days from this sync, with the saved value kept for every field that depends on a metric
 * that failed. Fields built from a partly read metric are marked as not complete.
 */
export function mergeSyncedDays(
  stored: WearableDay[],
  incoming: WearableDay[],
  failed: Set<FetchedMetricKey>,
  partial: Set<FetchedMetricKey> = new Set(),
): WearableDay[] {
  const byDate = new Map(stored.map((d) => [d.date, d]));
  const stepsFailed = failed.has("steps");
  const sleepFailed = failed.has("sleep");
  const heartFailed = failed.has("heartRate");
  const dailyHrFailed = failed.has("restingHrDaily");
  const dayPartial = partial.has("steps") || partial.has("heartRate");
  const nightPartial = partial.has("sleep") || partial.has("heartRate");

  return incoming.map((day) => {
    const old = byDate.get(day.date);
    let out: WearableDay = day;
    if (old) {
      out = { ...day };
      if (stepsFailed) out.steps = old.steps;
      if (sleepFailed) out.sleepMinutes = old.sleepMinutes;
      // Resting heart rate comes from the night readings (heart rate + sleep); the wearable's own
      // daily figure only fills a gap, so losing it only matters when nothing else was found.
      if (heartFailed || sleepFailed || (dailyHrFailed && day.restingHr === null)) {
        out.restingHr = old.restingHr;
        out.restingHrSource = old.restingHrSource;
        out.restingHrMethod = old.restingHrMethod;
        out.restingHrGapMin = old.restingHrGapMin;
      }
      if (heartFailed) out.dayComplete = old.dayComplete;
      if (heartFailed || sleepFailed) out.nightComplete = old.nightComplete;
    }
    if (dayPartial) out = { ...out, dayComplete: false };
    if (nightPartial) out = { ...out, nightComplete: false };
    return out;
  });
}

/** Saved samples of the metrics that failed, plus every sample read in this sync. */
export function mergeRawSamples(
  stored: WearableSample[] | undefined,
  incoming: WearableSample[],
  failed: Set<FetchedMetricKey>,
): WearableSample[] {
  if (failed.size === 0 || !stored) return incoming;
  const kept = new Set<WearableSample["metric"]>();
  for (const key of failed) for (const metric of SAMPLE_METRICS[key]) kept.add(metric);
  return [...stored.filter((s) => kept.has(s.metric)), ...incoming];
}

/** Devices of this sync, plus what the saved devices had for the metrics that failed. */
export function mergeDevices(
  stored: WearableDevice[] | undefined,
  incoming: WearableDevice[],
  failed: Set<FetchedMetricKey>,
): WearableDevice[] {
  if (failed.size === 0 || !stored || stored.length === 0) return incoming;
  const failedDeviceMetrics = new Set<DeviceMetric>();
  for (const key of failed) failedDeviceMetrics.add(DEVICE_METRIC_OF[key]);

  const byId = new Map<string, WearableDevice>(
    incoming.map((d) => [
      d.id,
      { ...d, metrics: [...d.metrics], sampleCounts: { ...d.sampleCounts } },
    ]),
  );
  for (const old of stored) {
    const kept = old.metrics.filter((m) => failedDeviceMetrics.has(m));
    if (kept.length === 0) continue;
    const target: WearableDevice = byId.get(old.id) ?? { ...old, metrics: [], sampleCounts: {} };
    const counts = target.sampleCounts ?? {};
    for (const metric of kept) {
      if (!target.metrics.includes(metric)) target.metrics.push(metric);
      const count = old.sampleCounts?.[metric];
      if (count !== undefined) counts[metric] = count;
    }
    target.sampleCounts = counts;
    byId.set(old.id, target);
  }
  return [...byId.values()];
}
