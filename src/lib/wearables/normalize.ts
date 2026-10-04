import type { GoogleFitBucket, SleepSessionResult } from "./googleFit";
import type { SleepStage, WatchSampleRow, WearableMetric } from "./types";

export const SLEEP_STAGES: Record<number, SleepStage> = {
  1: "awake",
  2: "sleep",
  3: "out_of_bed",
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
  subjectId = "",
): WatchSampleRow[] {
  const rows: WatchSampleRow[] = [];
  for (const bucket of buckets) {
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        const [first, second, third] = point.value ?? [];
        const value = numeric(first);
        if (value === null) continue;
        const isSummary = point.dataTypeName?.endsWith(".summary");
        rows.push({
          subject_id: subjectId,
          metric,
          start_at: nanosToIso(point.startTimeNanos),
          end_at: nanosToIso(point.endTimeNanos),
          value,
          value_max: isSummary ? numeric(second) : null,
          value_min: isSummary ? numeric(third) : null,
          stage: null,
          source: point.originDataSourceId || dataset.dataSourceId || "unknown",
        });
      }
    }
  }
  return rows;
}

/** Sleep sessions -> one `sleep_session` row per session plus one `sleep_segment` row per segment. */
export function sleepToRows(sessions: SleepSessionResult[], subjectId = ""): WatchSampleRow[] {
  const rows: WatchSampleRow[] = [];
  for (const { session, points } of sessions) {
    const source = session.application?.packageName || session.application?.name || "unknown";
    rows.push({
      subject_id: subjectId,
      metric: "sleep_session",
      start_at: msToIso(session.startTimeMillis),
      end_at: msToIso(session.endTimeMillis),
      value: (Number(session.endTimeMillis) - Number(session.startTimeMillis)) / 60_000,
      value_max: null,
      value_min: null,
      stage: null,
      source,
    });
    for (const point of points) {
      const code = numeric(point.value?.[0]);
      rows.push({
        subject_id: subjectId,
        metric: "sleep_segment",
        start_at: nanosToIso(point.startTimeNanos),
        end_at: nanosToIso(point.endTimeNanos),
        value: Number(BigInt(point.endTimeNanos) - BigInt(point.startTimeNanos)) / 1e9 / 60,
        value_max: null,
        value_min: null,
        stage:
          (code !== null ? SLEEP_STAGES[code] : null) ?? (code !== null ? `unknown_${code}` : null),
        source: point.originDataSourceId || source,
      });
    }
  }
  return rows;
}

/** Drops exact duplicates (same metric, source and start) keeping the last one, as the DB upsert would. */
export function dedupe<T extends { metric: string; source: string; start_at: string }>(
  rows: T[],
): T[] {
  const byKey = new Map<string, T>();
  for (const row of rows) {
    byKey.set(`${row.metric}|${row.source}|${row.start_at}`, row);
  }
  return [...byKey.values()];
}
