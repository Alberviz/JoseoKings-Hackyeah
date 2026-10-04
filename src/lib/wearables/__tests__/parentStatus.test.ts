import { describe, expect, it } from "vitest";
import {
  calculateWearableCoverage,
  type DailyParentInput,
  evaluateParentStatus,
} from "../parentStatus";

describe("parentStatus engine", () => {
  // Helper to build 14 baseline days + target days
  function buildBaselineDays(
    count = 14,
    baseSteps = 8000,
    baseSleep = 540,
    baseHr = 65,
  ): DailyParentInput[] {
    const days: DailyParentInput[] = [];
    for (let i = 1; i <= count; i += 1) {
      const dayNum = String(i).padStart(2, "0");
      days.push({
        date: `2026-05-${dayNum}`,
        bellyComfort: 0,
        energy: 0,
        playPace: 0,
        steps: baseSteps + (i % 3) * 50,
        sleepMinutes: baseSleep + (i % 2) * 10,
        restingHr: baseHr,
        daytimeValid: true,
        nightValid: true,
      });
    }
    return days;
  }

  it("reports 'usualRange' when metrics are within the usual range", () => {
    const history = buildBaselineDays(14);
    // Day 15: normal values
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      playPace: 0,
      steps: 8050,
      sleepMinutes: 540,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("usualRange");
    expect(result.label).toBe("Usual range");
    expect(result.descriptions).toEqual(
      expect.arrayContaining([
        "Last night's sleep was within the usual range.",
        "Steps were within the usual range.",
        "The child marked a comfortable belly today.",
      ]),
    );
  });

  it("reports 'differentFromUsual' on a departure from the usual range (|D_t| > 2)", () => {
    const history = buildBaselineDays(14);
    // Day 15: sleep significantly below usual (e.g. 360 min = 6h vs baseline ~9h)
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      playPace: 0,
      steps: 8000,
      sleepMinutes: 360,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("differentFromUsual");
    expect(result.label).toBe("Different from usual");
    expect(result.descriptions).toEqual(
      expect.arrayContaining(["Last night's sleep was below the usual range."]),
    );
  });

  it("describes what the child marked without changing the wearable status", () => {
    const history = buildBaselineDays(14);
    // Day 15: normal wearable metrics, but the child marks mild discomfort
    history.push({
      date: "2026-05-15",
      bellyComfort: 1,
      energy: 1,
      playPace: 0,
      steps: 8050,
      sleepMinutes: 540,
      restingHr: 65,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-15" });

    expect(result.status).toBe("usualRange");
    expect(result.descriptions).toEqual(
      expect.arrayContaining([
        "The child marked a little belly discomfort today.",
        "The child marked feeling a little tired today.",
      ]),
    );
  });

  it("reports 'differentFromUsual' for 3+ consecutive days outside the usual range", () => {
    const history = buildBaselineDays(14);
    // Days 15, 16, 17: steps drop to 1500 (far below 8000 baseline)
    history.push({
      date: "2026-05-15",
      bellyComfort: 0,
      energy: 0,
      steps: 1500,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-16",
      bellyComfort: 0,
      energy: 0,
      steps: 1400,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-17",
      bellyComfort: 0,
      energy: 0,
      steps: 1300,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-17" });

    expect(result.status).toBe("differentFromUsual");
    expect(result.metrics.steps?.consecutiveOutsideDays).toBeGreaterThanOrEqual(3);
  });

  it("states a run of marked discomfort in neutral factual words", () => {
    const history = buildBaselineDays(14);
    // Days 15, 16, 17: discomfort reports
    history.push({
      date: "2026-05-15",
      bellyComfort: 1,
      energy: 0,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-16",
      bellyComfort: 2,
      energy: 1,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });
    history.push({
      date: "2026-05-17",
      bellyComfort: 1,
      energy: 1,
      steps: 8000,
      sleepMinutes: 540,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history, { targetDate: "2026-05-17" });

    expect(result.checkInSummary.consecutiveDiscomfortDays).toBe(3);
    expect(result.descriptions).toEqual(
      expect.arrayContaining(["The child marked belly discomfort on the last 3 days."]),
    );
  });

  it("reports wearable coverage as a share of days, not as a score", () => {
    const days: DailyParentInput[] = [
      { date: "2026-05-01", daytimeValid: true, nightValid: true },
      { date: "2026-05-02", daytimeValid: true, nightValid: false },
      { date: "2026-05-03", daytimeValid: false, nightValid: false },
      { date: "2026-05-04", daytimeValid: false, nightValid: false },
    ];

    const info = calculateWearableCoverage(days);
    expect(info.totalDays).toBe(4);
    expect(info.validDays).toBe(2);
    expect(info.coverage).toBe(0.5);
    expect(info.description).toBe("Wearable data was present on 2 of 4 days.");
    expect(info.description).not.toContain("%");
  });

  it("does not pull in days older than 28 calendar days after a long gap", () => {
    const old = buildBaselineDays(14); // 2026-05-01 to 2026-05-14
    // 25 days with no entries, then a new day 2026-06-09 (26 days after 05-14).
    const history = [...old, { ...old[0], date: "2026-06-09", steps: 1500 }];
    const result = evaluateParentStatus(history, { targetDate: "2026-06-09" });
    // Only 05-12 to 05-14 fall inside the 28 day look-back, so there is no baseline yet.
    expect(result.metrics.steps?.band).toBe("collecting-baseline");
    expect(result.status).toBe("collectingBaseline");
  });

  it("contains neutral descriptions with no advice, medical claims or flare forecasts", () => {
    const history = buildBaselineDays(14);
    history.push({
      date: "2026-05-15",
      bellyComfort: 2,
      energy: 2,
      steps: 1000,
      sleepMinutes: 300,
      daytimeValid: true,
      nightValid: true,
    });

    const result = evaluateParentStatus(history);
    const serialized = JSON.stringify(result).toLowerCase();

    // STRICTLY NO pseudo-medical claims, flare predictions, or fake indices
    const forbidden = [
      "flare",
      "crisis",
      "inflammation",
      "predict",
      "diagnos",
      "clinical",
      "attention",
      "alert",
      "warning",
      "should",
      "rest more",
      "hydrat",
      "medical team",
      "doctor",
      "stability index",
      "score",
      "%",
    ];

    for (const term of forbidden) {
      expect(serialized.includes(term)).toBe(false);
    }
  });

  it("handles empty arrays or collecting baseline gracefully", () => {
    const empty = evaluateParentStatus([]);
    expect(empty.status).toBe("collectingBaseline");
    expect(empty.wearableCoverage.coverage).toBe(0);

    const singleDay: DailyParentInput[] = [
      {
        date: "2026-05-01",
        bellyComfort: 0,
        energy: 0,
        steps: 7000,
        sleepMinutes: 480,
      },
    ];
    const singleRes = evaluateParentStatus(singleDay);
    expect(singleRes.status).toBe("collectingBaseline");
    expect(singleRes.metrics.sleep?.band).toBe("collecting-baseline");
  });
});
