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
    const demo = getDemoWearableData("demo-child-1");
    expect(demo).toHaveLength(30);
    expect(demo[0].steps).toBeGreaterThan(5000);
    expect(demo[0].valid_activity).toBe(true);
    expect(demo[0].valid_sleep).toBe(true);
    expect(demo[0].resting_hr).toBeGreaterThan(60);
  });
});
