import { describe, expect, it } from "vitest";
import { buildDemoWatchDays } from "../demoWatchDays";
import { getDayStatuses } from "@/lib/patterns/watchStatus";
import { buildReport } from "@/lib/report/buildReport";
import { buildDemoState } from "@/lib/demo-data/buildDemoState";
import { todayKey, addDays } from "@/lib/dates";

describe("pipeline verification", () => {
  it("verifies watch demo data, parent day statuses and doctor report generation", () => {
    // 1. Generate watch days
    const days = buildDemoWatchDays();
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

    // 3. Doctor Report with watch data
    const appState = buildDemoState();
    const watchState = { days, lastSyncAt: new Date().toISOString(), isDemo: true };
    const report = buildReport(appState, today, watchState);

    expect(report.watch).toBeDefined();
    if (report.watch) {
      expect(report.watch.series.length).toBeGreaterThan(0);
      expect(report.watch.validDays).toBeGreaterThan(14);
      expect(report.watch.steps.median).toBeGreaterThan(5000);
      expect(report.watch.restingHr.median).toBeGreaterThan(50);
      expect(report.watch.sleepHours.median).toBeGreaterThan(6);
      expect(report.crossComparison).toBeDefined();
    }
  });
});
