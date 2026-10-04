import { describe, expect, it } from "vitest";
import { buildWearableDays } from "../buildWearableDays";
import type { WearableSample } from "../types";

const sample = (metric: WearableSample["metric"], startAt: string, endAt: string, value: number) =>
  ({ metric, startAt, endAt, value, source: "test" }) satisfies WearableSample;

describe("buildWearableDays", () => {
  it("returns no days without samples", () => {
    expect(buildWearableDays([], { timeZone: "UTC" })).toEqual([]);
  });

  it("sums steps per local day and flags incomplete days", () => {
    const days = buildWearableDays(
      [
        sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 100),
        sample("steps", "2026-09-01T11:00:00Z", "2026-09-01T11:01:00Z", 50),
        sample("steps", "2026-09-02T10:00:00Z", "2026-09-02T10:01:00Z", 30),
      ],
      { timeZone: "UTC" },
    );
    expect(days).toEqual([
      {
        date: "2026-09-01",
        steps: 150,
        restingHr: null,
        restingHrSource: null,
        restingHrMethod: null,
        restingHrGapMin: null,
        sleepMinutes: null,
        nightComplete: false,
        dayComplete: false,
      },
      {
        date: "2026-09-02",
        steps: 30,
        restingHr: null,
        restingHrSource: null,
        restingHrMethod: null,
        restingHrGapMin: null,
        sleepMinutes: null,
        nightComplete: false,
        dayComplete: false,
      },
    ]);
  });

  it("uses the local day, not the UTC day", () => {
    const days = buildWearableDays(
      [sample("steps", "2026-09-01T23:30:00Z", "2026-09-01T23:31:00Z", 10)],
      { timeZone: "Europe/Warsaw" },
    );
    expect(days.map((d) => d.date)).toEqual(["2026-09-02"]);
  });

  it("drops days before fromDate", () => {
    const days = buildWearableDays(
      [
        sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 100),
        sample("steps", "2026-09-02T10:00:00Z", "2026-09-02T10:01:00Z", 30),
      ],
      { timeZone: "UTC", fromDate: "2026-09-02" },
    );
    expect(days.map((d) => d.date)).toEqual(["2026-09-02"]);
  });

  it("marks a night complete with a valid sleep session and enough heart-rate coverage", () => {
    const samples: WearableSample[] = [
      sample("sleepSession", "2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", 480),
    ];
    for (let i = 0; i < 300; i++) {
      const t = new Date(Date.parse("2026-09-01T22:00:00Z") + i * 60_000).toISOString();
      samples.push(sample("heartRate", t, t, 60));
    }
    const day = buildWearableDays(samples, { timeZone: "UTC" }).find(
      (d) => d.date === "2026-09-02",
    );
    expect(day?.nightComplete).toBe(true);
    expect(day?.sleepMinutes).toBe(480);
    expect(day?.restingHr).not.toBeNull();
  });

  it("never sums steps across devices: each metric uses only its chosen device", () => {
    const phone = {
      ...sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 100),
      source: "phone",
    };
    const wearable = {
      ...sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 90),
      source: "wearable",
    };
    const wearable2 = {
      ...sample("steps", "2026-09-01T11:00:00Z", "2026-09-01T11:01:00Z", 50),
      source: "wearable",
    };
    const all = [phone, wearable, wearable2];

    expect(
      buildWearableDays(all, { timeZone: "UTC", deviceIds: { steps: "wearable" } })[0].steps,
    ).toBe(140);
    expect(
      buildWearableDays(all, { timeZone: "UTC", deviceIds: { steps: "phone" } })[0].steps,
    ).toBe(100);
  });

  it("filters heart rate, daily resting heart rate and sleep by their own device", () => {
    const samples: WearableSample[] = [
      {
        ...sample("sleepSession", "2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", 480),
        source: "ring",
      },
      {
        ...sample("sleepSession", "2026-09-01T23:00:00Z", "2026-09-02T05:00:00Z", 360),
        source: "wearable",
      },
    ];
    for (let i = 0; i < 300; i++) {
      const t = new Date(Date.parse("2026-09-01T22:00:00Z") + i * 60_000).toISOString();
      samples.push({ ...sample("heartRate", t, t, 60), source: "wearable" });
    }
    const pick = (sleep: string) =>
      buildWearableDays(samples, {
        timeZone: "UTC",
        deviceIds: { heartRate: "wearable", sleep },
      }).find((d) => d.date === "2026-09-02");
    expect(pick("ring")?.sleepMinutes).toBe(480);
    expect(pick("wearable")?.sleepMinutes).toBe(360);
  });

  it("uses the wearable's own daily resting heart rate when night samples are not enough", () => {
    const daily = (date: string, value: number, source: string): WearableSample => ({
      metric: "restingHrDaily",
      startAt: date,
      endAt: date,
      value,
      source,
    });
    const days = buildWearableDays([daily("2026-09-02", 64, "wearable")], {
      timeZone: "America/Los_Angeles",
    });
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      date: "2026-09-02",
      restingHr: 64,
      restingHrSource: "wearable-daily",
      steps: null,
      nightComplete: false,
    });
  });

  it("keeps our own night resting heart rate when both exist", () => {
    const samples: WearableSample[] = [
      sample("sleepSession", "2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", 480),
      {
        metric: "restingHrDaily",
        startAt: "2026-09-02",
        endAt: "2026-09-02",
        value: 99,
        source: "test",
      },
    ];
    for (let i = 0; i < 300; i++) {
      const t = new Date(Date.parse("2026-09-01T22:00:00Z") + i * 60_000).toISOString();
      samples.push(sample("heartRate", t, t, 60));
    }
    const day = buildWearableDays(samples, { timeZone: "UTC" }).find(
      (d) => d.date === "2026-09-02",
    );
    expect(day?.restingHr).toBeLessThan(70);
    expect(day?.restingHrSource).toBe("night-samples");
    expect(day?.restingHrMethod).toBe("dense-30min");
  });

  it("uses the sparse method and the source's main-sleep flag for a 30-minute grid night", () => {
    const samples: WearableSample[] = [];
    // Main sleep from 05:00 to 13:20 (starts after 04:00, so only the source flag keeps it).
    const sleepStart = Date.parse("2026-09-02T05:00:00Z");
    const sleepEnd = Date.parse("2026-09-02T13:20:00Z");
    samples.push({
      ...sample(
        "sleepSession",
        new Date(sleepStart).toISOString(),
        new Date(sleepEnd).toISOString(),
        480,
      ),
      isMainSleep: true,
    });
    for (let i = 0; i < 16; i++) {
      const t = new Date(sleepStart + 60_000 + i * 30 * 60_000).toISOString();
      samples.push(sample("heartRate", t, t, 58 + (i % 3)));
    }
    const day = buildWearableDays(samples, { timeZone: "UTC" }).find(
      (d) => d.date === "2026-09-02",
    );
    expect(day?.nightComplete).toBe(true);
    expect(day?.restingHrSource).toBe("night-samples");
    expect(day?.restingHrMethod).toBe("sparse-3-readings");
    expect(day?.restingHrGapMin).toBe(30);
  });

  it("leaves a metric unfiltered when no device id is given", () => {
    const a = {
      ...sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 100),
      source: "a",
    };
    const b = {
      ...sample("steps", "2026-09-01T11:00:00Z", "2026-09-01T11:01:00Z", 50),
      source: "b",
    };
    expect(buildWearableDays([a, b], { timeZone: "UTC", deviceIds: {} })[0].steps).toBe(150);
  });

  it("counts the time asleep, not the whole session, as the sleep minutes", () => {
    // 22:00 to 06:00 is 480 minutes in bed; the source says 420 were asleep.
    const samples: WearableSample[] = [
      sample("sleepSession", "2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", 420),
    ];
    for (let i = 0; i < 300; i++) {
      const t = new Date(Date.parse("2026-09-01T22:00:00Z") + i * 60_000).toISOString();
      samples.push(sample("heartRate", t, t, 60));
    }
    const found = buildWearableDays(samples, { timeZone: "UTC" }).find(
      (d) => d.date === "2026-09-02",
    );
    expect(found?.sleepMinutes).toBe(420);
  });
});
