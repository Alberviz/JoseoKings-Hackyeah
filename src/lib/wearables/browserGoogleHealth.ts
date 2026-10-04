/**
 * Browser-only client for Google Health / Google Fit API.
 *
 * Runs 100% in the user's browser without requiring a backend server.
 * Follows the privacy guardrails established in docs/DECISIONS.md & docs/PRODUCT.md:
 * - Read-only scopes.
 * - Health metrics stay entirely on the client device (localStorage / IndexedDB / in-memory).
 * - Zero transmission to any server or third-party analytics.
 */

import {
  MINUTE_METRICS,
  SLEEP_ACTIVITY_TYPE,
  type GoogleFitBucket,
  type GoogleFitSession,
  type SleepSessionResult,
} from "./googleFit";
import { minuteBucketsToRows, sleepToRows } from "./normalize";
import { ALGORITHM_VERSION, computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { DailyMetric, WatchSample, WearableMetric } from "./types";

export interface GoogleHealthReadOptions {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
  timeZone?: string;
  baseUrl?: string;
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

const DEFAULT_FITNESS_BASE = "https://www.googleapis.com/fitness/v1/users/me";

/**
 * Reads aggregated minute buckets and sleep sessions directly from the browser
 * using the parent's OAuth access token.
 */
export async function fetchBrowserGoogleHealth(
  options: GoogleHealthReadOptions,
): Promise<GoogleHealthResult> {
  const { accessToken, startTimeMillis, endTimeMillis, timeZone = DEFAULT_TIMEZONE } = options;
  const baseUrl = options.baseUrl ?? DEFAULT_FITNESS_BASE;

  if (!accessToken) {
    throw new GoogleHealthError(401, "No access token provided");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const rows: WatchSample[] = [];
  const metricStatus: Partial<Record<FetchedMetricKey, MetricFetchStatus>> = {};

  // 1. Fetch each minute metric (steps, heart rate, active minutes, calories, distance, SpO2)
  for (const [metric, type] of Object.entries(MINUTE_METRICS) as Array<[WearableMetric, string]>) {
    const aggregateBody = {
      aggregateBy: [{ dataTypeName: type }],
      bucketByTime: { durationMillis: 60_000 },
      startTimeMillis,
      endTimeMillis,
    };

    try {
      const res = await fetch(`${baseUrl}/dataset:aggregate`, {
        method: "POST",
        headers,
        body: JSON.stringify(aggregateBody),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new GoogleHealthError(res.status, "Authentication failed or permissions denied");
        }
        metricStatus[metric] = { status: "http-error", httpStatus: res.status };
        continue;
      }

      const data = (await res.json()) as { bucket?: GoogleFitBucket[] } | null;
      if (!data || typeof data !== "object") {
        metricStatus[metric] = { status: "invalid-response" };
        continue;
      }
      rows.push(...minuteBucketsToRows(metric, data.bucket ?? []));
      metricStatus[metric] = { status: "ok" };
    } catch (err) {
      if (err instanceof GoogleHealthError) throw err;
      metricStatus[metric] = {
        status: "network-error",
        message: err instanceof Error ? err.message : "Request failed",
      };
    }
  }

  // 2. Fetch sleep sessions
  const sessionUrl = new URL(`${baseUrl}/sessions`);
  sessionUrl.searchParams.set("startTime", new Date(startTimeMillis).toISOString());
  sessionUrl.searchParams.set("endTime", new Date(endTimeMillis).toISOString());
  sessionUrl.searchParams.set("activityType", String(SLEEP_ACTIVITY_TYPE));

  try {
    const sessionRes = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers,
    });

    if (sessionRes.status === 401 || sessionRes.status === 403) {
      throw new GoogleHealthError(sessionRes.status, "Authentication failed or permissions denied");
    }

    if (!sessionRes.ok) {
      metricStatus.sleep = { status: "http-error", httpStatus: sessionRes.status };
    } else {
      const sessionData = (await sessionRes.json()) as { session?: GoogleFitSession[] } | null;
      if (!sessionData || typeof sessionData !== "object") {
        metricStatus.sleep = { status: "invalid-response" };
      } else {
        const sleepResults: SleepSessionResult[] = (sessionData.session ?? []).map((session) => ({
          session,
          points: [],
        }));
        rows.push(...sleepToRows(sleepResults));
        metricStatus.sleep = { status: "ok" };
      }
    }
  } catch (err) {
    if (err instanceof GoogleHealthError) throw err;
    metricStatus.sleep = {
      status: "network-error",
      message: err instanceof Error ? err.message : "Request failed",
    };
  }

  // 3. Compute local daily metrics directly in the browser
  const dailyMetrics = computeDailyMetrics(rows, timeZone);

  return {
    samples: rows,
    dailyMetrics,
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
