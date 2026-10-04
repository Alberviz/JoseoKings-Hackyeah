import { DAY_TONE_LABELS, WEARABLE_STATUS_COPY, type DayTone } from "@/content/wearable-summary";
import { addDays } from "@/lib/dates";
import { evaluateParentStatus, type MetricEvaluation } from "@/lib/wearables/parentStatus";
import type { WearableDay } from "@/types/wearable";
import type { DateRange } from "./types";

export type DayStatus = {
  date: string;
  tone: DayTone;
  label: string;
  /** One plain sentence on why. */
  sentence: string;
  /** How many wearable metrics were outside the child's usual range that day. */
  outsideCount: number;
  /** The longest run of consecutive outside days ending that day, over any one metric. */
  longestStreak: number;
};

const SUSTAINED_STREAK_DAYS = 3;

function phrase(metric: MetricEvaluation): string | null {
  if (!metric.outsideRange) return null;
  const direction =
    metric.band === "below" || metric.band === "above"
      ? metric.band
      : (metric.deviation ?? 0) < 0
        ? "below"
        : "above";
  const copy = WEARABLE_STATUS_COPY;
  if (metric.metric === "sleep") return direction === "below" ? copy.sleepBelow : copy.sleepAbove;
  if (metric.metric === "steps") return direction === "below" ? copy.stepsBelow : copy.stepsAbove;
  return direction === "above" ? copy.hrAbove : copy.hrBelow;
}

function joinPhrases(phrases: string[]): string {
  const text = phrases.join(" and ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
}

function unknownStatus(date: string): DayStatus {
  return {
    date,
    tone: "unknown",
    label: DAY_TONE_LABELS.unknown,
    sentence: WEARABLE_STATUS_COPY.unknownSentence,
    outsideCount: 0,
    longestStreak: 0,
  };
}

/**
 * Status of one local day: the wearable metrics against the child's own usual range
 * (reuses evaluateParentStatus). Days without usable wearable data are "unknown", never imputed.
 */
export function getDayStatus(wearableDays: WearableDay[], date: string): DayStatus {
  const upToDate = wearableDays.filter((day) => day.date <= date);
  const today = upToDate.find((day) => day.date === date);
  if (!today || (!today.dayComplete && !today.nightComplete)) return unknownStatus(date);

  const result = evaluateParentStatus(
    upToDate.map((day) => ({
      date: day.date,
      steps: day.dayComplete ? day.steps : null,
      sleepMinutes: day.nightComplete ? day.sleepMinutes : null,
      restingHr: day.nightComplete ? day.restingHr : null,
    })),
    { targetDate: date },
  );
  if (result.status === "collectingBaseline") return unknownStatus(date);

  const metrics = Object.values(result.metrics);
  const outside = metrics.filter((metric) => metric.outsideRange);
  const longestStreak = Math.max(0, ...outside.map((metric) => metric.consecutiveOutsideDays));
  const phrases = outside.map(phrase).filter((text): text is string => text !== null);

  let tone: DayTone = "usual";
  if (outside.length >= 2 || longestStreak >= SUSTAINED_STREAK_DAYS) tone = "clearlyDifferent";
  else if (outside.length === 1) tone = "slightlyDifferent";

  return {
    date,
    tone,
    label: DAY_TONE_LABELS[tone],
    sentence: phrases.length > 0 ? joinPhrases(phrases) : WEARABLE_STATUS_COPY.usualSentence,
    outsideCount: outside.length,
    longestStreak,
  };
}

/** One status per calendar day in the range, in order. */
export function getDayStatuses(wearableDays: WearableDay[], range: DateRange): DayStatus[] {
  const statuses: DayStatus[] = [];
  for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
    statuses.push(getDayStatus(wearableDays, date));
  }
  return statuses;
}
