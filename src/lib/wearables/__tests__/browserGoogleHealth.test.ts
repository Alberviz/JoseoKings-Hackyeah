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

  it("fetches and normalizes aggregate buckets from the browser", async () => {
    const mockAggregateResponse = {
      bucket: [
        {
          startTimeMillis: "1700000000000",
          endTimeMillis: "1700000060000",
          dataset: [
            {
              dataSourceId:
                "derived:com.google.step_count.delta:com.google.android.gms:merge_step_deltas",
              point: [
                {
                  startTimeNanos: "1700000000000000000",
                  endTimeNanos: "1700000060000000000",
                  value: [{ intVal: 120 }],
                },
              ],
            },
          ],
        },
      ],
    };

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/dataset:aggregate")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAggregateResponse),
        });
      }
      if (url.includes("/sessions")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ session: [] }),
        });
      }
      return Promise.resolve({ ok: false, status: 404 });
    });

    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000060000,
    });

    expect(result.samples.length).toBeGreaterThan(0);
    const stepSample = result.samples.find((s) => s.metric === "steps");
    expect(stepSample).toBeDefined();
    expect(stepSample?.value).toBe(120);
    expect(result.dailyMetrics.length).toBe(1);
    expect(result.metricStatus.steps).toEqual({ status: "ok" });
    expect(result.metricStatus.sleep).toEqual({ status: "ok" });
  });

  it("reports a typed per-metric status instead of an empty result when a metric fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string, init?: { body?: string }) => {
        if (url.includes("/dataset:aggregate")) {
          const body = JSON.parse(init?.body ?? "{}") as {
            aggregateBy: Array<{ dataTypeName: string }>;
          };
          const type = body.aggregateBy[0].dataTypeName;
          if (type === "com.google.heart_rate.bpm") {
            return Promise.resolve({ ok: false, status: 500 });
          }
          if (type === "com.google.calories.expended") {
            return Promise.reject(new Error("offline"));
          }
          if (type === "com.google.distance.delta") {
            return Promise.resolve({ ok: true, json: () => Promise.resolve(null) });
          }
          return Promise.resolve({ ok: true, json: () => Promise.resolve({ bucket: [] }) });
        }
        return Promise.resolve({ ok: false, status: 503 });
      }),
    );

    const result = await fetchBrowserGoogleHealth({
      accessToken: "mock-token",
      startTimeMillis: 1700000000000,
      endTimeMillis: 1700000060000,
    });

    expect(result.metricStatus.steps).toEqual({ status: "ok" });
    expect(result.metricStatus.heartRate).toEqual({ status: "http-error", httpStatus: 500 });
    expect(result.metricStatus.calories).toEqual({ status: "network-error", message: "offline" });
    expect(result.metricStatus.distance).toEqual({ status: "invalid-response" });
    expect(result.metricStatus.sleep).toEqual({ status: "http-error", httpStatus: 503 });
  });

  it("still throws on 403 from the sessions endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) => {
        if (url.includes("/sessions")) return Promise.resolve({ ok: false, status: 403 });
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ bucket: [] }) });
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
