import type { GoogleFitBucket, SleepSessionResult } from "./googleFit";
import type { SleepStage, WatchSample, WearableMetric } from "./types";

export const SLEEP_STAGES: Record<number, SleepStage> = {
  1: "awake",
  2: "sleep",
  3: "outOfBed",
  4: "light",
  5: "deep",
  6: "rem",
};

const nanosToIso = (nanos: string): string =>
  new Date(Number(BigInt(nanos) / BigInt(1000000))).toISOString();

const msToIso = (ms: string | number): string => new Date(Number(ms)).toISOString();

function numeric(v?: { intVal?: number; fpVal?: number } | null): number | null {
  if (!v) return null;
  if (typeof v.intVal === "number") return v.intVal;
  if (typeof v.fpVal === "number") return v.fpVal;
  return null;
}

/**
 * Minute buckets -> one row per non-empty bucket. Empty buckets are skipped, never filled:
 * "no row" means "the watch sent nothing for that minute".
 * Summary types (heart rate, SpO2) carry [average, max, min].
 */
export function minuteBucketsToRows(
  metric: WearableMetric,
  buckets: GoogleFitBucket[],
): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const bucket of buckets) {
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        const [first, second, third] = point.value ?? [];
        const value = numeric(first);
        if (value === null) continue;
        const isSummary = point.dataTypeName?.endsWith(".summary");
        rows.push({
          metric,
          startAt: nanosToIso(point.startTimeNanos),
          endAt: nanosToIso(point.endTimeNanos),
          value,
          valueMax: isSummary ? numeric(second) : null,
          valueMin: isSummary ? numeric(third) : null,
          stage: null,
          source: point.originDataSourceId || dataset.dataSourceId || "unknown",
        });
      }
    }
  }
  return rows;
}

/** Sleep sessions -> one `sleepSession` row per session plus one `sleepSegment` row per segment. */
export function sleepToRows(sessions: SleepSessionResult[]): WatchSample[] {
  const rows: WatchSample[] = [];
  for (const { session, points } of sessions) {
    const source = session.application?.packageName || session.application?.name || "unknown";
    rows.push({
      metric: "sleepSession",
      startAt: msToIso(session.startTimeMillis),
      endAt: msToIso(session.endTimeMillis),
      value: (Number(session.endTimeMillis) - Number(session.startTimeMillis)) / 60_000,
      valueMax: null,
      valueMin: null,
      stage: null,
      source,
    });
    for (const point of points) {
      const code = numeric(point.value?.[0]);
      rows.push({
        metric: "sleepSegment",
        startAt: nanosToIso(point.startTimeNanos),
        endAt: nanosToIso(point.endTimeNanos),
        value: Number(BigInt(point.endTimeNanos) - BigInt(point.startTimeNanos)) / 1e9 / 60,
        valueMax: null,
        valueMin: null,
        stage:
          (code !== null ? SLEEP_STAGES[code] : null) ?? (code !== null ? `unknown_${code}` : null),
        source: point.originDataSourceId || source,
      });
    }
  }
  return rows;
}

/** Drops exact duplicates (same metric, source and start) keeping the last one. */
export function dedupe<T extends { metric: string; source: string; startAt: string }>(
  rows: T[],
): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    byKey.set(`${row.metric}|${row.source}|${row.startAt}`, row);
  }
  return [...byKey.values()];
}
