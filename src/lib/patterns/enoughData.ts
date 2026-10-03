import { MIN_ANSWERED_DAYS } from "./constants";
import type { DaySummary, EnoughDataResult } from "./types";

/**
 * Checks whether the summaries contain at least MIN_ANSWERED_DAYS (14) answered days.
 * When enough is false, consumer screens must display "not enough data yet".
 */
export function hasEnoughData(summaries: DaySummary[]): EnoughDataResult {
  const answeredDays = summaries.filter((summary) => summary.checkInStatus === "answered").length;

  return {
    enough: answeredDays >= MIN_ANSWERED_DAYS,
    answeredDays,
  };
}
