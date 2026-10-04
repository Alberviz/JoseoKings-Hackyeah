import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  heartRateWatch,
  restingDailyObject,
  restingDailyString,
  sleepWatch,
  stepsPhone,
  stepsWatch,
} from "./fixtures";
import {
  fetchBrowserGoogleHealth,
  getDemoWearableData,
  GoogleHealthError,
} from "../browserGoogleHealth";

describe("browserGoogleHealth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws GoogleHealthError when accessToken is missing", async () => {
    await expect(
      fetchBrowserGoogleHealth({
        accessToken: "",
        startTimeMillis: 1000,
        endTimeMillis: 2000,
      }),
    ).rejects.toThrow(GoogleHealthError);
  });

  it("asks each endpoint with the documented filter and never sends dataSourceFamily", async () => {
    const calls: URL[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        calls.push(new URL(url));
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );

    const start = Date.parse("2026-09-01T10:00:00Z");
    const end = Date.parse("2026-09-03T10:00:00Z");
    await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: start,
      endTimeMillis: end,
      timeZone: "UTC",
    });

    const byType = Object.fromEntries(
      calls.map((u) => [u.pathname.split("/dataTypes/")[1].split("/")[0], u]),
    );
    expect(Object.keys(byType).sort()).toEqual([
      "daily-resting-heart-rate",
      "heart-rate",
      "sleep",
      "steps",
    ]);
    for (const u of calls) {
      expect(u.origin + u.pathname.split("/dataTypes/")[0]).toBe(
        "https://health.googleapis.com/v4/users/me",
      );
      expect(u.pathname.endsWith("/dataPoints")).toBe(true);
      expect(u.searchParams.has("dataSourceFamily")).toBe(false);
      expect(u.search).not.toContain("dataSourceFamily");
    }
    const filter = (type: string) => byType[type].searchParams.get("filter");
    expect(filter("steps")).toBe(
      'steps.interval.start_time >= "2026-09-01T10:00:00.000Z" AND steps.interval.start_time < "2026-09-03T10:00:00.000Z"',
    );
    expect(filter("heart-rate")).toBe(
      'heart_rate.sample_time.physical_time >= "2026-09-01T10:00:00.000Z" AND heart_rate.sample_time.physical_time < "2026-09-03T10:00:00.000Z"',
    );
    expect(filter("daily-resting-heart-rate")).toBe(
      'daily_resting_heart_rate.date >= "2026-09-01" AND daily_resting_heart_rate.date < "2026-09-04"',
    );
    expect(filter("sleep")).toBe('sleep.interval.civil_end_time >= "2026-08-31"');
    expect(byType.steps.searchParams.get("pageSize")).toBe("10000");
    expect(byType["heart-rate"].searchParams.get("pageSize")).toBe("10000");
    expect(byType.sleep.searchParams.get("pageSize")).toBe("25");
    // heart rate is a sample type: it is never asked with an interval field
    expect(calls.every((u) => !u.searchParams.get("filter")?.includes("heart_rate.interval"))).toBe(
      true,
    );
  });

  it("uses civil dates in the user's time zone for the daily resting heart rate", async () => {
    const filters: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/daily-resting-heart-rate/")) {
          filters.push(new URL(url).searchParams.get("filter") ?? "");
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );
    await fetchBrowserGoogleHealth({
      accessToken: "t",
      startTimeMillis: Date.parse("2026-09-01T23:30:00Z"),
      endTimeMillis: Date.parse("2026-09-02T23:30:00Z"),
      timeZone: "Europe/Warsaw",
    });
    // 23:30 UTC is already the next local day in Warsaw (UTC+2 in September)
    expect(filters).toEqual([
      'daily_resting_heart_rate.date >= "2026-09-02" AND daily_resting_heart_rate.date < "2026-09-04"',
    ]);
  });

  it("normalizes string numbers, keeps watch and phone apart and skips naps", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        let dataPoints: unknown[] = [];
        if (url.includes("/dataTypes/steps/")) {
          dataPoints = [
            stepsWatch("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "120"),
            stepsPhone("2026-09-01T10:00:00Z", "2026-09-01T10:01:00Z", "95"),
          ];
        } else if (url.includes("/dataTypes/heart-rate/")) {
          dataPoints = [
            heartRateWatch("2026-09-01T10:00:05Z", "70"),
            heartRateWatch("2026-09-01T10:00:45Z", "72"),
          ];
        } else if (url.includes("/daily-resting-heart-rate/")) {
          dataPoints = [
            restingDailyString("2026-09-01", "61"),
            restingDailyObject(2026, 9, 2, "62"),
          ];
        } else if (url.includes("/dataTypes/sleep/")) {
          dataPoints = [
            sleepWatch("2026-08-31T22:00:00Z", "2026-09-01T06:00:00Z", "450", false),
            sleepWatch("2026-09-01T13:00:00Z", "2026-09-01T14:00:00Z", "50", true),
          ];
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints }) });
      }),
    );

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: Date.parse("2026-09-01T00:00:00Z"),
      endTimeMillis: Date.parse("2026-09-02T00:00:00Z"),
      timeZone: "UTC",
    });

    const steps = result.samples.filter((s) => s.metric === "steps");
    expect(steps.map((s) => [s.source, s.value])).toEqual([
      ["watch-uid-1", 120],
      ["Google|Pixel 8|PHONE", 95],
    ]);
    expect(result.samples.filter((s) => s.metric === "heartRate")).toHaveLength(1);
    expect(
      result.samples.filter((s) => s.metric === "restingHrDaily").map((s) => s.startAt),
    ).toEqual(["2026-09-01", "2026-09-02"]);
    expect(result.samples.filter((s) => s.metric === "sleepSession")).toHaveLength(1);
    expect(result.devices.map((d) => [d.label, d.metrics])).toEqual([
      ["Watch · Fitbit Charge 6", ["steps", "heartRate", "sleep"]],
      ["Phone · Google Pixel 8", ["steps"]],
    ]);
    // the automatic daily figures use the watch only, so steps are not summed across devices
    expect(result.dailyMetrics.find((d) => d.localDate === "2026-09-01")?.steps).toBe(120);
    expect(result.metricStatus).toEqual({
      steps: { status: "ok", count: 2 },
      heartRate: { status: "ok", count: 1 },
      restingHrDaily: { status: "ok", count: 2 },
      sleep: { status: "ok", count: 1 },
    });
  });

  it("splits heart rate into requests of at most 14 days", async () => {
    const hrUrls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/heart-rate/")) hrUrls.push(url);
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );
    const day = 86_400_000;
    await fetchBrowserGoogleHealth({
      accessToken: "t",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000000000 + 29 * day,
    });
    expect(hrUrls).toHaveLength(3);
  });

  it("follows nextPageToken", async () => {
    let stepCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/dataTypes/steps/")) {
          stepCalls += 1;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve(stepCalls === 1 ? { dataPoints: [], nextPageToken: "abc" } : {}),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
      }),
    );
    await fetchBrowserGoogleHealth({
      accessToken: "t",
      startTimeMillis: 1000,
      endTimeMillis: 2000,
    });
    expect(stepCalls).toBe(2);
  });

  it("reports a typed per-metric status instead of an empty result when a metric fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/heart-rate/")) return Promise.resolve({ ok: false, status: 500 });
        if (url.includes("/sleep/")) return Promise.reject(new Error("offline"));
        return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
      }),
    );

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000060000,
    });

    expect(result.metricStatus.steps).toEqual({ status: "invalid-response" });
    expect(result.metricStatus.heartRate).toEqual({ status: "http-error", httpStatus: 500 });
    expect(result.metricStatus.restingHrDaily).toEqual({ status: "invalid-response" });
    expect(result.metricStatus.sleep).toEqual({ status: "network-error", message: "offline" });
  });

  it("keeps the other metrics when only sleep answers 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/sleep/")) return Promise.resolve({ ok: false, status: 403 });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );

    const result = await fetchBrowserGoogleHealth({
      accessToken: "limited-token",
      startTimeMillis: 1000,
      endTimeMillis: 2000,
    });
    expect(result.metricStatus.sleep).toEqual({ status: "http-error", httpStatus: 403 });
    expect(result.metricStatus.steps).toEqual({ status: "ok", count: 0 });
  });

  it("throws when every data type answers 403", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403 }));

    await expect(
      fetchBrowserGoogleHealth({
        accessToken: "limited-token",
        startTimeMillis: 1000,
        endTimeMillis: 2000,
      }),
    ).rejects.toThrow(/Google Health API error \(403\)/);
  });

  it("handles HTTP 401 error gracefully", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      }),
    );

    await expect(
      fetchBrowserGoogleHealth({
        accessToken: "invalid-token",
        startTimeMillis: 1000,
        endTimeMillis: 2000,
      }),
    ).rejects.toThrow(/Google Health API error \(401\)/);
  });

  it("provides 30 days of realistic demo data for offline demo", () => {
    const demo = getDemoWearableData();
    expect(demo).toHaveLength(30);
    expect(demo[0].steps).toBeGreaterThan(5000);
    expect(demo[0].validActivity).toBe(true);
    expect(demo[0].validSleep).toBe(true);
    expect(demo[0].restingHr).toBeGreaterThan(60);
  });

  it("puts Google's error reason and message into the metric status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/heart-rate/")) {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () =>
              Promise.resolve({
                error: {
                  code: 400,
                  message: "Invalid filter",
                  status: "INVALID_ARGUMENT",
                  details: [{ "@type": "x", reason: "INVALID_FILTER_FIELD" }],
                },
              }),
          });
        }
        if (url.includes("/dataTypes/sleep/")) {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.reject(new Error("not json")),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000060000,
    });

    expect(result.metricStatus.heartRate).toEqual({
      status: "http-error",
      httpStatus: 400,
      reason: "INVALID_FILTER_FIELD",
      message: "Invalid filter",
    });
    expect(result.metricStatus.sleep).toEqual({ status: "http-error", httpStatus: 500 });
    expect(result.metricStatus.steps).toEqual({ status: "ok", count: 0 });
  });
});
