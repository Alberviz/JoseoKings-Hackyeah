import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { compareChildWithWatch, MIN_PAIRED_DAYS } from "./crossComparison";
import type { DayStripEntry, WatchDailyPoint } from "./types";

function days(n: number, belly: (i: number) => number | null): DayStripEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    date: addDays("2026-09-01", i),
    hasCheckIn: true,
    notToday: false,
    bellyComfort: belly(i),
    energy: null,
    playPace: null,
    hadMissions: false,
    hadDiscomfort: false,
    hasParentLog: false,
  }));
}

function watch(n: number, steps: (i: number) => number): WatchDailyPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    date: addDays("2026-09-01", i),
    steps: steps(i),
    restingHr: null,
    sleepHours: null,
  }));
}

describe("compareChildWithWatch", () => {
  it("returns nothing with too few paired days", () => {
    const n = MIN_PAIRED_DAYS - 1;
    expect(
      compareChildWithWatch(
        days(n, (i) => i % 3),
        watch(n, (i) => i * 100),
      ),
    ).toEqual([]);
  });

  it("finds a perfect rank correlation with its interval and N", () => {
    const n = 20;
    const rows = compareChildWithWatch(
      days(n, (i) => i),
      watch(n, (i) => i * 100),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ source: "Child", metric: "Steps", n, rho: 1 });
    expect(rows[0].low).toBeLessThanOrEqual(rows[0].rho);
    expect(rows[0].high).toBeGreaterThanOrEqual(rows[0].rho);
  });

  it("is deterministic and skips days without a value", () => {
    const n = 20;
    const d = days(n, (i) => (i < 4 ? null : i % 5));
    const w = watch(n, (i) => (i * 37) % 11);
    const a = compareChildWithWatch(d, w);
    expect(a).toEqual(compareChildWithWatch(d, w));
    expect(a[0].n).toBe(16);
  });
});
