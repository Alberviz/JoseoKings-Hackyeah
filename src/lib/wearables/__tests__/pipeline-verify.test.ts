import { describe, expect, it } from "vitest";
import { buildDemoWearableDays } from "../demoWearableDays";
import { getDayStatuses } from "@/lib/patterns/wearableStatus";
import { buildReport } from "@/lib/report/buildReport";
import { buildDemoState } from "@/lib/demo-data/buildDemoState";
import { todayKey, addDays } from "@/lib/dates";

describe("pipeline verification", () => {
  it("verifies wearable demo data, parent day statuses and doctor report generation", () => {
    // 1. Generate wearable days
    const days = buildDemoWearableDays();
    expect(days).toHaveLength(28);
    expect(days[0].steps).toBeGreaterThan(5000);
    expect(days[0].restingHr).toBeGreaterThan(50);
    expect(days[0].sleepMinutes).toBeGreaterThan(400);

    // 2. Parent getDayStatuses
    const today = todayKey();
    const last7 = getDayStatuses(days, { from: addDays(today, -6), to: today });
    expect(last7).toHaveLength(7);
    for (const s of last7) {
      expect(["usual", "slightlyDifferent", "clearlyDifferent", "unknown"]).toContain(s.tone);
      expect(s.label).toBeDefined();
      expect(s.sentence).toBeDefined();
    }

    // 3. Doctor Report with wearable data
    const appState = buildDemoState();
    const wearableState = { days, lastSyncAt: new Date().toISOString(), isDemo: true };
    const report = buildReport(appState, today, wearableState);

    expect(report.wearable).toBeDefined();
    if (report.wearable) {
      expect(report.wearable.series.length).toBeGreaterThan(0);
      expect(report.wearable.validDays).toBeGreaterThan(14);
      expect(report.wearable.steps.median).toBeGreaterThan(5000);
      expect(report.wearable.restingHr.median).toBeGreaterThan(50);
      expect(report.wearable.sleepHours.median).toBeGreaterThan(6);
      expect(report.crossComparison).toBeDefined();
    }
  });
});
