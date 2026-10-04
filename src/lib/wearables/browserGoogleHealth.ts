/**
 * Browser-only client for the Google Health API (v4).
 *
 * Runs 100% in the user's browser without requiring a backend server.
 * Follows the privacy guardrails established in docs/DECISIONS.md & docs/PRODUCT.md:
 * - Read-only scopes.
 * - Health metrics stay entirely on the client device (localStorage / in-memory).
 * - Zero transmission to any server or third-party analytics.
 */

import type { DeviceMetric, WatchDevice } from "@/types/watch";
import { addDays } from "./stats";
import { filterSamplesByDeviceSelection } from "./buildWatchDays";
import { buildDeviceList, resolveDeviceSelection, type DevicePoints } from "./devices";
import {
  dailyRestingHrPointsToRows,
  GOOGLE_HEALTH_BASE,
  HEART_RATE_MAX_RANGE_DAYS,
  heartRatePointsToRows,
  sleepPointsToRows,
  stepPointsToRows,
  type HealthDataPoint,
  type HealthListResponse,
} from "./googleHealthV4";
import { ALGORITHM_VERSION, computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { DailyMetric, WatchSample } from "./types";
import { localDateTime } from "./validity";

export interface GoogleHealthReadOptions {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
  timeZone?: string;
  baseUrl?: string;
}

/** What happened when one metric was requested. Callers decide how to show a failed metric. */
export type MetricFetchStatus =
  | { status: "ok"; count?: number }
  | { status: "http-error"; httpStatus: number; reason?: string; message?: string }
  | { status: "network-error"; message: string }
  | { status: "invalid-response" };

export type FetchedMetricKey = "steps" | "heartRate" | "sleep" | "restingHrDaily";

export interface GoogleHealthResult {
  samples: WatchSample[];
  dailyMetrics: DailyMetric[];
  /** Devices that sent data, with the metrics each one has. */
  devices: WatchDevice[];
  /** One entry per requested metric. A metric that failed has no samples and a non-"ok" status. */
  metricStatus: Partial<Record<FetchedMetricKey, MetricFetchStatus>>;
  range: {
    startMillis: number;
    endMillis: number;
  };
  sampleCount: number;
}

export class GoogleHealthError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(`Google Health API error (${status}): ${message}`);
    this.name = "GoogleHealthError";
    this.status = status;
    this.details = details;
  }
}

const DAY_MS = 86_400_000;
const PAGE_SIZE = 10_000;
const SLEEP_PAGE_SIZE = 25;
const DAILY_PAGE_SIZE = 25;
const MAX_PAGES = 20;
const MAX_ERROR_MESSAGE = 200;

type ListSpec = {
  dataType: string;
  filter: string;
  pageSize: number;
};

class MetricFailure extends Error {
  constructor(readonly outcome: MetricFetchStatus) {
    super("metric failed");
  }
}

/** Reads `{ error: { message, details: [{ reason }] } }` from a failed response, if there is one. */
async function readErrorBody(res: Response): Promise<{ reason?: string; message?: string }> {
  try {
    if (typeof res.json !== "function") return {};
    const body = (await res.json()) as {
      error?: { message?: unknown; details?: Array<{ reason?: unknown }> };
    } | null;
    const out: { reason?: string; message?: string } = {};
    const details = body?.error?.details;
    const reason = Array.isArray(details)
      ? details.find((d) => typeof d?.reason === "string")?.reason
      : undefined;
    if (typeof reason === "string") out.reason = reason;
    const message = body?.error?.message;
    if (typeof message === "string") out.message = message.slice(0, MAX_ERROR_MESSAGE);
    return out;
  } catch {
    return {};
  }
}

async function listAll(
  baseUrl: string,
  headers: Record<string, string>,
  spec: ListSpec,
): Promise<HealthDataPoint[]> {
  const points: HealthDataPoint[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = new URL(`${baseUrl}/dataTypes/${spec.dataType}/dataPoints`);
    url.searchParams.set("filter", spec.filter);
    url.searchParams.set("pageSize", String(spec.pageSize));
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    let res: Response;
    try {
      res = await fetch(url.toString(), { method: "GET", headers });
    } catch (err) {
      throw new MetricFailure({
        status: "network-error",
        message: err instanceof Error ? err.message : "Request failed",
      });
    }
    if (res.status === 401) {
      throw new GoogleHealthError(res.status, "Authentication failed or permissions denied");
    }
    if (!res.ok) {
      throw new MetricFailure({
        status: "http-error",
        httpStatus: res.status,
        ...(await readErrorBody(res)),
      });
    }

    const data = (await res.json().catch(() => null)) as HealthListResponse | null;
    if (!data || typeof data !== "object") throw new MetricFailure({ status: "invalid-response" });
    points.push(...(data.dataPoints ?? []));
    pageToken = data.nextPageToken || undefined;
    if (!pageToken) break;
  }
  return points;
}

/** Physical-time filter: RFC3339 instants ending in Z, only >= and <. */
function timeFilter(field: string, startMillis: number, endMillis: number): string {
  const start = new Date(startMillis).toISOString();
  const end = new Date(endMillis).toISOString();
  return `${field} >= "${start}" AND ${field} < "${end}"`;
}

/**
 * Reads steps, heart rate, the watch's daily resting heart rate and sleep sessions directly from
 * the browser using the parent's OAuth access token.
 */
export async function fetchBrowserGoogleHealth(
  options: GoogleHealthReadOptions,
): Promise<GoogleHealthResult> {
  const { accessToken, startTimeMillis, endTimeMillis, timeZone = DEFAULT_TIMEZONE } = options;
  const baseUrl = options.baseUrl ?? GOOGLE_HEALTH_BASE;

  if (!accessToken) {
    throw new GoogleHealthError(401, "No access token provided");
  }

  const headers = { Authorization: `Bearer ${accessToken}` };
  const rows: WatchSample[] = [];
  const devicePoints: DevicePoints = {};
  const metricStatus: Partial<Record<FetchedMetricKey, MetricFetchStatus>> = {};

  async function run(
    key: FetchedMetricKey,
    deviceMetric: DeviceMetric,
    load: () => Promise<{ points: HealthDataPoint[]; rows: WatchSample[] }>,
  ): Promise<void> {
    try {
      const loaded = await load();
      rows.push(...loaded.rows);
      devicePoints[deviceMetric] = [...(devicePoints[deviceMetric] ?? []), ...loaded.points];
      metricStatus[key] = { status: "ok", count: loaded.rows.length };
    } catch (err) {
      if (err instanceof MetricFailure) {
        metricStatus[key] = err.outcome;
        return;
      }
      throw err;
    }
  }

  await run("steps", "steps", async () => {
    const points = await listAll(baseUrl, headers, {
      dataType: "steps",
      filter: timeFilter("steps.interval.start_time", startTimeMillis, endTimeMillis),
      pageSize: PAGE_SIZE,
    });
    return { points, rows: stepPointsToRows(points) };
  });

  // Heart rate is a sample type: it is filtered by its sample time. At most 14 days per request.
  await run("heartRate", "heartRate", async () => {
    const points: HealthDataPoint[] = [];
    const chunk = HEART_RATE_MAX_RANGE_DAYS * DAY_MS;
    for (let from = startTimeMillis; from < endTimeMillis; from += chunk) {
      const to = Math.min(from + chunk, endTimeMillis);
      points.push(
        ...(await listAll(baseUrl, headers, {
          dataType: "heart-rate",
          filter: timeFilter("heart_rate.sample_time.physical_time", from, to),
          pageSize: PAGE_SIZE,
        })),
      );
    }
    return { points, rows: heartRatePointsToRows(points) };
  });

  // The watch's own resting heart rate per day. Daily types are filtered by civil date, never mixed with instants.
  await run("restingHrDaily", "heartRate", async () => {
    const fromDate = localDateTime(startTimeMillis, timeZone).date;
    const toDate = addDays(localDateTime(endTimeMillis, timeZone).date, 1);
    const points = await listAll(baseUrl, headers, {
      dataType: "daily-resting-heart-rate",
      filter: `daily_resting_heart_rate.date >= "${fromDate}" AND daily_resting_heart_rate.date < "${toDate}"`,
      pageSize: DAILY_PAGE_SIZE,
    });
    return { points, rows: dailyRestingHrPointsToRows(points) };
  });

  await run("sleep", "sleep", async () => {
    // Sleep is filtered by the civil day it ends; start one day early to keep a session that ends on day one.
    const fromDate = localDateTime(startTimeMillis - DAY_MS, timeZone).date;
    const points = await listAll(baseUrl, headers, {
      dataType: "sleep",
      filter: `sleep.interval.civil_end_time >= "${fromDate}"`,
      pageSize: SLEEP_PAGE_SIZE,
    });
    return { points, rows: sleepPointsToRows(points) };
  });

  // Daily figures with the automatic device per metric, so steps are never summed across devices.
  // The caller rebuilds them when the parent picks other devices.
  // A 403 on one data type (for example a box left unticked) only loses that metric; on every type it means no access.
  const statuses = Object.values(metricStatus);
  if (
    statuses.length > 0 &&
    statuses.every((m) => m?.status === "http-error" && m.httpStatus === 403)
  ) {
    throw new GoogleHealthError(403, "Authentication failed or permissions denied");
  }

  const devices = buildDeviceList(devicePoints);
  const dailyMetrics = computeDailyMetrics(
    filterSamplesByDeviceSelection(rows, resolveDeviceSelection(devices)),
    timeZone,
  );

  return {
    samples: rows,
    dailyMetrics,
    devices,
    metricStatus,
    range: {
      startMillis: startTimeMillis,
      endMillis: endTimeMillis,
    },
    sampleCount: rows.length,
  };
}

/**
 * Returns deterministic demo wearable metrics (30 days) for instant offline presentation,
 * strictly labelled as "Demo data" per PRODUCT.md §5.1.
 */
export function getDemoWearableData(): DailyMetric[] {
  const result: DailyMetric[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    // Realistic pediatric baseline values
    // Median ~8,500 steps, sleep ~510 min (8.5h), resting HR ~72 bpm
    const steps = 8000 + Math.round(Math.sin(i * 0.5) * 1200 + ((i * 37) % 700));
    const restingHr = 71 + Math.round(Math.cos(i * 0.4) * 4);
    const sleepMinutes = 490 + ((i * 19) % 50);

    result.push({
      localDate: dateStr,
      steps,
      validActivity: true,
      hrWakingHoursCovered: 12,
      sleepMinutes: sleepMinutes,
      validSleep: true,
      restingHr: restingHr,
      restingHrSource: "night-samples",
      sleepOnsetAt: `${dateStr}T22:30:00.000Z`,
      sleepOffsetAt: `${dateStr}T07:00:00.000Z`,
      algorithmVersion: ALGORITHM_VERSION,
      computedAt: new Date().toISOString(),
    });
  }

  return result;
}
