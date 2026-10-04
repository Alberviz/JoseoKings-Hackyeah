import { describe, expect, it, vi, beforeEach } from "vitest";
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

  it("fetches steps, heart rate and sleep from the v4 endpoints and normalizes them", async () => {
    const urls: string[] = [];
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      urls.push(url);
      if (url.includes("/dataTypes/steps/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              dataPoints: [
                {
                  steps: {
                    interval: {
                      startTime: "2023-11-14T22:13:20Z",
                      endTime: "2023-11-14T22:14:20Z",
                    },
                    count: "120",
                  },
                },
              ],
            }),
        });
      }
      if (url.includes("/dataTypes/heart-rate/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              dataPoints: [
                {
                  heartRate: {
                    sampleTime: { physicalTime: "2023-11-14T22:13:25Z" },
                    beatsPerMinute: "70",
                  },
                },
                {
                  heartRate: {
                    sampleTime: { physicalTime: "2023-11-14T22:13:45Z" },
                    beatsPerMinute: "72",
                  },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
    });
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000060000,
      timeZone: "UTC",
    });

    expect(urls.every((u) => u.startsWith("https://health.googleapis.com/v4/users/me/"))).toBe(
      true,
    );
    expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer mock-token");
    const stepSample = result.samples.find((s) => s.metric === "steps");
    expect(stepSample?.value).toBe(120);
    // two heart-rate readings in the same minute are thinned to one
    expect(result.samples.filter((s) => s.metric === "heartRate")).toHaveLength(1);
    expect(result.dailyMetrics.length).toBe(1);
    expect(result.metricStatus.steps).toEqual({ status: "ok" });
    expect(result.metricStatus.sleep).toEqual({ status: "ok" });
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
    expect(result.metricStatus.sleep).toEqual({ status: "network-error", message: "offline" });
  });

  it("still throws on 403 from the sleep endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/sleep/")) return Promise.resolve({ ok: false, status: 403 });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ dataPoints: [] }) });
      }),
    );

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
});
