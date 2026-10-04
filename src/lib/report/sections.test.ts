import { describe, expect, it } from "vitest";
import type { ParentLog } from "@/types";
import type { WatchDay, WatchState } from "@/types/watch";
import { buildObservedSection, buildWatchSection } from "./sections";

function day(date: string, over: Partial<WatchDay> = {}): WatchDay {
  return {
    date,
    steps: 5000,
    restingHr: 60,
    sleepMinutes: 480,
    nightComplete: true,
    dayComplete: true,
    ...over,
  };
}

function state(days: WatchDay[], isDemo = false): WatchState {
  return { days, lastSyncAt: null, isDemo };
}

describe("buildWatchSection", () => {
  it("returns empty summaries when there is no data", () => {
    const s = buildWatchSection(state([]), "2026-09-01", "2026-09-30");
    expect(s.validDays).toBe(0);
    expect(s.steps).toEqual({ n: 0, median: null, q1: null, q3: null });
    expect(s.source).toBe("From the watch (Google Health)");
    expect(s.deviceLabels).toEqual([]);
    expect(s.restingHrSource).toBeNull();
  });

  it("computes median and quartiles over period days only", () => {
    const days = [
      day("2026-08-31", { steps: 99999 }),
      day("2026-09-01", { steps: 2000, restingHr: 58, sleepMinutes: 420 }),
      day("2026-09-02", { steps: 4000, restingHr: 60, sleepMinutes: 480 }),
      day("2026-09-03", { steps: 6000, restingHr: 62, sleepMinutes: 540 }),
      day("2026-09-04", { steps: 8000, restingHr: 64, sleepMinutes: 600 }),
    ];
    const s = buildWatchSection(state(days), "2026-09-01", "2026-09-30");
    expect(s.validDays).toBe(4);
    expect(s.steps).toEqual({ n: 4, median: 5000, q1: 3000, q3: 7000 });
    expect(s.restingHr.median).toBe(61);
    expect(s.sleepHours.median).toBe(8.5);
  });

  it("skips incomplete halves of a day and null values", () => {
    const days = [
      day("2026-09-01", { nightComplete: false }),
      day("2026-09-02", { dayComplete: false, steps: 100 }),
      day("2026-09-03", { steps: null, restingHr: null, sleepMinutes: null }),
    ];
    const s = buildWatchSection(state(days), "2026-09-01", "2026-09-30");
    expect(s.steps.n).toBe(1);
    expect(s.restingHr.n).toBe(1);
    expect(s.sleepHours.n).toBe(1);
    expect(s.validDays).toBe(2);
  });

  it("names the devices used and says where the resting heart rate came from", () => {
    const devices: WatchState["devices"] = [
      { id: "w", kind: "watch", label: "Watch · Fitbit Charge 6", metrics: ["steps", "heartRate"] },
      { id: "p", kind: "phone", label: "Phone · Pixel 8", metrics: ["steps"] },
    ];
    const watchOnly = (days: WatchDay[]): WatchState => ({
      days,
      lastSyncAt: null,
      isDemo: false,
      devices,
      deviceSelection: { steps: "p", heartRate: null, sleep: null },
    });
    const s = buildWatchSection(
      watchOnly([day("2026-09-01", { restingHrSource: "watch-daily", nightComplete: false })]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.deviceLabels).toEqual(["Watch · Fitbit Charge 6", "Phone · Pixel 8"]);
    expect(s.restingHrSource).toBe("watch-daily");
    // the watch's own value counts even when our night checks did not pass
    expect(s.restingHr.n).toBe(1);

    const mixed = buildWatchSection(
      watchOnly([
        day("2026-09-01", { restingHrSource: "watch-daily" }),
        day("2026-09-02", { restingHrSource: "night-samples" }),
      ]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(mixed.restingHrSource).toBe("mixed");
  });

  it("carries the demo flag", () => {
    expect(buildWatchSection(state([], true), "2026-09-01", "2026-09-30").isDemo).toBe(true);
  });
});

describe("buildObservedSection", () => {
  it("counts school and medication days", () => {
    const logs: ParentLog[] = [
      { date: "2026-09-01", school: "attended", medicationTaken: "yes" },
      { date: "2026-09-02", school: "missed", medicationTaken: "no" },
      { date: "2026-09-03", school: "left-early", medicationTaken: "partly" },
      { date: "2026-09-04", school: "no-school", medicationTaken: "not-applicable" },
      { date: "2026-09-05" },
    ];
    expect(buildObservedSection(logs)).toEqual({
      loggedDays: 5,
      school: { attended: 1, leftEarly: 1, missed: 1, noSchool: 1 },
      medication: { yes: 1, partly: 1, no: 1, notApplicable: 1 },
      bathroom: {
        totalDaytime: 0,
        totalNighttime: 0,
        totalVisits: 0,
        avgDaytimePerDay: null,
        avgNighttimePerDay: null,
        avgVisitsPerDay: null,
        daysWithLooserStools: 0,
        daysWithBloodVisible: 0,
        daysLogged: 0,
      },
    });
  });

  it("aggregates bathroom visits, averages, and clinical flags across parent logs and observations", () => {
    const logs: ParentLog[] = [
      {
        date: "2026-09-01",
        daytimeBathroomCount: 3,
        nighttimeBathroomCount: 1,
        looserStools: true,
        bloodVisible: false,
      },
      {
        date: "2026-09-02",
        stoolFrequency: "more",
        stoolNight: "yes",
        stoolConsistency: "looser",
        stoolBlood: "visible",
      },
      {
        date: "2026-09-03",
        daytimeBathroomCount: 2,
        stoolNight: "no",
        stoolConsistency: "formed",
        stoolBlood: "none",
      },
    ];

    const dailyLogs = [
      {
        date: "2026-09-04",
        daytimeVisits: 4,
        nighttimeVisits: 2,
        looserStoolsFlag: true,
        bloodVisibleFlag: true,
      },
    ];

    const parentObservations = [
      {
        date: "2026-09-05",
        daytimeBathroomCount: 1,
        nighttimeBathroomCount: 0,
        looserStools: false,
        bloodVisible: false,
      },
    ];

    const result = buildObservedSection(logs, dailyLogs, parentObservations);

    expect(result.bathroom).toEqual({
      totalDaytime: 10, // 3 + 0 + 2 + 4 + 1
      totalNighttime: 4, // 1 + 1 (stoolNight: yes) + 0 + 2 + 0
      totalVisits: 14,
      avgDaytimePerDay: 2, // 10 / 5 daysLogged = 2.0
      avgNighttimePerDay: 0.8, // 4 / 5 daysLogged = 0.8
      avgVisitsPerDay: 2.8, // 14 / 5 daysLogged = 2.8
      daysWithLooserStools: 3, // 09-01, 09-02, 09-04
      daysWithBloodVisible: 2, // 09-02, 09-04
      daysLogged: 5,
    });
  });
});
