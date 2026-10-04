/**
 * Browser-only client for the Google Health API (v4).
 *
 * Runs 100% in the user's browser without requiring a backend server.
 * Follows the privacy guardrails established in docs/DECISIONS.md & docs/PRODUCT.md:
 * - Read-only scopes.
 * - Health metrics stay entirely on the client device (localStorage / in-memory).
 * - Zero transmission to any server or third-party analytics.
 */

import {
  GOOGLE_HEALTH_BASE,
  HEART_RATE_MAX_RANGE_DAYS,
  heartRatePointsToRows,
  sleepPointsToRows,
  stepPointsToRows,
  type HealthDataPoint,
  type HealthListResponse,
} from "./googleHealthV4";
import { ALGORITHM_VERSION, computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { DailyMetric, WatchSample, WearableMetric } from "./types";

export interface GoogleHealthReadOptions {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
  timeZone?: string;
  baseUrl?: string;
  selectedDevice?: string | null;
}

/** What happened when one metric was requested. Callers decide how to show a failed metric. */
export type MetricFetchStatus =
  | { status: "ok" }
  | { status: "http-error"; httpStatus: number }
  | { status: "network-error"; message: string }
  | { status: "invalid-response" };

export type FetchedMetricKey = WearableMetric | "sleep";

export interface GoogleHealthResult {
  samples: WatchSample[];
  dailyMetrics: DailyMetric[];
  devices?: string[];
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
const MAX_PAGES = 20;

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
    if (res.status === 401 || res.status === 403) {
      throw new GoogleHealthError(res.status, "Authentication failed or permissions denied");
    }
    if (!res.ok) throw new MetricFailure({ status: "http-error", httpStatus: res.status });

    const data = (await res.json().catch(() => null)) as HealthListResponse | null;
    if (!data || typeof data !== "object") throw new MetricFailure({ status: "invalid-response" });
    points.push(...(data.dataPoints ?? []));
    pageToken = data.nextPageToken || undefined;
    if (!pageToken) break;
  }
  return points;
}

function timeFilter(field: string, startMillis: number, endMillis: number): string {
  const start = new Date(startMillis).toISOString();
  const end = new Date(endMillis).toISOString();
  return `${field} >= "${start}" AND ${field} < "${end}"`;
}

/**
 * Reads steps, heart rate and sleep sessions directly from the browser
 * using the parent's OAuth access token.
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
  const metricStatus: Partial<Record<FetchedMetricKey, MetricFetchStatus>> = {};

  async function run(key: FetchedMetricKey, load: () => Promise<WatchSample[]>): Promise<void> {
    try {
      rows.push(...(await load()));
      metricStatus[key] = { status: "ok" };
    } catch (err) {
      if (err instanceof MetricFailure) {
        metricStatus[key] = err.outcome;
        return;
      }
      throw err;
    }
  }

  await run("steps", async () =>
    stepPointsToRows(
      await listAll(baseUrl, headers, {
        dataType: "steps",
        filter: timeFilter("steps.interval.start_time", startTimeMillis, endTimeMillis),
        pageSize: PAGE_SIZE,
      }),
    ),
  );

  // Heart rate: the API accepts at most 14 days per request.
  await run("heartRate", async () => {
    const out: WatchSample[] = [];
    const chunk = HEART_RATE_MAX_RANGE_DAYS * DAY_MS;
    let field = "heart_rate.interval.start_time";

    for (let from = startTimeMillis; from < endTimeMillis; from += chunk) {
      const to = Math.min(from + chunk, endTimeMillis);
      let points: HealthDataPoint[];
      try {
        points = await listAll(baseUrl, headers, {
          dataType: "heart-rate",
          filter: timeFilter(field, from, to),
          pageSize: PAGE_SIZE,
        });
      } catch (err) {
        if (
          err instanceof MetricFailure &&
          err.outcome.status === "http-error" &&
          err.outcome.httpStatus === 400 &&
          field === "heart_rate.interval.start_time"
        ) {
          field = "heart_rate.sample_time.physical_time";
          points = await listAll(baseUrl, headers, {
            dataType: "heart-rate",
            filter: timeFilter(field, from, to),
            pageSize: PAGE_SIZE,
          });
        } else {
          throw err;
        }
      }
      out.push(...heartRatePointsToRows(points));
    }
    return out;
  });

  await run("sleep", async () => {
    // Sleep is filtered by the civil day it ends; start one day early to keep a session that ends on day one.
    const fromDate = new Date(startTimeMillis - DAY_MS).toISOString().slice(0, 10);
    return sleepPointsToRows(
      await listAll(baseUrl, headers, {
        dataType: "sleep",
        filter: `sleep.interval.civil_end_time >= "${fromDate}"`,
        pageSize: SLEEP_PAGE_SIZE,
      }),
    );
  });

  // Compute local daily metrics directly in the browser
  const filteredRows = options.selectedDevice
    ? rows.filter((s) => s.source === options.selectedDevice)
    : rows;
  const dailyMetrics = computeDailyMetrics(filteredRows, timeZone);
  const devices = Array.from(new Set(rows.map((s) => s.source).filter(Boolean))).sort();

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
      sleepOnsetAt: `${dateStr}T22:30:00.000Z`,
      sleepOffsetAt: `${dateStr}T07:00:00.000Z`,
      algorithmVersion: ALGORITHM_VERSION,
      computedAt: new Date().toISOString(),
    });
  }

  return result;
}
