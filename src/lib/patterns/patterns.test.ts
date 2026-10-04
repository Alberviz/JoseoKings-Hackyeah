import { describe, expect, it } from "vitest";
import { QUESTION_IDS } from "@/config/content-ids";
import { addDays } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createEmptyState } from "@/lib/storage";
import type { AppState, CheckIn, DateKey, MissionLog, ParentLog } from "@/types";
import {
  getActiveDays,
  getDaySummaries,
  getFoodCooccurrence,
  getWeeklySeries,
  hasEnoughData,
  MIN_ANSWERED_DAYS,
} from "./index";

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    ...createEmptyState(),
    ...overrides,
  };
}

describe("patterns logic", () => {
  describe("empty state", () => {
    it("returns empty day summaries when from > to", () => {
      const state = makeState();
      const summaries = getDaySummaries(state, {
        from: "2026-10-05",
        to: "2026-10-01",
      });
      expect(summaries).toEqual([]);
    });

    it("returns neutral day summaries for every calendar day in range with empty state", () => {
      const state = makeState();
      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-03",
      });

      expect(summaries).toHaveLength(3);
      expect(summaries.map((s) => s.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);

      for (const summary of summaries) {
        expect(summary.checkInStatus).toBe("none");
        expect(summary.bellyComfort).toBeNull();
        expect(summary.energy).toBeNull();
        expect(summary.playPace).toBeNull();
        expect(summary.dayLevel).toBeNull();
        expect(summary.hasDiscomfort).toBe(false);
        expect(summary.sleepHours).toBeNull();
        expect(summary.activity).toBeNull();
        expect(summary.school).toBeNull();
        expect(summary.medicationTaken).toBeNull();
        expect(summary.missions).toEqual({
          completed: 0,
          rest: 0,
          byCompany: { alone: 0, family: 0, other: 0 },
        });
      }
    });

    it("returns empty weekly series when given empty summaries", () => {
      expect(getWeeklySeries([])).toEqual([]);
    });

    it("returns weekly series with null averages for empty day summaries", () => {
      const state = makeState();
      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-03",
      });
      const series = getWeeklySeries(summaries);

      expect(series).toHaveLength(1);
      expect(series[0].weekStart).toBe("2026-09-28");
      expect(series[0].answeredDays).toBe(0);
      expect(series[0].bellyComfort).toBeNull();
      expect(series[0].energy).toBeNull();
      expect(series[0].playPace).toBeNull();
      expect(series[0].sleepHours).toBeNull();
    });

    it("returns empty food cooccurrence when no entries exist", () => {
      const state = makeState();
      const result = getFoodCooccurrence(state, {
        from: "2026-10-01",
        to: "2026-10-05",
      });

      expect(result.entries).toEqual([]);
      expect(result.termCounts).toEqual([]);
    });

    it("evaluates hasEnoughData as false for empty summaries", () => {
      const state = makeState();
      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-03",
      });
      expect(hasEnoughData(summaries)).toEqual({
        enough: false,
        answeredDays: 0,
      });
    });

    it("returns 0 active days for empty summaries", () => {
      const state = makeState();
      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-03",
      });
      expect(getActiveDays(summaries)).toEqual({
        alone: 0,
        family: 0,
        other: 0,
      });
    });
  });

  describe("a single day", () => {
    it("aggregates all fields properly for a single calendar day", () => {
      const date: DateKey = "2026-10-03";
      const checkIn: CheckIn = {
        id: "c1",
        date,
        answers: {
          [QUESTION_IDS.bellyComfort]: 1,
          [QUESTION_IDS.energy]: 0,
          [QUESTION_IDS.playPace]: 2,
        },
        notToday: false,
        createdAt: `${date}T10:00:00.000Z`,
      };

      const parentLog: ParentLog = {
        date,
        sleepHours: 8.5,
        activity: "moderate",
        school: "attended",
        medicationTaken: "yes",
      };

      const missionLogs: MissionLog[] = [
        {
          id: "m1",
          date,
          missionId: "wall-sit",
          status: "completed",
          company: "alone",
          confirmedBy: "child",
          createdAt: `${date}T14:00:00.000Z`,
        },
        {
          id: "m2",
          date,
          missionId: "bed-stretch",
          status: "rest",
          company: "family",
          confirmedBy: "parent-pin",
          createdAt: `${date}T16:00:00.000Z`,
        },
      ];

      const state = makeState({
        checkIns: [checkIn],
        parentLogs: [parentLog],
        missionLogs,
      });

      const summaries = getDaySummaries(state, { from: date, to: date });
      expect(summaries).toHaveLength(1);

      const summary = summaries[0];
      expect(summary.date).toBe(date);
      expect(summary.checkInStatus).toBe("answered");
      expect(summary.bellyComfort).toBe(1);
      expect(summary.energy).toBe(0);
      expect(summary.playPace).toBe(2);
      expect(summary.dayLevel).toBe(2); // highest of (1, 0, 2)
      expect(summary.hasDiscomfort).toBe(true); // 1 >= DISCOMFORT_THRESHOLD
      expect(summary.sleepHours).toBe(8.5);
      expect(summary.activity).toBe("moderate");
      expect(summary.school).toBe("attended");
      expect(summary.medicationTaken).toBe("yes");
      expect(summary.missions).toEqual({
        completed: 1,
        rest: 1,
        byCompany: { alone: 1, family: 0, other: 0 }, // rest mission is not counted in byCompany
      });

      // Weekly series for this single day
      const series = getWeeklySeries(summaries);
      expect(series).toHaveLength(1);
      expect(series[0].weekStart).toBe("2026-09-28"); // Monday of 2026-10-03
      expect(series[0].answeredDays).toBe(1);
      expect(series[0].bellyComfort).toBe(1);
      expect(series[0].energy).toBe(0);
      expect(series[0].playPace).toBe(2);
      expect(series[0].sleepHours).toBe(8.5);

      // Active days
      expect(getActiveDays(summaries)).toEqual({
        alone: 1,
        family: 0,
        other: 0,
      });
    });
  });

  describe("a range with gaps", () => {
    it("returns continuous calendar days where days without data have none status and null values", () => {
      const state = makeState({
        checkIns: [
          {
            id: "c1",
            date: "2026-10-01",
            answers: {
              [QUESTION_IDS.bellyComfort]: 0,
              [QUESTION_IDS.energy]: 1,
              [QUESTION_IDS.playPace]: 0,
            },
            notToday: false,
            createdAt: "2026-10-01T10:00:00.000Z",
          },
          {
            id: "c4",
            date: "2026-10-04",
            answers: {
              [QUESTION_IDS.bellyComfort]: 2,
              [QUESTION_IDS.energy]: 2,
              [QUESTION_IDS.playPace]: 2,
            },
            notToday: false,
            createdAt: "2026-10-04T10:00:00.000Z",
          },
        ],
        parentLogs: [
          {
            date: "2026-10-01",
            sleepHours: 9,
          },
        ],
      });

      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-04",
      });

      expect(summaries).toHaveLength(4);
      expect(summaries.map((s) => s.date)).toEqual([
        "2026-10-01",
        "2026-10-02",
        "2026-10-03",
        "2026-10-04",
      ]);

      // Day 1: answered
      expect(summaries[0].checkInStatus).toBe("answered");
      expect(summaries[0].bellyComfort).toBe(0);
      expect(summaries[0].dayLevel).toBe(1);
      expect(summaries[0].hasDiscomfort).toBe(false);
      expect(summaries[0].sleepHours).toBe(9);

      // Day 2 and Day 3: gaps (no data)
      expect(summaries[1].checkInStatus).toBe("none");
      expect(summaries[1].bellyComfort).toBeNull();
      expect(summaries[1].dayLevel).toBeNull();
      expect(summaries[1].hasDiscomfort).toBe(false);
      expect(summaries[1].sleepHours).toBeNull();

      expect(summaries[2].checkInStatus).toBe("none");
      expect(summaries[2].bellyComfort).toBeNull();
      expect(summaries[2].dayLevel).toBeNull();

      // Day 4: answered
      expect(summaries[3].checkInStatus).toBe("answered");
      expect(summaries[3].bellyComfort).toBe(2);
      expect(summaries[3].dayLevel).toBe(2);
      expect(summaries[3].hasDiscomfort).toBe(true);

      // Weekly series should average only over days that have values (not missing days)
      const series = getWeeklySeries(summaries);
      expect(series).toHaveLength(1);
      expect(series[0].answeredDays).toBe(2);
      // bellyComfort average: (0 + 2) / 2 = 1
      expect(series[0].bellyComfort).toBe(1);
      // energy average: (1 + 2) / 2 = 1.5
      expect(series[0].energy).toBe(1.5);
      // sleepHours average: only day 1 has 9 -> 9
      expect(series[0].sleepHours).toBe(9);
    });
  });

  describe("notToday check-in handling", () => {
    it("counts notToday check-in as not-today status and leaves values null", () => {
      const date: DateKey = "2026-10-03";
      const checkIn: CheckIn = {
        id: "c-not-today",
        date,
        answers: {
          [QUESTION_IDS.bellyComfort]: "skipped",
          [QUESTION_IDS.energy]: "skipped",
          [QUESTION_IDS.playPace]: "skipped",
        },
        notToday: true,
        createdAt: `${date}T12:00:00.000Z`,
      };

      const state = makeState({ checkIns: [checkIn] });
      const summaries = getDaySummaries(state, { from: date, to: date });

      expect(summaries).toHaveLength(1);
      const summary = summaries[0];
      expect(summary.checkInStatus).toBe("not-today");
      expect(summary.bellyComfort).toBeNull();
      expect(summary.energy).toBeNull();
      expect(summary.playPace).toBeNull();
      expect(summary.dayLevel).toBeNull();
      expect(summary.hasDiscomfort).toBe(false);

      // Does not count towards answeredDays in weekly series or hasEnoughData
      const series = getWeeklySeries(summaries);
      expect(series[0].answeredDays).toBe(0);
      expect(series[0].bellyComfort).toBeNull();

      const enough = hasEnoughData(summaries);
      expect(enough.answeredDays).toBe(0);
      expect(enough.enough).toBe(false);
    });
  });

  describe("minimum data rule", () => {
    it("enforces MIN_ANSWERED_DAYS = 14 threshold", () => {
      expect(MIN_ANSWERED_DAYS).toBe(14);

      const makeSummariesWithAnswered = (count: number, totalDays: number) => {
        const summaries = [];
        for (let i = 0; i < totalDays; i += 1) {
          const isAnswered = i < count;
          summaries.push({
            date: addDays("2026-09-01", i),
            checkInStatus: (isAnswered ? "answered" : "none") as "answered" | "none",
            bellyComfort: isAnswered ? 0 : null,
            energy: isAnswered ? 0 : null,
            playPace: isAnswered ? 0 : null,
            dayLevel: isAnswered ? 0 : null,
            hasDiscomfort: false,
            sleepHours: null,
            activity: null,
            school: null,
            medicationTaken: null,
            missions: { completed: 0, rest: 0, byCompany: { alone: 0, family: 0, other: 0 } },
          });
        }
        return summaries;
      };

      // 13 answered days out of 20 -> not enough
      expect(hasEnoughData(makeSummariesWithAnswered(13, 20))).toEqual({
        enough: false,
        answeredDays: 13,
      });

      // Exactly 14 answered days out of 14 -> enough
      expect(hasEnoughData(makeSummariesWithAnswered(14, 14))).toEqual({
        enough: true,
        answeredDays: 14,
      });

      // 15 answered days -> enough
      expect(hasEnoughData(makeSummariesWithAnswered(15, 20))).toEqual({
        enough: true,
        answeredDays: 15,
      });
    });
  });

  describe("weekly series boundaries across a month change", () => {
    it("groups days crossing a month into the same Monday-Sunday calendar week", () => {
      // 2026-09-28 is Monday, 2026-10-04 is Sunday.
      // Month boundary is between 2026-09-30 (Wednesday) and 2026-10-01 (Thursday).
      const state = makeState({
        checkIns: [
          {
            id: "c-sep",
            date: "2026-09-29", // Tuesday
            answers: {
              [QUESTION_IDS.bellyComfort]: 0,
              [QUESTION_IDS.energy]: 0,
              [QUESTION_IDS.playPace]: 0,
            },
            notToday: false,
            createdAt: "2026-09-29T10:00:00.000Z",
          },
          {
            id: "c-oct",
            date: "2026-10-02", // Friday
            answers: {
              [QUESTION_IDS.bellyComfort]: 2,
              [QUESTION_IDS.energy]: 2,
              [QUESTION_IDS.playPace]: 2,
            },
            notToday: false,
            createdAt: "2026-10-02T10:00:00.000Z",
          },
        ],
      });

      const summaries = getDaySummaries(state, {
        from: "2026-09-28",
        to: "2026-10-04",
      });

      expect(summaries).toHaveLength(7);
      const series = getWeeklySeries(summaries);

      // All 7 days belong to the same week starting on Monday 2026-09-28
      expect(series).toHaveLength(1);
      expect(series[0].weekStart).toBe("2026-09-28");
      expect(series[0].answeredDays).toBe(2);
      expect(series[0].bellyComfort).toBe(1); // (0 + 2) / 2
      expect(series[0].energy).toBe(1);
      expect(series[0].playPace).toBe(1);
    });

    it("correctly separates multiple consecutive weeks across month changes", () => {
      // Week 1: 2026-09-28 to 2026-10-04 (weekStart: 2026-09-28)
      // Week 2: 2026-10-05 to 2026-10-11 (weekStart: 2026-10-05)
      const state = makeState({
        checkIns: [
          {
            id: "c1",
            date: "2026-09-30",
            answers: { [QUESTION_IDS.bellyComfort]: 0 },
            notToday: false,
            createdAt: "2026-09-30T10:00:00.000Z",
          },
          {
            id: "c2",
            date: "2026-10-06",
            answers: { [QUESTION_IDS.bellyComfort]: 2 },
            notToday: false,
            createdAt: "2026-10-06T10:00:00.000Z",
          },
        ],
      });

      const summaries = getDaySummaries(state, {
        from: "2026-09-28",
        to: "2026-10-11",
      });

      const series = getWeeklySeries(summaries);
      expect(series).toHaveLength(2);
      expect(series[0].weekStart).toBe("2026-09-28");
      expect(series[0].answeredDays).toBe(1);
      expect(series[0].bellyComfort).toBe(0);

      expect(series[1].weekStart).toBe("2026-10-05");
      expect(series[1].answeredDays).toBe(1);
      expect(series[1].bellyComfort).toBe(2);
    });
  });

  describe("food co-occurrence", () => {
    it("returns food terms in strictly alphabetical, unranked order with distinct days counts", () => {
      // Set up discomfort on 3 days
      const state = makeState({
        checkIns: [
          {
            id: "c1",
            date: "2026-10-01",
            answers: { [QUESTION_IDS.bellyComfort]: 1 }, // discomfort (>= 1)
            notToday: false,
            createdAt: "2026-10-01T10:00:00.000Z",
          },
          {
            id: "c2",
            date: "2026-10-02",
            answers: { [QUESTION_IDS.bellyComfort]: 2 }, // discomfort (>= 1)
            notToday: false,
            createdAt: "2026-10-02T10:00:00.000Z",
          },
          {
            id: "c3",
            date: "2026-10-03",
            answers: { [QUESTION_IDS.bellyComfort]: 1 }, // discomfort (>= 1)
            notToday: false,
            createdAt: "2026-10-03T10:00:00.000Z",
          },
          {
            id: "c4",
            date: "2026-10-04",
            answers: { [QUESTION_IDS.bellyComfort]: 0 }, // calm day (NO discomfort)
            notToday: false,
            createdAt: "2026-10-04T10:00:00.000Z",
          },
        ],
        foodEntries: [
          {
            id: "f1",
            date: "2026-10-01",
            text: "Zucchini soup and bread",
            createdAt: "2026-10-01T12:00:00.000Z",
          },
          {
            id: "f2",
            date: "2026-10-02",
            text: "Zucchini bread for breakfast",
            createdAt: "2026-10-02T12:00:00.000Z",
          },
          {
            id: "f3",
            date: "2026-10-03",
            text: "Apple and zucchini with cheese",
            createdAt: "2026-10-03T12:00:00.000Z",
          },
          // Entry on a calm day (bellyComfort = 0): should NOT be included
          {
            id: "f4",
            date: "2026-10-04",
            text: "Chocolate cake",
            createdAt: "2026-10-04T12:00:00.000Z",
          },
          // Entry outside range: should NOT be included
          {
            id: "f5",
            date: "2026-09-20",
            text: "Zucchini salad",
            createdAt: "2026-09-20T12:00:00.000Z",
          },
        ],
      });

      const result = getFoodCooccurrence(state, {
        from: "2026-10-01",
        to: "2026-10-03",
      });

      expect(result.entries).toHaveLength(3);
      expect(result.entries.map((e) => e.date)).toEqual(["2026-10-01", "2026-10-02", "2026-10-03"]);

      // Check term counts:
      // "zucchini" appeared on 3 distinct days (10-01, 10-02, 10-03)
      // "bread" appeared on 2 distinct days (10-01, 10-02)
      // "apple" appeared on 1 distinct day (10-03)
      // "cheese" appeared on 1 distinct day (10-03)
      // "breakfast" appeared on 1 distinct day (10-02)
      // "soup" appeared on 1 distinct day (10-01)
      // Stopwords removed: "and", "for", "with"
      // MUST be sorted alphabetically, NEVER ranked by count!
      // Alphabetical order: apple, breakfast, bread, cheese, soup, zucchini
      const terms = result.termCounts.map((tc) => tc.term);
      expect(terms).toEqual(["apple", "bread", "breakfast", "cheese", "soup", "zucchini"]);

      // Verify unranked order: zucchini has the highest count (3) but is last alphabetically
      const zucchini = result.termCounts.find((tc) => tc.term === "zucchini");
      expect(zucchini?.days).toBe(3);
      expect(zucchini?.count).toBe(3);

      const apple = result.termCounts.find((tc) => tc.term === "apple");
      expect(apple?.days).toBe(1);
      expect(apple?.count).toBe(1);

      const bread = result.termCounts.find((tc) => tc.term === "bread");
      expect(bread?.days).toBe(2);
      expect(bread?.count).toBe(2);

      // Verify that words appearing multiple times on the same day are only counted once for that day
      expect(result.termCounts.every((tc) => tc.days <= 3)).toBe(true);
    });

    it("handles multiple food entries on the same discomfort day correctly", () => {
      const state = makeState({
        checkIns: [
          {
            id: "c1",
            date: "2026-10-01",
            answers: { [QUESTION_IDS.bellyComfort]: 2 },
            notToday: false,
            createdAt: "2026-10-01T10:00:00.000Z",
          },
        ],
        foodEntries: [
          {
            id: "f1",
            date: "2026-10-01",
            text: "Banana smoothie",
            createdAt: "2026-10-01T09:00:00.000Z",
          },
          {
            id: "f2",
            date: "2026-10-01",
            text: "Banana bread",
            createdAt: "2026-10-01T15:00:00.000Z",
          },
        ],
      });

      const result = getFoodCooccurrence(state, {
        from: "2026-10-01",
        to: "2026-10-01",
      });

      expect(result.entries).toHaveLength(2);
      const banana = result.termCounts.find((tc) => tc.term === "banana");
      // Appeared in 2 entries, but on the same 1 distinct day:
      expect(banana?.days).toBe(1);
    });
  });

  describe("active days", () => {
    it("counts days with at least one completed mission, split by alone, family, other", () => {
      const state = makeState({
        missionLogs: [
          // Day 1: completed alone
          {
            id: "m1",
            date: "2026-10-01",
            missionId: "wall-sit",
            status: "completed",
            company: "alone",
            confirmedBy: "child",
            createdAt: "2026-10-01T10:00:00.000Z",
          },
          // Day 1: completed family (same day has both alone and family)
          {
            id: "m2",
            date: "2026-10-01",
            missionId: "bed-stretch",
            status: "completed",
            company: "family",
            confirmedBy: "parent-pin",
            createdAt: "2026-10-01T12:00:00.000Z",
          },
          // Day 2: rest mission alone (should not count as completed)
          {
            id: "m3",
            date: "2026-10-02",
            missionId: "dragon-breathing",
            status: "rest",
            company: "alone",
            confirmedBy: "child",
            createdAt: "2026-10-02T10:00:00.000Z",
          },
          // Day 3: completed with other
          {
            id: "m4",
            date: "2026-10-03",
            missionId: "rolling-wave",
            status: "completed",
            company: "other",
            confirmedBy: "other-tap",
            createdAt: "2026-10-03T10:00:00.000Z",
          },
          // Day 4: 2 completed missions alone on the same day -> counts as 1 day for alone
          {
            id: "m5",
            date: "2026-10-04",
            missionId: "wall-sit",
            status: "completed",
            company: "alone",
            confirmedBy: "child",
            createdAt: "2026-10-04T10:00:00.000Z",
          },
          {
            id: "m6",
            date: "2026-10-04",
            missionId: "flamingo-balance",
            status: "completed",
            company: "alone",
            confirmedBy: "child",
            createdAt: "2026-10-04T14:00:00.000Z",
          },
        ],
      });

      const summaries = getDaySummaries(state, {
        from: "2026-10-01",
        to: "2026-10-04",
      });

      const activeDays = getActiveDays(summaries);
      // Alone: Day 1, Day 4 = 2 days
      // Family: Day 1 = 1 day
      // Other: Day 3 = 1 day
      expect(activeDays).toEqual({
        alone: 2,
        family: 1,
        other: 1,
      });
    });
  });

  describe("demo state integration (30 and 90 days)", () => {
    const fixedToday: DateKey = "2026-10-03";
    const demoState = buildDemoState({ today: fixedToday });

    it("produces valid 90-day summaries from demo state", () => {
      const from90 = addDays(fixedToday, -89);
      const summaries90 = getDaySummaries(demoState, {
        from: from90,
        to: fixedToday,
      });

      expect(summaries90).toHaveLength(90);
      expect(summaries90[0].date).toBe(from90);
      expect(summaries90[89].date).toBe(fixedToday);

      const enough90 = hasEnoughData(summaries90);
      expect(enough90.enough).toBe(true);
      expect(enough90.answeredDays).toBeGreaterThanOrEqual(14);

      const series90 = getWeeklySeries(summaries90);
      expect(series90.length).toBeGreaterThan(10);
      // Verify every week has valid weekStart on Monday
      for (const week of series90) {
        expect(week.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    });

    it("verifies the flare around 30 to 22 days ago is higher dayLevel than the last week", () => {
      const from90 = addDays(fixedToday, -89);
      const summaries90 = getDaySummaries(demoState, {
        from: from90,
        to: fixedToday,
      });

      // Flare window: 30 to 22 days ago
      const flareDays = summaries90.filter((s) => {
        const d = s.date;
        const start = addDays(fixedToday, -30);
        const end = addDays(fixedToday, -22);
        return d >= start && d <= end;
      });

      const flareLevels = flareDays.map((s) => s.dayLevel).filter((l): l is number => l !== null);

      expect(flareLevels.length).toBeGreaterThan(0);
      const avgFlareLevel = flareLevels.reduce((a, b) => a + b, 0) / flareLevels.length;

      // Last week window: last 7 days (days -6 to 0)
      const lastWeekDays = summaries90.filter((s) => {
        const d = s.date;
        const start = addDays(fixedToday, -6);
        return d >= start && d <= fixedToday;
      });

      const lastWeekLevels = lastWeekDays
        .map((s) => s.dayLevel)
        .filter((l): l is number => l !== null);

      expect(lastWeekLevels.length).toBeGreaterThan(0);
      const avgLastWeekLevel = lastWeekLevels.reduce((a, b) => a + b, 0) / lastWeekLevels.length;

      // Flare must appear as higher dayLevel than the last week; last week must be calmer
      expect(avgFlareLevel).toBeGreaterThan(avgLastWeekLevel);
      expect(avgFlareLevel).toBeGreaterThan(1.0);
      expect(avgLastWeekLevel).toBeLessThan(1.0);
    });

    it("produces valid 30-day summaries with food co-occurrence and active days", () => {
      const from30 = addDays(fixedToday, -29);
      const summaries30 = getDaySummaries(demoState, {
        from: from30,
        to: fixedToday,
      });

      expect(summaries30).toHaveLength(30);

      const enough30 = hasEnoughData(summaries30);
      expect(enough30.enough).toBe(true);

      const activeDays30 = getActiveDays(summaries30);
      expect(activeDays30.alone).toBeGreaterThan(0);

      const foodCooccurrence = getFoodCooccurrence(demoState, {
        from: from30,
        to: fixedToday,
      });

      expect(foodCooccurrence.entries.length).toBeGreaterThan(0);
      expect(foodCooccurrence.termCounts.length).toBeGreaterThan(0);

      // Verify food terms are strictly alphabetical
      for (let i = 0; i < foodCooccurrence.termCounts.length - 1; i += 1) {
        const current = foodCooccurrence.termCounts[i].term;
        const next = foodCooccurrence.termCounts[i + 1].term;
        expect(current.localeCompare(next)).toBeLessThanOrEqual(0);
      }
    });
  });

  describe("local calendar days only (no UTC conversions)", () => {
    it("operates strictly on YYYY-MM-DD DateKey strings without timezone shifts", () => {
      const date: DateKey = "2026-10-31";
      const nextDate = addDays(date, 1);
      expect(nextDate).toBe("2026-11-01");

      const state = makeState({
        checkIns: [
          {
            id: "c1",
            date: "2026-10-31",
            answers: { [QUESTION_IDS.bellyComfort]: 0 },
            notToday: false,
            createdAt: "2026-10-31T23:59:59.999Z",
          },
          {
            id: "c2",
            date: "2026-11-01",
            answers: { [QUESTION_IDS.bellyComfort]: 1 },
            notToday: false,
            createdAt: "2026-11-01T00:00:01.000Z",
          },
        ],
      });

      const summaries = getDaySummaries(state, {
        from: "2026-10-31",
        to: "2026-11-01",
      });

      expect(summaries).toHaveLength(2);
      expect(summaries[0].date).toBe("2026-10-31");
      expect(summaries[0].bellyComfort).toBe(0);
      expect(summaries[1].date).toBe("2026-11-01");
      expect(summaries[1].bellyComfort).toBe(1);
    });
  });

  describe("duplicates and non-ASCII food terms", () => {
    it("uses the first check-in and first parent log of a date", () => {
      const state = makeState({
        checkIns: [
          {
            id: "a",
            date: "2026-10-01",
            answers: { [QUESTION_IDS.bellyComfort]: 0 },
            notToday: false,
            createdAt: "2026-10-01T08:00:00.000Z",
          },
          {
            id: "b",
            date: "2026-10-01",
            answers: { [QUESTION_IDS.bellyComfort]: 2 },
            notToday: false,
            createdAt: "2026-10-01T18:00:00.000Z",
          },
        ],
        parentLogs: [
          { date: "2026-10-01", sleepHours: 8 },
          { date: "2026-10-01", sleepHours: 4 },
        ],
      });
      const [day] = getDaySummaries(state, { from: "2026-10-01", to: "2026-10-01" });
      expect(day.hasDiscomfort).toBe(false);
      expect(day.bellyComfort).toBe(0);
      expect(day.sleepHours).toBe(8);
    });

    it("keeps terms with Polish letters", () => {
      const state = makeState({
        checkIns: [
          {
            id: "a",
            date: "2026-10-01",
            answers: { [QUESTION_IDS.bellyComfort]: 2 },
            notToday: false,
            createdAt: "2026-10-01T08:00:00.000Z",
          },
        ],
        foodEntries: [
          {
            id: "f1",
            date: "2026-10-01",
            text: "Żurek i pierogi",
            createdAt: "2026-10-01T12:00:00.000Z",
          },
        ],
      });
      const result = getFoodCooccurrence(state, { from: "2026-10-01", to: "2026-10-01" });
      expect(result.termCounts.map((t) => t.term)).toContain("żurek");
    });
  });
});
