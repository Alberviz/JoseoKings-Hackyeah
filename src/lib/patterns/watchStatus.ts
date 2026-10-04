import { DISCOMFORT_THRESHOLD } from "@/config/content-ids";
import { DAY_TONE_LABELS, WATCH_STATUS_COPY, type DayTone } from "@/content/watch-summary";
import { addDays } from "@/lib/dates";
import { evaluateParentStatus, type MetricEvaluation } from "@/lib/wearables/parentStatus";
import type { WatchDay } from "@/types/watch";
import type { DateRange } from "./types";

export type DayStatus = {
  date: string;
  tone: DayTone;
  label: string;
  /** One plain sentence on why. */
  sentence: string;
  /** How many watch metrics were outside the child's usual range that day. */
  outsideCount: number;
  /** The longest run of consecutive outside days ending that day, over any one metric. */
  longestStreak: number;
};

/** Number of consecutive days beyond usual before the emergency alert can fire. */
export const ALERT_STREAK_DAYS = 3;

function phrase(metric: MetricEvaluation): string | null {
  if (!metric.outsideRange) return null;
  const direction =
    metric.band === "below" || metric.band === "above"
      ? metric.band
      : (metric.deviation ?? 0) < 0
        ? "below"
        : "above";
  const copy = WATCH_STATUS_COPY;
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
    sentence: WATCH_STATUS_COPY.unknownSentence,
    outsideCount: 0,
    longestStreak: 0,
  };
}

/**
 * Status of one local day: the watch metrics against the child's own usual range
 * (reuses evaluateParentStatus). Days without usable watch data are "unknown", never imputed.
 */
export function getDayStatus(watchDays: WatchDay[], date: string): DayStatus {
  const upToDate = watchDays.filter((day) => day.date <= date);
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
  if (outside.length >= 2 || longestStreak >= ALERT_STREAK_DAYS) tone = "clearlyDifferent";
  else if (outside.length === 1) tone = "slightlyDifferent";

  return {
    date,
    tone,
    label: DAY_TONE_LABELS[tone],
    sentence: phrases.length > 0 ? joinPhrases(phrases) : WATCH_STATUS_COPY.usualSentence,
    outsideCount: outside.length,
    longestStreak,
  };
}

/** One status per calendar day in the range, in order. */
export function getDayStatuses(watchDays: WatchDay[], range: DateRange): DayStatus[] {
  const statuses: DayStatus[] = [];
  for (let date = range.from; date <= range.to; date = addDays(date, 1)) {
    statuses.push(getDayStatus(watchDays, date));
  }
  return statuses;
}

export type ChildCheckInInput = {
  bellyComfort: number | null;
};

export type ParentAlert = { alert: boolean; reason: string };

/**
 * True only for a sustained, clearly different watch pattern (the last ALERT_STREAK_DAYS days all
 * beyond the child's usual, the latest one clearly) together with belly discomfort marked by the child.
 * Descriptive only: the reason says what was recorded, never why.
 */
export function shouldAlertParent(
  days: WatchDay[],
  childCheckIn: ChildCheckInInput | null,
): ParentAlert {
  const none: ParentAlert = { alert: false, reason: "" };
  if (days.length === 0) return none;
  if (
    !childCheckIn ||
    childCheckIn.bellyComfort === null ||
    childCheckIn.bellyComfort < DISCOMFORT_THRESHOLD
  ) {
    return none;
  }
  const latest = [...days].sort((a, b) => a.date.localeCompare(b.date))[days.length - 1].date;
  const recent: DayStatus[] = [];
  for (let i = 0; i < ALERT_STREAK_DAYS; i += 1) {
    recent.push(getDayStatus(days, addDays(latest, -i)));
  }
  if (recent.some((status) => status.outsideCount === 0)) return none;
  if (recent[0].tone !== "clearlyDifferent") return none;
  return {
    alert: true,
    reason: `${recent[0].sentence} This was beyond usual for ${ALERT_STREAK_DAYS} days in a row, and the child marked belly discomfort.`,
  };
}
