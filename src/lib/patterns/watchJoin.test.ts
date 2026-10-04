import { describe, expect, it } from "vitest";
import { QUESTION_IDS } from "@/config/content-ids";
import { addDays } from "@/lib/dates";
import { createEmptyState } from "@/lib/storage";
import type { AppState, CheckIn } from "@/types";
import type { WatchDay, WatchState } from "@/types/watch";
import {
  compareChildWithWatch,
  joinDaysWithWatch,
  MIN_COMPARE_PAIRS,
  type WatchJoinRow,
} from "./watchJoin";

const FROM = "2026-10-01";

function watchDay(date: string, sleepMinutes: number | null, nightComplete = true): WatchDay {
  return { date, steps: 4000, restingHr: 60, sleepMinutes, nightComplete, dayComplete: true };
}

function checkIn(date: string, energy: number): CheckIn {
  return {
    date,
    notToday: false,
    answers: { [QUESTION_IDS.energy]: energy },
  } as unknown as CheckIn;
}

function makeRows(sleeps: Array<[number | null, number | null]>): WatchJoinRow[] {
  return sleeps.map(([energy, sleep], i) => ({
    date: addDays(FROM, i),
    checkInStatus: energy === null ? "none" : "answered",
    bellyComfort: null,
    energy,
    playPace: null,
    missionsCompleted: null,
    familySleepHours: null,
    watch: sleep === null ? null : watchDay(addDays(FROM, i), sleep),
  }));
}

describe("joinDaysWithWatch", () => {
  it("joins per day and leaves gaps as null", () => {
    const state: AppState = { ...createEmptyState(), checkIns: [checkIn(FROM, 2)] };
    const watch: WatchState = {
      days: [watchDay(addDays(FROM, 1), 400, false)],
      lastSyncAt: null,
      isDemo: false,
    };
    const rows = joinDaysWithWatch(state, watch, { from: FROM, to: addDays(FROM, 2) });
    expect(rows).toHaveLength(3);
    expect(rows[0].energy).toBe(2);
    expect(rows[0].watch).toBeNull();
    expect(rows[0].missionsCompleted).toBeNull();
    expect(rows[1].watch?.nightComplete).toBe(false);
    expect(rows[1].energy).toBeNull();
    expect(rows[2].watch).toBeNull();
  });
});

describe("compareChildWithWatch", () => {
  it("is not enough below the minimum pairs", () => {
    const rows = makeRows(Array.from({ length: MIN_COMPARE_PAIRS - 1 }, () => [2, 400]));
    expect(compareChildWithWatch(rows)).toEqual({ enough: false, pairs: MIN_COMPARE_PAIRS - 1 });
  });

  it("ignores days without an answer, without a watch night or with a partial night", () => {
    const rows = makeRows(
      Array.from({ length: 10 }, (_, i) => [i % 2 ? null : 2, i % 3 ? 400 : null]),
    );
    rows[0] = { ...rows[0], watch: watchDay(rows[0].date, 300, false) };
    const result = compareChildWithWatch(rows);
    expect(result.enough).toBe(false);
  });

  it("counts tired days with a night shorter than the median", () => {
    // sleeps: 300 x2 (tired), 480 x5 (not tired / tired mix)
    const rows = makeRows([
      [2, 300],
      [2, 320],
      [0, 480],
      [1, 500],
      [2, 520],
      [0, 450],
      [1, 470],
      [0, 490],
    ]);
    const result = compareChildWithWatch(rows);
    expect(result).toEqual({ enough: true, pairs: 8, shorterNights: 2, totalTired: 3 });
  });
});
