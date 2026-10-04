import { describe, expect, it } from "vitest";
import { buildWatchDays } from "../buildWatchDays";
import type { WatchSample } from "../types";

const sample = (metric: WatchSample["metric"], startAt: string, endAt: string, value: number) =>
  ({ metric, startAt, endAt, value, source: "test" }) satisfies WatchSample;

describe("buildWatchDays", () => {
  it("returns no days without samples", () => {
    expect(buildWatchDays([], { timeZone: "UTC" })).toEqual([]);
  });

  it("sums steps per local day and flags incomplete days", () => {
    const days = buildWatchDays(
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
        sleepMinutes: null,
        nightComplete: false,
        dayComplete: false,
      },
      {
        date: "2026-09-02",
        steps: 30,
        restingHr: null,
        sleepMinutes: null,
        nightComplete: false,
        dayComplete: false,
      },
    ]);
  });

  it("uses the local day, not the UTC day", () => {
    const days = buildWatchDays(
      [sample("steps", "2026-09-01T23:30:00Z", "2026-09-01T23:31:00Z", 10)],
      { timeZone: "Europe/Warsaw" },
    );
    expect(days.map((d) => d.date)).toEqual(["2026-09-02"]);
  });

  it("drops days before fromDate", () => {
    const days = buildWatchDays(
      [
        sample("steps", "2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", 100),
        sample("steps", "2026-09-02T10:00:00Z", "2026-09-02T10:01:00Z", 30),
      ],
      { timeZone: "UTC", fromDate: "2026-09-02" },
    );
    expect(days.map((d) => d.date)).toEqual(["2026-09-02"]);
  });

  it("marks a night complete with a valid sleep session and enough heart-rate coverage", () => {
    const samples: WatchSample[] = [
      sample("sleepSession", "2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", 480),
    ];
    for (let i = 0; i < 300; i++) {
      const t = new Date(Date.parse("2026-09-01T22:00:00Z") + i * 60_000).toISOString();
      samples.push(sample("heartRate", t, t, 60));
    }
    const day = buildWatchDays(samples, { timeZone: "UTC" }).find((d) => d.date === "2026-09-02");
    expect(day?.nightComplete).toBe(true);
    expect(day?.sleepMinutes).toBe(480);
    expect(day?.restingHr).not.toBeNull();
  });
});
