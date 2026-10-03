import { describe, expect, it } from "vitest";
import { CORE_QUESTION_SCALE, DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { addDays, daysBetween, isDateKey } from "@/lib/dates";
import { buildDemoState, DEMO_DAYS } from "./buildDemoState";

const TODAY = "2026-10-03";
const state = buildDemoState({ today: TODAY });

const FORBIDDEN_WORDS = [
  "prednis",
  "budesonide",
  "mesalam",
  "infliximab",
  "adalimumab",
  "azathioprine",
  "methotrexate",
  "mg",
];

describe("buildDemoState", () => {
  it("is deterministic", () => {
    expect(buildDemoState({ today: TODAY })).toEqual(state);
  });

  it("is marked as demo data and has a child and a companion", () => {
    expect(state.isDemo).toBe(true);
    expect(state.schemaVersion).toBe(1);
    expect(state.child?.nickname).toBeTruthy();
    expect(state.companion.name).toBeTruthy();
  });

  it("covers about 90 days and never reaches into the future", () => {
    const dates = [...state.checkIns.map((c) => c.date), ...state.parentLogs.map((p) => p.date)];
    expect(dates.every(isDateKey)).toBe(true);
    expect(dates.every((d) => daysBetween(d, TODAY) >= 0)).toBe(true);
    expect(dates.every((d) => daysBetween(d, TODAY) < DEMO_DAYS)).toBe(true);
    expect(state.checkIns.length).toBeGreaterThan(70);
    expect(state.parentLogs.length).toBeGreaterThan(65);
  });

  it("has one check-in at most per day and unique ids everywhere", () => {
    const days = state.checkIns.map((c) => c.date);
    expect(new Set(days).size).toBe(days.length);
    const ids = [
      ...state.checkIns.map((c) => c.id),
      ...state.missionLogs.map((m) => m.id),
      ...state.foodEntries.map((f) => f.id),
      ...state.consultations.map((c) => c.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains a flare and a recovery in the child's own answers", () => {
    const pain = (daysAgo: number) =>
      state.checkIns.find((c) => c.date === addDays(TODAY, -daysAgo))?.answers[
        QUESTION_IDS.bellyComfort
      ];
    const painDuring = [30, 28, 27, 26, 25, 24]
      .map(pain)
      .filter((v): v is number => typeof v === "number");
    const painNow = [3, 2, 1, 0].map(pain).filter((v): v is number => typeof v === "number");
    expect(Math.max(...painDuring)).toBe(CORE_QUESTION_SCALE.max);
    expect(Math.max(...painNow)).toBeLessThan(CORE_QUESTION_SCALE.max);
  });

  it("has two consultations in order, the last one inside the flare window", () => {
    expect(state.consultations).toHaveLength(2);
    const [first, second] = state.consultations;
    expect(daysBetween(first.date, second.date)).toBeGreaterThan(30);
    expect(daysBetween(second.date, TODAY)).toBeGreaterThan(14);
  });

  it("stores 'not today' check-ins with every answer skipped", () => {
    const notToday = state.checkIns.filter((c) => c.notToday);
    expect(notToday.length).toBeGreaterThan(0);
    expect(notToday.every((c) => Object.values(c.answers).every((a) => a === "skipped"))).toBe(
      true,
    );
    const answered = state.checkIns.filter((c) => !c.notToday);
    expect(
      answered.every((c) => Object.values(c.answers).every((a) => typeof a === "number")),
    ).toBe(true);
  });

  it("covers every company, matches the confirmation, and includes rest sessions", () => {
    const companies = new Set(state.missionLogs.map((m) => m.company));
    expect(companies).toEqual(new Set(["alone", "family", "other"]));
    const expected = { alone: "child", family: "parent-pin", other: "other-tap" } as const;
    expect(state.missionLogs.every((m) => m.confirmedBy === expected[m.company])).toBe(true);
    expect(state.missionLogs.some((m) => m.status === "rest")).toBe(true);
    expect(state.missionLogs.some((m) => m.status === "completed")).toBe(true);
  });

  it("links every food entry to an existing check-in with discomfort", () => {
    expect(state.foodEntries.length).toBeGreaterThan(3);
    for (const entry of state.foodEntries) {
      const checkIn = state.checkIns.find((c) => c.id === entry.relatedCheckInId);
      expect(checkIn?.date).toBe(entry.date);
      expect(Number(checkIn?.answers[QUESTION_IDS.bellyComfort])).toBeGreaterThanOrEqual(
        DISCOMFORT_THRESHOLD,
      );
    }
  });

  it("only uses medication as yes, partly or no, and never names a drug", () => {
    expect(
      state.parentLogs.every((p) => ["yes", "partly", "no"].includes(p.medicationTaken ?? "")),
    ).toBe(true);
    const text = JSON.stringify(state).toLowerCase();
    for (const word of FORBIDDEN_WORDS) expect(text).not.toContain(word);
  });

  it("counts team stars as the finished missions done with someone", () => {
    const withSomeone = state.missionLogs.filter(
      (m) => m.status === "completed" && m.company !== "alone",
    ).length;
    expect(state.companion.teamStars).toBe(withSomeone);
    expect(state.companion.points).toBeGreaterThan(0);
  });

  it("accepts custom settings", () => {
    const custom = buildDemoState({
      today: TODAY,
      settings: { pinHash: "h", pinSalt: "s", allowedMissionIds: ["wall-sit"] },
    });
    expect(custom.settings?.allowedMissionIds).toEqual(["wall-sit"]);
  });
});
