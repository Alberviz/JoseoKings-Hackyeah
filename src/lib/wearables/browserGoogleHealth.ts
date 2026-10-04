/**
 * Browser-only client for Google Health / Google Fit API.
 *
 * Runs 100% in the user's browser without requiring a backend server.
 * Follows the privacy guardrails established in docs/DECISIONS.md & docs/PRODUCT.md:
 * - Read-only scopes.
 * - Health metrics stay entirely on the client device (localStorage / IndexedDB / in-memory).
 * - Zero transmission to any server or third-party analytics.
 */

import { MINUTE_METRICS, type GoogleFitBucket, type SleepSessionResult } from "./googleFit";
import { minuteBucketsToRows, sleepToRows } from "./normalize";
import { computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { DailyMetricRow, WatchSampleRow, WearableMetric } from "./types";

export interface GoogleHealthReadOptions {
  accessToken: string;
  startTimeMillis: number;
  endTimeMillis: number;
  subjectId?: string;
  timeZone?: string;
  baseUrl?: string;
}

export interface GoogleHealthResult {
  samples: WatchSampleRow[];
  dailyMetrics: DailyMetricRow[];
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
  const {
    accessToken,
    startTimeMillis,
    endTimeMillis,
    subjectId = "demo-child-1",
    timeZone = DEFAULT_TIMEZONE,
  } = options;
  const baseUrl = options.baseUrl ?? DEFAULT_FITNESS_BASE;

  if (!accessToken) {
    throw new GoogleHealthError(401, "No access token provided");
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  const rows: WatchSampleRow[] = [];

  // 1. Fetch each minute metric (steps, heart rate, active minutes, calories, distance)
  for (const [metric, type] of Object.entries(MINUTE_METRICS)) {
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
        continue;
      }

      const data = (await res.json()) as { bucket?: GoogleFitBucket[] };
      const buckets = data.bucket ?? [];
      rows.push(...minuteBucketsToRows(metric as WearableMetric, buckets, subjectId));
    } catch (err) {
      if (err instanceof GoogleHealthError) throw err;
      // non-fatal per-metric network glitch
    }
  }

  // 2. Fetch sleep sessions
  const sessionUrl = new URL(`${baseUrl}/sessions`);
  sessionUrl.searchParams.set("startTime", new Date(startTimeMillis).toISOString());
  sessionUrl.searchParams.set("endTime", new Date(endTimeMillis).toISOString());
  sessionUrl.searchParams.set("activityType", "72"); // Sleep activity type

  try {
    const sessionRes = await fetch(sessionUrl.toString(), {
      method: "GET",
      headers,
    });

    if (sessionRes.ok) {
      const sessionData = (await sessionRes.json()) as {
        session?: Array<{
          id?: string;
          name?: string;
          description?: string;
          startTimeMillis: string;
          endTimeMillis: string;
          activityType: number;
          application?: { packageName?: string; name?: string };
        }>;
      };

      const sleepResults: SleepSessionResult[] = (sessionData.session ?? []).map((session) => ({
        session,
        points: [],
      }));

      rows.push(...sleepToRows(sleepResults, subjectId));
    }
  } catch {
    // If sleep endpoint is unavailable or permissions are restricted, continue with activity
  }

  // 3. Compute local daily metrics directly in the browser
  const dailyMetrics = computeDailyMetrics(rows, subjectId, timeZone);

  return {
    samples: rows,
    dailyMetrics,
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
export function getDemoWearableData(subjectId = "demo-child-1"): DailyMetricRow[] {
  const result: DailyMetricRow[] = [];
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
      subject_id: subjectId,
      local_date: dateStr,
      steps,
      valid_activity: true,
      hr_waking_hours_covered: 12,
      sleep_minutes: sleepMinutes,
      valid_sleep: true,
      resting_hr: restingHr,
      sleep_onset_at: `${dateStr}T22:30:00.000Z`,
      sleep_offset_at: `${dateStr}T07:00:00.000Z`,
      algorithm_version: "1.0.0",
      computed_at: new Date().toISOString(),
    });
  }

  return result;
}
