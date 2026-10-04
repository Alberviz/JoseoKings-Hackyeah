import { CORE_QUESTION_SCALE } from "@/config/content-ids";
import type { AppState } from "@/types";
import type { WearableDay, WearableState } from "@/types/wearable";
import { getDaySummaries } from "./daySummaries";
import type { CheckInStatus, DateRange } from "./types";

export type WearableJoinRow = {
  date: string;
  checkInStatus: CheckInStatus;
  bellyComfort: number | null;
  energy: number | null;
  playPace: number | null;
  /** Completed missions for the day, or null when no mission was logged at all. */
  missionsCompleted: number | null;
  /** Sleep hours entered by the family, or null. */
  familySleepHours: number | null;
  /** The wearable record for the day, or null when the wearable has none. Never imputed. */
  wearable: WearableDay | null;
};

/** Joins, per local day, the child's answers, missions, parent log and wearable data. Gaps stay null. */
export function joinDaysWithWearable(
  state: AppState,
  wearable: WearableState,
  range: DateRange,
): WearableJoinRow[] {
  const wearableByDate = new Map(wearable.days.map((day) => [day.date, day]));
  const missionDates = new Set(state.missionLogs.map((log) => log.date));
  return getDaySummaries(state, range).map((day) => ({
    date: day.date,
    checkInStatus: day.checkInStatus,
    bellyComfort: day.bellyComfort,
    energy: day.energy,
    playPace: day.playPace,
    missionsCompleted: missionDates.has(day.date) ? day.missions.completed : null,
    familySleepHours: day.sleepHours,
    wearable: wearableByDate.get(day.date) ?? null,
  }));
}

export const MIN_COMPARE_PAIRS = 7;

export type ChildWearableComparison =
  | { enough: false; pairs: number }
  | { enough: true; pairs: number; shorterNights: number; totalTired: number };

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Counts, over the period, how many days the child marked low energy had a night
 * (the night ending that morning) shorter than the median of every complete wearable night in the period.
 * Needs at least MIN_COMPARE_PAIRS days with both an energy answer and a complete wearable night.
 * Descriptive only: no causal claim.
 */
export function compareChildWithWearable(rows: WearableJoinRow[]): ChildWearableComparison {
  const withNight: Array<{ energy: number | null; sleep: number }> = [];
  for (const row of rows) {
    if (row.wearable?.nightComplete && row.wearable.sleepMinutes !== null) {
      withNight.push({ energy: row.energy, sleep: row.wearable.sleepMinutes });
    }
  }
  const pairs = withNight.filter((item) => item.energy !== null);
  if (pairs.length < MIN_COMPARE_PAIRS) return { enough: false, pairs: pairs.length };

  const periodMedian = median(withNight.map((item) => item.sleep));
  const tired = pairs.filter((item) => item.energy === CORE_QUESTION_SCALE.max);
  return {
    enough: true,
    pairs: pairs.length,
    shorterNights: tired.filter((item) => item.sleep < periodMedian).length,
    totalTired: tired.length,
  };
}
