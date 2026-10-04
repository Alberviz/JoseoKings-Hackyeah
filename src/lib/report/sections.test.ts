import { describe, expect, it } from "vitest";
import type { ParentLog } from "@/types";
import type { WearableDay, WearableState } from "@/types/wearable";
import { buildObservedSection, buildWearableSection } from "./sections";

function day(date: string, over: Partial<WearableDay> = {}): WearableDay {
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

function state(days: WearableDay[], isDemo = false): WearableState {
  return { days, lastSyncAt: null, isDemo };
}

describe("buildWearableSection", () => {
  it("returns empty summaries when there is no data", () => {
    const s = buildWearableSection(state([]), "2026-09-01", "2026-09-30");
    expect(s.validDays).toBe(0);
    expect(s.steps).toEqual({ n: 0, median: null, q1: null, q3: null });
    expect(s.source).toBe("From the wearable (Google Health)");
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
    const s = buildWearableSection(state(days), "2026-09-01", "2026-09-30");
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
    const s = buildWearableSection(state(days), "2026-09-01", "2026-09-30");
    expect(s.steps.n).toBe(1);
    expect(s.restingHr.n).toBe(1);
    expect(s.sleepHours.n).toBe(1);
    expect(s.validDays).toBe(2);
  });

  it("names the devices used and says where the resting heart rate came from", () => {
    const devices: WearableState["devices"] = [
      {
        id: "w",
        kind: "wearable",
        label: "Wearable · Fitbit Charge 6",
        metrics: ["steps", "heartRate"],
      },
      { id: "p", kind: "phone", label: "Phone · Pixel 8", metrics: ["steps"] },
    ];
    const wearableOnly = (days: WearableDay[]): WearableState => ({
      days,
      lastSyncAt: null,
      isDemo: false,
      devices,
      deviceSelection: { steps: "p", heartRate: null, sleep: null },
    });
    const s = buildWearableSection(
      wearableOnly([
        day("2026-09-01", { restingHrSource: "wearable-daily", nightComplete: false }),
      ]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.deviceLabels).toEqual(["Wearable · Fitbit Charge 6", "Phone · Pixel 8"]);
    expect(s.restingHrSource).toBe("wearable-daily");
    // the wearable's own value counts even when our night checks did not pass
    expect(s.restingHr.n).toBe(1);

    const mixed = buildWearableSection(
      wearableOnly([
        day("2026-09-01", { restingHrSource: "wearable-daily" }),
        day("2026-09-02", { restingHrSource: "night-samples" }),
      ]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(mixed.restingHrSource).toBe("mixed");
  });

  it("counts the nights by method and writes the method note with the real gap", () => {
    const sparse = (date: string, gap: number) =>
      day(date, {
        restingHrSource: "night-samples",
        restingHrMethod: "sparse-3-readings",
        restingHrGapMin: gap,
      });
    const s = buildWearableSection(
      state([
        sparse("2026-09-01", 30),
        sparse("2026-09-02", 30),
        sparse("2026-09-03", 31),
        day("2026-09-04", { restingHrSource: "night-samples", restingHrMethod: "dense-30min" }),
        day("2026-09-05", { restingHrSource: "wearable-daily" }),
      ]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.restingHrNights).toEqual({ dense: 1, sparse: 3 });
    expect(s.sparseGapMin).toBe(30);
    expect(s.restingHrMethodText).toBe(
      "lowest 30-minute average on 1 night; lowest average of 3 readings in a row (wearable recorded about every 30 min) on 3 nights",
    );
    expect(s.methodNote).toEqual([
      "The figures are simple fixed calculations done on this device from what the wearable recorded. They describe this child's own recordings. They are not a clinical measurement and they have not been validated for this use.",
      "They follow methods used in research on wearables, which mostly used wearables that record heart rate about every minute.",
      "On 3 of the 4 nights the wearable recorded heart rate during sleep about every 30 minutes. For those nights the night-time heart rate uses an adapted method, the lowest average of 3 readings in a row, which is less precise. 1 night used the lowest 30-minute average.",
      "On some days the resting heart rate is the figure the wearable itself reported, not one calculated here.",
      "Published studies of wearable data in inflammatory bowel disease are mostly in adults, and their results are mixed, for example on resting heart rate.",
    ]);
  });

  it("treats saved days without a method as dense nights and names only that method", () => {
    const s = buildWearableSection(
      state([day("2026-09-01", { restingHrSource: "night-samples" })]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.restingHrNights).toEqual({ dense: 1, sparse: 0 });
    expect(s.sparseGapMin).toBeNull();
    expect(s.restingHrMethodText).toBe("lowest 30-minute average");
    expect(s.methodNote.join(" ")).not.toContain("3 readings");
  });

  it("has no method text when there is no night-time figure, and never claims detection", () => {
    const s = buildWearableSection(
      state([day("2026-09-01", { restingHrSource: "wearable-daily" })]),
      "2026-09-01",
      "2026-09-30",
    );
    expect(s.restingHrMethodText).toBeNull();
    const text = s.methodNote.join(" ").toLowerCase();
    for (const banned of ["detect", "predict", "normal", "healthy", "strong", "high correlation"]) {
      expect(text).not.toContain(banned);
    }
  });

  it("carries the demo flag", () => {
    expect(buildWearableSection(state([], true), "2026-09-01", "2026-09-30").isDemo).toBe(true);
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
