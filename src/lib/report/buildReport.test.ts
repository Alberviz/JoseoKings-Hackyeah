import { describe, expect, it } from "vitest";
import { QUESTION_IDS } from "@/config/content-ids";
import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import { addDays } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createDefaultEconomy } from "@/lib/economy";
import { confidenceLabel } from "@/lib/rewards";
import type { AppState, MissionCompany, ParentLog } from "@/types";
import { buildReport } from "./buildReport";

function makeEmptyState(): AppState {
  return {
    schemaVersion: 1,
    isDemo: false,
    child: null,
    settings: null,
    companion: {
      name: "Nova",
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
      equippedItemIds: [],
      badgeIds: [],
    },
    economy: createDefaultEconomy(),
    checkIns: [],
    missionLogs: [],
    parentLogs: [],
    foodEntries: [],
    consultations: [],
  };
}

describe("buildReport", () => {
  const TODAY = "2026-10-03";

  it("handles empty state with sensible defaults", () => {
    const state = makeEmptyState();
    const report = buildReport(state, TODAY);

    expect(report.childNickname).toBe("Lucas");
    expect(report.isDemo).toBe(false);
    expect(report.generatedDate).toBe(TODAY);
    expect(report.disclaimer).toBe(REPORT_DISCLAIMER);

    // Period defaults to 30 days ending today
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.totalDays).toBe(30);
    expect(report.period.previousConsultationDate).toBeNull();

    // Metrics are zero/null
    expect(report.metrics.checkInDaysCount).toBe(0);
    expect(report.metrics.checkInCompletionRate).toBe(0);
    expect(report.metrics.careDaysCount).toBe(0);
    expect(report.metrics.discomfortDaysCount).toBe(0);
    expect(report.metrics.avgSleepHours).toBeNull();
    expect(report.metrics.sleepRecordedDaysCount).toBe(0);
    expect(report.metrics.schoolImpactedDaysCount).toBe(0);

    // Activity
    expect(report.activity.totalMissionsCompleted).toBe(0);
    expect(report.activity.byConfidence).toEqual([
      { company: "alone", label: confidenceLabel("alone"), count: 0 },
      { company: "family", label: confidenceLabel("family"), count: 0 },
      { company: "other", label: confidenceLabel("other"), count: 0 },
    ]);

    expect(report.foodsOnDiscomfortDays).toEqual([]);
    expect(report.dayStrip).toHaveLength(30);
    expect(report.dayStrip[0].date).toBe(addDays(TODAY, -29));
    expect(report.dayStrip[29].date).toBe(TODAY);
    expect(report.dayStrip.every((d) => !d.hasCheckIn && !d.hadMissions && !d.hadDiscomfort)).toBe(
      true,
    );
  });

  it("defaults to 30 days when state has no consultations", () => {
    const state = makeEmptyState();
    const report = buildReport(state, TODAY);

    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(30);
    expect(report.period.previousConsultationDate).toBeNull();
  });

  it("calculates period correctly with 1 consultation in range", () => {
    const state = makeEmptyState();
    const consultationDate = addDays(TODAY, -15);
    state.consultations = [{ id: "c-1", date: consultationDate }];

    const report = buildReport(state, TODAY);

    expect(report.period.previousConsultationDate).toBe(consultationDate);
    expect(report.period.startDate).toBe(addDays(consultationDate, 1));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(15);
    expect(report.dayStrip).toHaveLength(15);
    expect(report.dayStrip[0].date).toBe(addDays(consultationDate, 1));
    expect(report.dayStrip[14].date).toBe(TODAY);
  });

  it("defaults to 30 days if last consultation was more than 90 days ago", () => {
    const state = makeEmptyState();
    const consultationDate = addDays(TODAY, -95);
    state.consultations = [{ id: "c-old", date: consultationDate }];

    const report = buildReport(state, TODAY);

    expect(report.period.previousConsultationDate).toBe(consultationDate);
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(30);
  });

  it("defaults to 30 days if last consultation is today", () => {
    const state = makeEmptyState();
    state.consultations = [{ id: "c-today", date: TODAY }];

    const report = buildReport(state, TODAY);

    expect(report.period.previousConsultationDate).toBe(TODAY);
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(30);
  });

  it("ignores future consultations and picks the closest prior one", () => {
    const state = makeEmptyState();
    state.consultations = [
      { id: "c-past-far", date: addDays(TODAY, -45) },
      { id: "c-future", date: addDays(TODAY, 5) },
      { id: "c-past-recent", date: addDays(TODAY, -10) },
    ];

    const report = buildReport(state, TODAY);

    expect(report.period.previousConsultationDate).toBe(addDays(TODAY, -10));
    expect(report.period.startDate).toBe(addDays(TODAY, -9));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(10);
  });

  it("calculates metrics accurately (check-in rate, care days, sleep average, school impact)", () => {
    const state = makeEmptyState();
    state.consultations = [{ id: "c-1", date: addDays(TODAY, -10) }]; // totalDays = 10

    // Check-ins: 4 inside period, 1 outside
    const d1 = addDays(TODAY, -9);
    const d2 = addDays(TODAY, -7);
    const d3 = addDays(TODAY, -5);
    const d4 = addDays(TODAY, -2);
    const dOutside = addDays(TODAY, -12);

    state.checkIns = [
      {
        id: "ci-1",
        date: d1,
        answers: {
          [QUESTION_IDS.bellyComfort]: 2, // discomfort!
          [QUESTION_IDS.energy]: 1,
          [QUESTION_IDS.playPace]: 2,
        },
        notToday: false,
        createdAt: `${d1}T10:00:00Z`,
      },
      {
        id: "ci-2",
        date: d2,
        answers: {
          [QUESTION_IDS.bellyComfort]: 0, // no discomfort
          [QUESTION_IDS.energy]: 0,
          [QUESTION_IDS.playPace]: 1,
        },
        notToday: false,
        createdAt: `${d2}T10:00:00Z`,
      },
      {
        id: "ci-3",
        date: d3,
        answers: {
          [QUESTION_IDS.bellyComfort]: "skipped",
        },
        notToday: true, // discomfort due to notToday!
        createdAt: `${d3}T10:00:00Z`,
      },
      {
        id: "ci-4",
        date: d4,
        answers: {
          [QUESTION_IDS.bellyComfort]: 1, // discomfort! (threshold is 1)
        },
        notToday: false,
        createdAt: `${d4}T10:00:00Z`,
      },
      {
        id: "ci-out",
        date: dOutside,
        answers: { [QUESTION_IDS.bellyComfort]: 2 },
        notToday: false,
        createdAt: `${dOutside}T10:00:00Z`,
      },
    ];

    // Mission logs:
    // d1: has check-in + mission log
    // d6: no check-in + mission log
    const d6 = addDays(TODAY, -4);
    state.missionLogs = [
      {
        id: "m-1",
        date: d1,
        missionId: "dragon-breathing",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: `${d1}T12:00:00Z`,
      },
      {
        id: "m-2",
        date: d6,
        missionId: "bed-stretch",
        status: "rest",
        company: "family",
        confirmedBy: "parent-pin",
        createdAt: `${d6}T12:00:00Z`,
      },
    ];

    // Parent logs:
    // sleep hours: 8, 7.5, 9, undefined
    // school: "home", "partial", "missed", "attended"
    state.parentLogs = [
      { date: d1, sleepHours: 8, school: "home" as ParentLog["school"] },
      { date: d2, sleepHours: 7.5, school: "partial" as ParentLog["school"] },
      { date: d3, sleepHours: 9, school: "missed" },
      { date: d4, school: "attended" }, // no sleepHours
      { date: dOutside, sleepHours: 10, school: "missed" }, // outside period
    ];

    const report = buildReport(state, TODAY);

    // check-in counts
    expect(report.metrics.checkInDaysCount).toBe(4);
    expect(report.metrics.checkInCompletionRate).toBe(4 / 10);

    // care days: d1, d2, d3, d4 (check-ins), plus d6 (mission log without check-in) => 5 days
    expect(report.metrics.careDaysCount).toBe(5);

    // discomfort days: d1 (bellyPain 3), d3 (notToday true), d4 (bellyPain 4) => 3 days
    expect(report.metrics.discomfortDaysCount).toBe(3);

    // sleep metrics: 3 logs in period with sleepHours (8 + 7.5 + 9) / 3 = 24.5 / 3 = 8.1666... -> 8.2
    expect(report.metrics.sleepRecordedDaysCount).toBe(3);
    expect(report.metrics.avgSleepHours).toBe(8.2);

    // school impact: "home", "partial", "missed" => 3 impacted days in period
    expect(report.metrics.schoolImpactedDaysCount).toBe(3);
  });

  it("groups activity by confidence and excludes rest or out-of-period missions", () => {
    const state = makeEmptyState();
    state.consultations = [{ id: "c-1", date: addDays(TODAY, -10) }]; // totalDays = 10

    const inDate1 = addDays(TODAY, -8);
    const inDate2 = addDays(TODAY, -3);
    const outDate = addDays(TODAY, -15);

    state.missionLogs = [
      {
        id: "m-1",
        date: inDate1,
        missionId: "m1",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: `${inDate1}T10:00:00Z`,
      },
      {
        id: "m-2",
        date: inDate1,
        missionId: "m2",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: `${inDate1}T11:00:00Z`,
      },
      {
        id: "m-3",
        date: inDate2,
        missionId: "m3",
        status: "completed",
        company: "family",
        confirmedBy: "parent-pin",
        createdAt: `${inDate2}T10:00:00Z`,
      },
      {
        id: "m-4",
        date: inDate2,
        missionId: "m4",
        status: "completed",
        company: "other",
        confirmedBy: "other-tap",
        createdAt: `${inDate2}T12:00:00Z`,
      },
      {
        id: "m-rest",
        date: inDate2,
        missionId: "m5",
        status: "rest", // Should NOT be counted in completed activity
        company: "family",
        confirmedBy: "parent-pin",
        createdAt: `${inDate2}T14:00:00Z`,
      },
      {
        id: "m-out",
        date: outDate,
        missionId: "m6",
        status: "completed", // Outside period
        company: "other",
        confirmedBy: "other-tap",
        createdAt: `${outDate}T10:00:00Z`,
      },
    ];

    const report = buildReport(state, TODAY);

    expect(report.activity.totalMissionsCompleted).toBe(4);
    expect(report.activity.byConfidence).toEqual([
      { company: "alone", label: "Done on their own", count: 2 },
      { company: "family", label: "Done with family", count: 1 },
      { company: "other", label: "Done with someone", count: 1 },
    ]);
  });

  it("extracts food co-occurrences on discomfort days sorted by frequency", () => {
    const state = makeEmptyState();
    state.consultations = [{ id: "c-1", date: addDays(TODAY, -10) }]; // totalDays = 10

    const badDay1 = addDays(TODAY, -8);
    const badDay2 = addDays(TODAY, -4);
    const goodDay = addDays(TODAY, -2);
    const outsideBadDay = addDays(TODAY, -15);

    state.checkIns = [
      {
        id: "ci-1",
        date: badDay1,
        answers: { [QUESTION_IDS.bellyComfort]: 1 },
        notToday: false,
        createdAt: `${badDay1}T10:00:00Z`,
      },
      {
        id: "ci-2",
        date: badDay2,
        answers: { [QUESTION_IDS.bellyComfort]: "skipped" },
        notToday: true,
        createdAt: `${badDay2}T10:00:00Z`,
      },
      {
        id: "ci-3",
        date: goodDay,
        answers: { [QUESTION_IDS.bellyComfort]: 0 },
        notToday: false,
        createdAt: `${goodDay}T10:00:00Z`,
      },
    ];

    state.foodEntries = [
      { id: "f-1", date: badDay1, text: "  Pizza  ", createdAt: `${badDay1}T12:00:00Z` },
      { id: "f-2", date: badDay1, text: "Ice cream", createdAt: `${badDay1}T13:00:00Z` },
      { id: "f-3", date: badDay2, text: "Pizza", createdAt: `${badDay2}T12:00:00Z` },
      { id: "f-4", date: badDay2, text: "Burger", createdAt: `${badDay2}T14:00:00Z` },
      { id: "f-5", date: goodDay, text: "Pizza", createdAt: `${goodDay}T12:00:00Z` }, // on good day, ignored
      { id: "f-6", date: outsideBadDay, text: "Pizza", createdAt: `${outsideBadDay}T12:00:00Z` }, // outside period, ignored
    ];

    const report = buildReport(state, TODAY);

    expect(report.foodsOnDiscomfortDays).toEqual([
      { text: "Pizza", count: 2 },
      { text: "Burger", count: 1 },
      { text: "Ice cream", count: 1 },
    ]);
  });

  it("works seamlessly with buildDemoState", () => {
    const demo = buildDemoState({ today: TODAY });
    const report = buildReport(demo, TODAY);

    expect(report.isDemo).toBe(true);
    expect(report.childNickname).toBe("Lucas");
    expect(report.generatedDate).toBe(TODAY);

    // In demo data, consultations are 80 and 30 days ago.
    // The closest prior consultation is 30 days ago.
    // Period start is 29 days ago, ending today => 30 days.
    expect(report.period.totalDays).toBe(30);
    expect(report.period.previousConsultationDate).toBe(addDays(TODAY, -30));
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.endDate).toBe(TODAY);

    expect(report.dayStrip).toHaveLength(30);
    expect(report.metrics.checkInDaysCount).toBeGreaterThan(15);
    expect(report.metrics.checkInCompletionRate).toBeGreaterThan(0.5);
    expect(report.metrics.careDaysCount).toBeGreaterThan(15);
    expect(report.metrics.discomfortDaysCount).toBeGreaterThan(0);
    expect(report.metrics.avgSleepHours).not.toBeNull();
    expect(typeof report.metrics.avgSleepHours).toBe("number");
    expect(report.metrics.sleepRecordedDaysCount).toBeGreaterThan(15);
    expect(report.metrics.schoolImpactedDaysCount).toBeGreaterThan(0);

    expect(report.activity.totalMissionsCompleted).toBeGreaterThan(0);
    expect(report.activity.byConfidence).toHaveLength(3);
    const companies: MissionCompany[] = ["alone", "family", "other"];
    expect(report.activity.byConfidence.map((c) => c.company)).toEqual(companies);
    expect(report.activity.byConfidence.reduce((sum, item) => sum + item.count, 0)).toBe(
      report.activity.totalMissionsCompleted,
    );

    expect(report.foodsOnDiscomfortDays.length).toBeGreaterThan(0);
    expect(report.disclaimer).toBe(REPORT_DISCLAIMER);
  });
});
