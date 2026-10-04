import { describe, expect, it } from "vitest";
import { QUESTION_IDS } from "@/config/content-ids";
import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import { addDays } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createDefaultEconomy } from "@/lib/economy";
import { CORROBORATION_LABELS } from "@/lib/missions/corroboration";
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

    expect(report.childNickname).toBe("Child");
    expect(report.isDemo).toBe(false);
    expect(report.generatedDate).toBe(TODAY);
    expect(report.disclaimer).toBe(REPORT_DISCLAIMER);

    // Period defaults to 30 days ending today
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.totalDays).toBe(30);
    expect(report.period.previousConsultationDate).toBeNull();
    expect(report.period.nextAppointmentDate).toBeNull();

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
    expect(report.activity.byCorroboration).toEqual([
      { method: "wearable", label: CORROBORATION_LABELS.wearable, count: 0 },
      { method: "motion", label: CORROBORATION_LABELS.motion, count: 0 },
      { method: "none", label: "Self-reported only", count: 0 },
    ]);
    expect(report.activity.corroborationTotals).toEqual({ wearable: 0, motion: 0, none: 0 });

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

    expect(report.period.previousConsultationDate).toBeNull();
    expect(report.period.startDate).toBe(addDays(TODAY, -29));
    expect(report.period.endDate).toBe(TODAY);
    expect(report.period.totalDays).toBe(30);
  });

  it("defaults to 30 days if last consultation is today", () => {
    const state = makeEmptyState();
    state.consultations = [{ id: "c-today", date: TODAY }];

    const report = buildReport(state, TODAY);

    expect(report.period.previousConsultationDate).toBeNull();
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
    expect(report.period.nextAppointmentDate).toBe(addDays(TODAY, 5));
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
        notToday: true, // skipped day: not a discomfort day
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

    // discomfort days: d1 and d4 (belly answers at or above the threshold); the "not today" day d3 is not one
    expect(report.metrics.discomfortDaysCount).toBe(2);

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

  it("lists food co-occurrences on discomfort days alphabetically, not ranked", () => {
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
        answers: { [QUESTION_IDS.bellyComfort]: 2 },
        notToday: false,
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
      { text: "Burger", count: 1 },
      { text: "Ice cream", count: 1 },
      { text: "Pizza", count: 2 },
    ]);
  });

  it("counts a food once per day and groups spellings that differ only in case", () => {
    const state = makeEmptyState();
    const badDay1 = addDays(TODAY, -3);
    const badDay2 = addDays(TODAY, -2);
    state.checkIns = [badDay1, badDay2].map((date, i) => ({
      id: `ci-${i}`,
      date,
      answers: { [QUESTION_IDS.bellyComfort]: 2 },
      notToday: false,
      createdAt: `${date}T10:00:00Z`,
    }));
    state.foodEntries = [
      { id: "f-1", date: badDay1, text: "Milk", createdAt: `${badDay1}T08:00:00Z` },
      { id: "f-2", date: badDay1, text: "Milk", createdAt: `${badDay1}T16:00:00Z` },
      { id: "f-3", date: badDay2, text: " milk ", createdAt: `${badDay2}T08:00:00Z` },
    ];

    const report = buildReport(state, TODAY);

    expect(report.foodsOnDiscomfortDays).toEqual([{ text: "Milk", count: 2 }]);
  });

  it("ignores out-of-range or fractional answers like missing ones", () => {
    const state = makeEmptyState();
    const day = addDays(TODAY, -2);
    state.checkIns = [
      {
        id: "ci-bad",
        date: day,
        answers: { [QUESTION_IDS.bellyComfort]: 5, [QUESTION_IDS.energy]: 1.5 },
        notToday: false,
        createdAt: `${day}T10:00:00Z`,
      },
    ];
    state.foodEntries = [{ id: "f-1", date: day, text: "Pizza", createdAt: `${day}T12:00:00Z` }];

    const report = buildReport(state, TODAY);

    expect(report.foodsOnDiscomfortDays).toEqual([]);
  });

  it("does not treat a skipped check-in day as a discomfort day or pull its foods in", () => {
    const state = makeEmptyState();
    const skipped = addDays(TODAY, -3);
    state.checkIns = [
      {
        id: "ci-skip",
        date: skipped,
        answers: {},
        notToday: true,
        createdAt: `${skipped}T10:00:00Z`,
      },
    ];
    state.foodEntries = [
      { id: "f-1", date: skipped, text: "Pizza", createdAt: `${skipped}T12:00:00Z` },
    ];

    const report = buildReport(state, TODAY);
    expect(report.metrics.discomfortDaysCount).toBe(0);
    expect(report.foodsOnDiscomfortDays).toEqual([]);
  });

  it("uses the first parent log of a date for sleep and school counts", () => {
    const state = makeEmptyState();
    const day = addDays(TODAY, -3);
    state.parentLogs = [
      { date: day, sleepHours: 8, school: "home" as ParentLog["school"] },
      { date: day, sleepHours: 4, school: "attended" as ParentLog["school"] },
    ];

    const report = buildReport(state, TODAY);
    expect(report.metrics.sleepRecordedDaysCount).toBe(1);
    expect(report.metrics.avgSleepHours).toBe(8);
    expect(report.metrics.schoolImpactedDaysCount).toBe(1);
  });

  it("uses the first check-in of a date", () => {
    const state = makeEmptyState();
    const day = addDays(TODAY, -3);
    state.checkIns = [
      {
        id: "ci-a",
        date: day,
        answers: { [QUESTION_IDS.bellyComfort]: 0 },
        notToday: false,
        createdAt: `${day}T08:00:00Z`,
      },
      {
        id: "ci-b",
        date: day,
        answers: { [QUESTION_IDS.bellyComfort]: 2 },
        notToday: false,
        createdAt: `${day}T18:00:00Z`,
      },
    ];

    const report = buildReport(state, TODAY);
    expect(report.metrics.checkInDaysCount).toBe(1);
    expect(report.metrics.discomfortDaysCount).toBe(0);
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

describe("buildReport wearable and observed sections", () => {
  it("is empty without wearable data and counts parent log days", () => {
    const state = makeEmptyState();
    state.parentLogs = [{ date: "2026-10-03", school: "missed", medicationTaken: "yes" }];
    const report = buildReport(state, "2026-10-04");
    expect(report.wearable.validDays).toBe(0);
    expect(report.observed.loggedDays).toBe(1);
    expect(report.observed.school.missed).toBe(1);
  });

  it("feeds wearable days inside the period", () => {
    const report = buildReport(makeEmptyState(), "2026-10-04", {
      days: [
        {
          date: "2026-10-03",
          steps: 4000,
          restingHr: 60,
          sleepMinutes: 480,
          nightComplete: true,
          dayComplete: true,
        },
      ],
      lastSyncAt: null,
      isDemo: true,
    });
    expect(report.wearable.steps.median).toBe(4000);
    expect(report.wearable.isDemo).toBe(true);
  });

  it("groups completed missions by corroboration method and provides totals", () => {
    const state = makeEmptyState();
    const TODAY = "2026-10-04";
    state.missionLogs = [
      {
        id: "m-1",
        date: "2026-10-01",
        missionId: "dragon-breathing",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-01T10:00:00Z",
        corroboration: "wearable",
      },
      {
        id: "m-2",
        date: "2026-10-02",
        missionId: "bed-stretch",
        status: "completed",
        company: "family",
        confirmedBy: "parent-pin",
        createdAt: "2026-10-02T10:00:00Z",
        corroboration: "motion",
      },
      {
        id: "m-3",
        date: "2026-10-03",
        missionId: "flamingo-balance",
        status: "completed",
        company: "family",
        confirmedBy: "parent-pin",
        createdAt: "2026-10-03T10:00:00Z",
      }, // none
      {
        id: "m-4",
        date: "2026-10-03",
        missionId: "wall-sit",
        status: "rest", // not completed, shouldn't be counted
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-03T11:00:00Z",
        corroboration: "wearable",
      },
    ];

    const report = buildReport(state, TODAY);
    expect(report.activity.totalMissionsCompleted).toBe(3);
    expect(report.activity.corroborationTotals).toEqual({
      wearable: 1,
      motion: 1,
      none: 1,
    });
    expect(report.activity.byCorroboration).toEqual([
      { method: "wearable", label: CORROBORATION_LABELS.wearable, count: 1 },
      { method: "motion", label: CORROBORATION_LABELS.motion, count: 1 },
      { method: "none", label: "Self-reported only", count: 1 },
    ]);
  });

  it("integrates bathroom observations from parentLogs, dailyLogs, and parentObservations", () => {
    const state = makeEmptyState();
    const TODAY = "2026-10-04";

    state.parentLogs = [
      {
        date: "2026-10-01",
        daytimeBathroomCount: 3,
        nighttimeBathroomCount: 1,
        looserStools: true,
        bloodVisible: false,
      },
      {
        date: "2026-10-02",
        stoolFrequency: "more",
        stoolNight: "yes",
        stoolConsistency: "looser",
        stoolBlood: "visible",
      },
    ];

    state.dailyLogs = [
      {
        date: "2026-10-03",
        daytimeBathroomCount: 2,
        nighttimeBathroomCount: 0,
        looserStools: false,
        bloodVisible: false,
      },
    ];

    state.parentObservations = [
      {
        date: "2026-10-04",
        daytimeBathroomCount: 1,
        nighttimeBathroomCount: 2,
        looserStools: true,
        bloodVisible: true,
      },
    ];

    const report = buildReport(state, TODAY);

    expect(report.observed.bathroom).toEqual({
      totalDaytime: 6, // 3 + 0 + 2 + 1
      totalNighttime: 4, // 1 + 1 (stoolNight: yes) + 0 + 2
      totalVisits: 10,
      avgDaytimePerDay: 1.5, // 6 / 4 = 1.5
      avgNighttimePerDay: 1, // 4 / 4 = 1.0
      avgVisitsPerDay: 2.5, // 10 / 4 = 2.5
      daysWithLooserStools: 3, // 10-01, 10-02, 10-04
      daysWithBloodVisible: 2, // 10-02, 10-04
      daysLogged: 4,
    });

    const day1 = report.dayStrip.find((d) => d.date === "2026-10-01");
    expect(day1?.daytimeBathroomCount).toBe(3);
    expect(day1?.nighttimeBathroomCount).toBe(1);
    expect(day1?.looserStools).toBe(true);
    expect(day1?.bloodVisible).toBeUndefined();

    const day2 = report.dayStrip.find((d) => d.date === "2026-10-02");
    expect(day2?.nighttimeBathroomCount).toBe(1);
    expect(day2?.looserStools).toBe(true);
    expect(day2?.bloodVisible).toBe(true);
  });
});
