// Google Health API v4 (https://health.googleapis.com/v4): endpoint constants, response shapes and
// converters into WatchSample rows. Read-only scopes. No credentials and no client code live here.
// Numbers (int64) come back from the API as strings, so every number goes through toNumber().
import { describeDevice } from "./devices";
import type { WatchSample } from "./types";

export const GOOGLE_HEALTH_BASE = "https://health.googleapis.com/v4/users/me";

/** Read-only scopes needed for steps, heart rate, resting heart rate and sleep. */
export const GOOGLE_HEALTH_SCOPES = [
  "https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly",
  "https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly",
  "https://www.googleapis.com/auth/googlehealth.sleep.readonly",
] as const;

/** The API limits heart-rate queries to 14 days per request. */
export const HEART_RATE_MAX_RANGE_DAYS = 14;

export type HealthDataSource = {
  recordingMethod?: string;
  device?: {
    /** Open string: the documented values differ between pages (PHONE, WATCH, WRISTBAND, ...). */
    formFactor?: string;
    manufacturer?: string;
    model?: string;
    uid?: string;
  };
  application?: {
    packageName?: string;
    name?: string;
  };
  platform?: string;
};

type Interval = {
  startTime?: string;
  endTime?: string;
  civilStartTime?: unknown;
  civilEndTime?: unknown;
};

/** A calendar date as a "YYYY-MM-DD" string or as a Google Date object. */
export type GoogleDate = string | { year?: number; month?: number; day?: number };

export type HealthDataPoint = {
  steps?: { interval?: Interval; count?: string | number };
  heartRate?: {
    sampleTime?: { physicalTime?: string; utcOffset?: string; civilTime?: unknown };
    beatsPerMinute?: string | number;
  };
  dailyRestingHeartRate?: { date?: GoogleDate; beatsPerMinute?: string | number };
  sleep?: {
    interval?: Interval;
    type?: string;
    summary?: { minutesAsleep?: string | number; minutesAwake?: string | number };
    metadata?: { nap?: boolean; mainSleep?: boolean };
  };
  dataSource?: HealthDataSource;
};

export type HealthListResponse = {
  dataPoints?: HealthDataPoint[];
  nextPageToken?: string;
};

const MINUTE = 60_000;

function toMs(iso?: string): number | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function toNumber(value?: string | number | null): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function sourceId(point: HealthDataPoint): string {
  return describeDevice(point.dataSource).id;
}

/** "YYYY-MM-DD" from a string or a Google Date object; null when it is not a real date. */
export function googleDateToKey(date: GoogleDate | undefined): string | null {
  if (typeof date === "string") return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
  if (!date || typeof date !== "object") return null;
  const { year, month, day } = date;
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  const m = month as number;
  const d = day as number;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${String(year).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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
      source: sourceId(point),
    });
  }
  return rows;
}

/** Heart-rate readings, thinned to the first reading of each minute (the rules count minutes). */
export function heartRatePointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const byMinute = new Map<string, WatchSample>();
  for (const point of points) {
    const at = toMs(point.heartRate?.sampleTime?.physicalTime);
    const bpm = toNumber(point.heartRate?.beatsPerMinute);
    if (at === null || bpm === null || bpm <= 0) continue;
    const minute = Math.floor(at / MINUTE);
    const source = sourceId(point);
    const key = `${minute}:${source}`;
    if (byMinute.has(key)) continue;
    const iso = new Date(at).toISOString();
    byMinute.set(key, {
      metric: "heartRate",
      startAt: iso,
      endAt: iso,
      value: bpm,
      source,
    });
  }
  return [...byMinute.values()];
}

/** Sleep sessions. Naps are skipped. The value is the minutes asleep when given, else the session length. */
export function sleepPointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const point of points) {
    // Some apps flag a long main sleep as a nap too; only skip naps that are not the main sleep.
    const meta = point.sleep?.metadata;
    if (meta?.nap === true && meta.mainSleep !== true) continue;
    const start = toMs(point.sleep?.interval?.startTime);
    const end = toMs(point.sleep?.interval?.endTime);
    if (start === null || end === null || end <= start) continue;
    const asleep = toNumber(point.sleep?.summary?.minutesAsleep);
    rows.push({
      metric: "sleepSession",
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      value: asleep !== null && asleep >= 0 ? asleep : (end - start) / MINUTE,
      source: sourceId(point),
    });
  }
  return rows;
}

/** The resting heart rate the watch reports for a day. startAt and endAt hold the local date. */
export function dailyRestingHrPointsToRows(points: HealthDataPoint[]): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const point of points) {
    const date = googleDateToKey(point.dailyRestingHeartRate?.date);
    const bpm = toNumber(point.dailyRestingHeartRate?.beatsPerMinute);
    if (date === null || bpm === null || bpm <= 0) continue;
    rows.push({
      metric: "restingHrDaily",
      startAt: date,
      endAt: date,
      value: bpm,
      source: sourceId(point),
    });
  }
  return rows;
}
