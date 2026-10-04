// Aggregation of raw wearable samples into daily metrics partitioned by local civil day.
import { nocturnalRestingHr } from "./restingHr";
import type { DailyMetric, WearableSample } from "./types";
import { assessNight, localDateTime } from "./validity";

export const DEFAULT_TIMEZONE = "Europe/Madrid";
export const ALGORITHM_VERSION = "1.0.0";

export function computeDailyMetrics(
  samples: WearableSample[],
  timeZone: string = DEFAULT_TIMEZONE,
): DailyMetric[] {
  // Group samples by local day
  const days = new Set<string>();

  // Extract samples by metric and day
  const stepsByDay = new Map<string, number>();
  const hrSamplesByDay = new Map<string, Array<{ bpm: number; timestamp: number }>>();
  const sleepSessions: Array<{
    start: number;
    end: number;
    source: string;
    isMainSleep?: boolean;
  }> = [];
  // The resting heart rate the wearable reports for a local date (startAt holds YYYY-MM-DD).
  const wearableRestingHrByDay = new Map<string, number>();

  for (const sample of samples) {
    if (sample.metric === "restingHrDaily") {
      const date = sample.startAt.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(sample.value)) {
        days.add(date);
        if (!wearableRestingHrByDay.has(date)) wearableRestingHrByDay.set(date, sample.value);
      }
      continue;
    }
    const startMs = new Date(sample.startAt).getTime();
    const endMs = new Date(sample.endAt).getTime();
    const local = localDateTime(startMs, timeZone);
    const day = local.date;

    if (sample.metric === "steps") {
      days.add(day);
      stepsByDay.set(day, (stepsByDay.get(day) ?? 0) + sample.value);
    } else if (sample.metric === "heartRate") {
      days.add(day);
      let list = hrSamplesByDay.get(day);
      if (!list) {
        list = [];
        hrSamplesByDay.set(day, list);
      }
      list.push({ bpm: sample.value, timestamp: startMs });
    } else if (sample.metric === "sleepSession") {
      // Sleep sessions belong to the day they end
      const endLocal = localDateTime(endMs, timeZone);
      days.add(endLocal.date);
      sleepSessions.push({
        start: startMs,
        end: endMs,
        source: sample.source,
        ...(sample.isMainSleep !== undefined ? { isMainSleep: sample.isMainSleep } : {}),
      });
    } else {
      days.add(day);
    }
  }

  const sortedDays = [...days].sort();
  const dailyMetrics: DailyMetric[] = [];

  for (const day of sortedDays) {
    const steps = stepsByDay.get(day) ?? null;
    const hrSamples = hrSamplesByDay.get(day) ?? [];

    // Count distinct waking hours [07:00, 23:00) with HR
    const wakingHours = new Set<number>();
    for (const s of hrSamples) {
      const l = localDateTime(s.timestamp, timeZone);
      if (l.date === day && l.hour >= 7 && l.hour < 23) {
        wakingHours.add(l.hour);
      }
    }
    const hrWakingHours = wakingHours.size;
    const validActivity = hrWakingHours >= 10;

    // Night assessment
    // Also include HR samples from adjacent night window (18:00 of prev day to 14:00 of this day)
    const prevDay = sortedDays[sortedDays.indexOf(day) - 1];
    const prevHr = prevDay ? (hrSamplesByDay.get(prevDay) ?? []) : [];
    const nightHr = [...prevHr, ...hrSamples];

    const night = assessNight(nightHr, sleepSessions, day, timeZone);
    const validSleep = night.nightValid;
    let sleepMinutes: number | null = null;
    let sleepOnsetAt: string | null = null;
    let sleepOffsetAt: string | null = null;
    let restingHr: number | null = null;
    let restingHrSource: DailyMetric["restingHrSource"] = null;
    let restingHrMethod: DailyMetric["restingHrMethod"] = null;
    let restingHrGapMin: number | null = null;

    if (night.mainSleep) {
      sleepMinutes = Math.round(night.mainSleep.durationMin * 10) / 10;
      sleepOnsetAt = new Date(night.mainSleep.start).toISOString();
      sleepOffsetAt = new Date(night.mainSleep.end).toISOString();

      const rhrResult = nocturnalRestingHr(nightHr, night.mainSleep);
      if (rhrResult.kind === "value" && rhrResult.nRhr !== null) {
        restingHr = Math.round(rhrResult.nRhr * 10) / 10;
        restingHrSource = "night-samples";
        restingHrMethod = rhrResult.method;
        restingHrGapMin = rhrResult.medianGapMin;
      }
    }
    // Our own night figure comes first; the wearable's own daily figure only fills a gap.
    if (restingHr === null) {
      const fromWearable = wearableRestingHrByDay.get(day);
      if (fromWearable !== undefined) {
        restingHr = fromWearable;
        restingHrSource = "wearable-daily";
      }
    }

    dailyMetrics.push({
      localDate: day,
      steps: steps !== null ? Math.round(steps) : null,
      hrWakingHoursCovered: hrWakingHours > 0 ? hrWakingHours : null,
      restingHr,
      restingHrSource,
      restingHrMethod,
      restingHrGapMin,
      sleepMinutes,
      sleepOnsetAt,
      sleepOffsetAt,
      validActivity,
      validSleep,
      computedAt: new Date().toISOString(),
      algorithmVersion: ALGORITHM_VERSION,
    });
  }

  return dailyMetrics;
}
