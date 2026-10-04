import { describe, expect, it } from "vitest";
import {
  dailyRestingHrPointsToRows,
  googleDateToKey,
  heartRatePointsToRows,
  sleepPointsToRows,
  stepPointsToRows,
} from "../googleHealthV4";
import {
  heartRateWatch,
  restingDailyObject,
  restingDailyString,
  sleepWatch,
  stepsPhone,
  stepsWatch,
} from "./fixtures";

describe("googleHealthV4 converters", () => {
  it("reads int64 step counts sent as strings and tags each row with its device id", () => {
    const rows = stepPointsToRows([
      stepsWatch("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "120"),
      stepsPhone("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "95"),
      stepsWatch("2026-09-01T11:00:00Z", "2026-09-01T11:01:00Z", "not-a-number"),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ metric: "steps", value: 120, source: "watch-uid-1" });
    expect(rows[1]).toMatchObject({ value: 95, source: "Google|Pixel 8|PHONE" });
  });

  it("reads heart rate from sampleTime only and keeps one reading per minute per device", () => {
    const rows = heartRatePointsToRows([
      heartRateWatch("2026-09-01T22:13:05Z", "70"),
      heartRateWatch("2026-09-01T22:13:45Z", "72"),
      heartRateWatch("2026-09-01T22:14:05Z", "68"),
      heartRateWatch("2026-09-01T22:15:05Z", "0"),
    ]);
    expect(rows.map((r) => r.value)).toEqual([70, 68]);
    expect(rows[0].metric).toBe("heartRate");
  });

  it("skips naps and prefers minutesAsleep over the session length", () => {
    const rows = sleepPointsToRows([
      sleepWatch("2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", "450", false),
      sleepWatch("2026-09-02T13:00:00Z", "2026-09-02T14:00:00Z", "50", true),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ metric: "sleepSession", value: 450 });
  });

  it("falls back to the session length when minutesAsleep is missing", () => {
    const point = sleepWatch("2026-09-01T22:00:00Z", "2026-09-02T06:00:00Z", "x", false);
    const rows = sleepPointsToRows([point]);
    expect(rows[0].value).toBe(480);
  });

  it("reads the daily resting heart rate with a string date and with a Date object", () => {
    const rows = dailyRestingHrPointsToRows([
      restingDailyString("2026-09-01", "61"),
      restingDailyObject(2026, 9, 2, "63"),
      restingDailyObject(2026, 13, 2, "63"),
      restingDailyString("2026-09-03", "oops"),
    ]);
    expect(rows).toEqual([
      {
        metric: "restingHrDaily",
        startAt: "2026-09-01",
        endAt: "2026-09-01",
        value: 61,
        source: "watch-uid-1",
      },
      {
        metric: "restingHrDaily",
        startAt: "2026-09-02",
        endAt: "2026-09-02",
        value: 63,
        source: "watch-uid-1",
      },
    ]);
  });

  it("converts Google dates safely", () => {
    expect(googleDateToKey({ year: 2026, month: 1, day: 5 })).toBe("2026-01-05");
    expect(googleDateToKey("2026-01-05")).toBe("2026-01-05");
    expect(googleDateToKey("5 Jan")).toBeNull();
    expect(googleDateToKey(undefined)).toBeNull();
  });
});
