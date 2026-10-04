import { describe, expect, it } from "vitest";
import { consultationComparison, foodCooccurrence, periodCounts } from "../counts";
import { enumerateDates } from "../stats";

describe("counts (A10a, A12, A13, A14)", () => {
  it("computes food co-occurrence as counts only without statistical inference claims", () => {
    const out = foodCooccurrence([
      { bellyComfort: 2, foodEntries: [{ tags: ["dairy", "tomato"] }] },
      { bellyComfort: 1, foodEntries: [{ tags: ["dairy", "dairy"] }] },
      { bellyComfort: 1, foodEntries: [{ tags: ["fried"] }] },
      { bellyComfort: 0, foodEntries: [{ tags: ["dairy"] }] }, // comfortable day - ignored
      { bellyComfort: 2, foodEntries: [] },
      { bellyComfort: "notToday", foodEntries: [{ tags: ["dairy"] }] },
    ]);

    expect(out).toEqual({
      discomfortDays: 4,
      discomfortDaysWithFood: 3,
      tags: [
        { tag: "dairy", n: 2 },
        { tag: "fried", n: 1 },
        { tag: "tomato", n: 1 },
      ],
    });

    const blob = JSON.stringify(out).toLowerCase();
    for (const word of ["pvalue", "odds", "fisher", "trigger", "score", "rank"]) {
      expect(blob.includes(word)).toBe(false);
    }
  });

  it("calculates steady and answered counts strictly as discrete counts", () => {
    const none = periodCounts([{ bellyComfort: null, energy: null, playPace: null }]);
    expect(none.answeredDays).toBe(0);
    expect(none.notTodayDays).toBe(0);
    expect(none.steadyDays).toBe(0);

    const notToday = periodCounts([
      { bellyComfort: "notToday", energy: "notToday", playPace: "notToday" },
      { bellyComfort: "notToday", energy: "notToday", playPace: "notToday" },
    ]);
    expect(notToday.answeredDays).toBe(0);
    expect(notToday.notTodayDays).toBe(2);
    expect(notToday.steadyDays).toBe(0);

    const run = [
      { date: "2026-03-01", bellyComfort: 0, energy: 0, playPace: 0 },
      { date: "2026-03-02", bellyComfort: 0, energy: 0, playPace: 0 },
      { date: "2026-03-03", bellyComfort: 0, energy: 0, playPace: 0 },
    ];
    expect(periodCounts(run).longestSteadyRun.length).toBe(3);
    expect(periodCounts(run.slice(1)).longestSteadyRun.length).toBe(2);

    const gapped = periodCounts([run[0], { ...run[2] }]);
    expect(gapped.longestSteadyRun.length).toBe(1);

    const partial = periodCounts([{ bellyComfort: 0, energy: 0, playPace: "notToday" }]);
    expect(partial.answeredDays).toBe(1);
    expect(partial.steadyDays).toBe(0);
    expect(partial.comfortDays).toBe(1);
    expect(partial.items.playPace.notAnswered).toBe(1);
  });

  it("performs consultation period comparison and guards against insufficient data", () => {
    const p0Dates = enumerateDates("2026-01-01", "2026-02-15");
    const p1Dates = enumerateDates("2026-02-15", "2026-04-01");
    const series = [
      { date: "2026-01-01", value: 99 },
      ...p0Dates.map((date: string) => ({ date, value: 5 })),
      ...p1Dates.map((date: string, index: number) => ({
        date,
        value: index < 27 ? 10 : null,
      })),
    ];
    const suppressed = consultationComparison({
      consultations: ["2026-01-01", "2026-02-15"],
      today: "2026-04-01",
      series,
      seed: 1,
    });
    expect(suppressed.comparison.kind).toBe("insufficient-data");
    expect(suppressed.comparison.difference).toBeNull();
    expect(suppressed.period1.n).toBe(27);
  });
});
