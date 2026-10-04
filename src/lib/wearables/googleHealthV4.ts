// Google Health API v4 (https://health.googleapis.com/v4): endpoint constants, response shapes and
// converters into WatchSample rows. Read-only scopes. No credentials and no client code live here.
import type { WatchSample } from "./types";

export const GOOGLE_HEALTH_BASE = "https://health.googleapis.com/v4/users/me";

/** Read-only scopes needed for steps, heart rate and sleep. */
export const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
] as const;

/** The API limits heart-rate queries to 14 days per request. */
export const HEART_RATE_MAX_RANGE_DAYS = 14;

export type HealthDataPoint = {
  steps?: { interval?: { startTime?: string; endTime?: string }; count?: string | number };
  heartRate?: { sampleTime?: { physicalTime?: string }; beatsPerMinute?: string | number };
  sleep?: { interval?: { startTime?: string; endTime?: string } };
};

export type HealthListResponse = {
  dataPoints?: HealthDataPoint[];
  nextPageToken?: string;
};

const SOURCE = "google-health";
const MINUTE = 60_000;

function toMs(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toNumber(value?: string | number): number | null {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function stepPointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const point of points) {
    const start = toMs(point.steps?.interval?.startTime);
    const end = toMs(point.steps?.interval?.endTime);
    const count = toNumber(point.steps?.count);
    if (start === null || end === null || count === null) continue;
    rows.push({
      metric: "steps",
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      value: count,
      source: SOURCE,
    });
  }
  return rows;
}

/** Heart-rate readings, thinned to the first reading of each minute (the rules count minutes). */
export function heartRatePointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const byMinute = new Map<number, WatchSample>();
  for (const point of points) {
    const at = toMs(point.heartRate?.sampleTime?.physicalTime);
    const bpm = toNumber(point.heartRate?.beatsPerMinute);
    if (at === null || bpm === null || bpm <= 0) continue;
    const minute = Math.floor(at / MINUTE);
    if (byMinute.has(minute)) continue;
    const iso = new Date(at).toISOString();
    byMinute.set(minute, {
      metric: "heartRate",
      startAt: iso,
      endAt: iso,
      value: bpm,
      source: SOURCE,
    });
  }
  return [...byMinute.values()];
}

export function sleepPointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const point of points) {
    const start = toMs(point.sleep?.interval?.startTime);
    const end = toMs(point.sleep?.interval?.endTime);
    if (start === null || end === null || end <= start) continue;
    rows.push({
      metric: "sleepSession",
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      value: (end - start) / MINUTE,
      source: SOURCE,
    });
  }
  return rows;
}
