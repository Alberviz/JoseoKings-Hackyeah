import type { WatchDay } from "@/types/watch";
import { computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { WatchSample } from "./types";

/**
 * Raw watch samples -> one WatchDay per local day. Days before `fromDate` (YYYY-MM-DD) are dropped.
 * A missing value stays null; the two "complete" flags say whether the day or the night can be trusted.
 */
export function buildWatchDays(
  samples: WatchSample[],
  options: { timeZone?: string; fromDate?: string } = {},
): WatchDay[] {
  const { timeZone = DEFAULT_TIMEZONE, fromDate } = options;
  return computeDailyMetrics(samples, timeZone)
    .filter((m) => !fromDate || m.localDate >= fromDate)
    .map((m) => ({
      date: m.localDate,
      steps: m.steps,
      restingHr: m.restingHr,
      sleepMinutes: m.sleepMinutes,
      nightComplete: m.validSleep,
      dayComplete: m.validActivity,
    }));
}
