import { addDays, weekdayIndex } from "@/lib/dates";
import type { DateKey } from "@/types";
import type { DaySummary, WeekSummary } from "./types";

function average(values: (number | null)[]): number | null {
  const valid = values.filter((value): value is number => value !== null);
  if (valid.length === 0) {
    return null;
  }
  const sum = valid.reduce((acc, curr) => acc + curr, 0);
  return sum / valid.length;
}

/**
 * Groups day summaries into calendar weeks (Monday to Sunday) and computes weekly series:
 * weekStart, answeredDays, and averages over days that have values. Never invents values.
 */
export function getWeeklySeries(summaries: DaySummary[]): WeekSummary[] {
  if (summaries.length === 0) {
    return [];
  }

  const weeksMap = new Map<DateKey, DaySummary[]>();

  for (const summary of summaries) {
    const weekStart = addDays(summary.date, -weekdayIndex(summary.date));
    const existing = weeksMap.get(weekStart);
    if (existing) {
      existing.push(summary);
    } else {
      weeksMap.set(weekStart, [summary]);
    }
  }

  const sortedWeekStarts = Array.from(weeksMap.keys()).sort();

  return sortedWeekStarts.map((weekStart) => {
    const days = weeksMap.get(weekStart) ?? [];

    const answeredDays = days.filter((day) => day.checkInStatus === "answered").length;

    const bellyComfort = average(days.map((day) => day.bellyComfort));
    const energy = average(days.map((day) => day.energy));
    const playPace = average(days.map((day) => day.playPace));
    const sleepHours = average(days.map((day) => day.sleepHours));

    return {
      weekStart,
      answeredDays,
      bellyComfort,
      energy,
      playPace,
      sleepHours,
    };
  });
}
