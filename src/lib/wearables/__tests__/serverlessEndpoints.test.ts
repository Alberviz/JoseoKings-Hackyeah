import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as collectGet, POST as collectPost } from "@/app/api/jobs/collect/route";
import { POST as analysePost } from "@/app/api/jobs/analyse/route";
import { POST as ingestPost } from "@/app/api/ingest/route";
import { createWearablesClient, SupabaseWearablesClient } from "../supabase";

describe("SupabaseWearablesClient", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it("initializes from parameters or environment variables", () => {
    const client = createWearablesClient({
      url: "https://test.supabase.co",
      serviceKey: "test-service-key",
    });
    expect(client).toBeInstanceOf(SupabaseWearablesClient);

    process.env.SUPABASE_URL = "https://env.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "env-secret-key";
    const envClient = new SupabaseWearablesClient();
    expect(envClient).toBeInstanceOf(SupabaseWearablesClient);
  });

  it("sends correct headers and postgrest request on queryWatchSamples", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () =>
        Promise.resolve(
          JSON.stringify([
            {
              subject_id: "demo-id",
              metric: "steps",
              value: 100,
              start_at: "2026-10-03T10:00:00Z",
              end_at: "2026-10-03T10:01:00Z",
              source: "test",
            },
          ]),
        ),
    });
    global.fetch = mockFetch;

    const client = createWearablesClient({
      url: "https://test.supabase.co",
      serviceKey: "test-key",
    });

    const samples = await client.queryWatchSamples({
      subjectId: "demo-id",
      metric: "steps",
      startAtGte: "2026-10-03T00:00:00Z",
    });

    expect(samples.length).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = mockFetch.mock.calls[0];
    expect(callUrl).toContain("/rest/v1/watch_samples");
    expect(callUrl).toContain("subject_id=eq.demo-id");
    expect(callUrl).toContain("metric=eq.steps");
    expect(callInit.headers.apikey).toBe("test-key");
    expect(callInit.headers.Authorization).toBe("Bearer test-key");
  });

  it("handles upsert of watch_samples in batches with resolution=merge-duplicates", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(""),
    });
    global.fetch = mockFetch;

    const client = createWearablesClient({
      url: "https://test.supabase.co",
      serviceKey: "test-key",
    });

    const written = await client.insertWatchSamples([
      {
        subject_id: "demo-id",
        metric: "steps",
        value: 50,
        start_at: "2026-10-03T10:00:00Z",
        end_at: "2026-10-03T10:01:00Z",
        source: "test",
      },
    ]);

    expect(written).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [callUrl, callInit] = mockFetch.mock.calls[0];
    expect(callUrl).toContain(
      "/rest/v1/watch_samples?on_conflict=subject_id,metric,source,start_at",
    );
    expect(callInit.headers.Prefer).toBe("resolution=merge-duplicates,return=minimal");
  });

  it("throws descriptive error when Supabase responds with error status", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("Invalid API key"),
    });

    const client = createWearablesClient({
      url: "https://test.supabase.co",
      serviceKey: "invalid-key",
    });

    await expect(
      client.insertCollectorRun({
        subject_id: "demo-id",
        started_at: new Date().toISOString(),
        window_start: new Date().toISOString(),
        window_end: new Date().toISOString(),
        rows_written: 0,
        counts: {},
        errors: {},
      }),
    ).rejects.toThrow("Supabase 401 on /collector_runs: Invalid API key");
  });
});

describe("Jobs & Ingest Route Handlers", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.CRON_SECRET;
    delete process.env.INGEST_SECRET;
  });

  describe("/api/jobs/collect", () => {
    it("returns 401 if unauthorized and CRON_SECRET is set", async () => {
      process.env.CRON_SECRET = "secure-cron-key";
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      const req = new Request("http://localhost:3000/api/jobs/collect", {
        method: "POST",
      });
      const res = await collectPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toContain("Unauthorized");
    });

    it("returns 500 when Google credentials are missing", async () => {
      process.env.CRON_SECRET = "secure-cron-key";
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_REFRESH_TOKEN;

      const req = new Request("http://localhost:3000/api/jobs/collect", {
        method: "POST",
        headers: {
          Authorization: "Bearer secure-cron-key",
        },
      });
      const res = await collectPost(req);
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.message).toContain("Missing Google Fit credentials");
    });

    it("allows GET in dev mode when CRON_SECRET is not set", async () => {
      delete process.env.CRON_SECRET;
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      delete process.env.GOOGLE_CLIENT_ID;

      const req = new Request("http://localhost:3000/api/jobs/collect", {
        method: "GET",
      });
      const res = await collectGet(req);
      expect(res.status).toBe(500); // Pass authorization, hits missing credentials
    });
  });

  describe("/api/jobs/analyse", () => {
    it("returns 401 if unauthorized and CRON_SECRET is set", async () => {
      process.env.CRON_SECRET = "secure-cron-key";
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      const req = new Request("http://localhost:3000/api/jobs/analyse", {
        method: "POST",
      });
      const res = await analysePost(req);
      expect(res.status).toBe(401);
    });

    it("executes analysis run when authorized and store is mocked", async () => {
      process.env.CRON_SECRET = "secure-cron-key";
      process.env.SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SECRET_KEY = "mock-key";

      // Mock fetch for Supabase calls in runAnalysisPass
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/watch_samples")) {
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                JSON.stringify([
                  {
                    subject_id: "2facc395-3e2d-4afe-8a6b-80da5a5a6c61",
                    metric: "steps",
                    value: 4000,
                    start_at: "2026-10-03T10:00:00Z",
                    end_at: "2026-10-03T10:01:00Z",
                    source: "test",
                  },
                ]),
              ),
          });
        }
        if (
          url.includes("/checkins") ||
          url.includes("/parent_logs") ||
          url.includes("/food_entries") ||
          url.includes("/missions_done")
        ) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(JSON.stringify([])),
          });
        }
        // Writes (daily_metrics, analysis_runs)
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(""),
        });
      });

      const req = new Request("http://localhost:3000/api/jobs/analyse", {
        method: "POST",
        headers: {
          Authorization: "Bearer secure-cron-key",
        },
      });
      const res = await analysePost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.dailyMetricsDerived).toBeGreaterThanOrEqual(1);
    });
  });

  describe("/api/ingest", () => {
    it("validates invalid payload with 422 error", async () => {
      const req = new Request("http://localhost:3000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret" },
        body: JSON.stringify({
          checkins: [
            {
              date: "not-a-date", // invalid date format
              answers: {},
            },
          ],
        }),
      });
      const res = await ingestPost(req);
      expect(res.status).toBe(422);
      const json = await res.json();
      expect(json.error).toBe("Validation failed");
    });

    it("ingests checkins, parent logs, missions and observations successfully", async () => {
      process.env.SUPABASE_URL = "https://mock.supabase.co";
      process.env.SUPABASE_SECRET_KEY = "mock-key";

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(""),
      });
      global.fetch = mockFetch;

      const payload = {
        checkins: [
          {
            id: "chk-1",
            date: "2026-10-03",
            answers: {
              "belly-comfort": 0,
              energy: 0,
              "play-pace": 0,
            },
            notToday: false,
            createdAt: "2026-10-03T18:00:00Z",
          },
        ],
        parentLogs: [
          {
            date: "2026-10-03",
            sleepHours: 8.5,
            activity: "moderate",
            school: "attended",
            medicationTaken: "yes",
            note: "Good day",
          },
        ],
        missions: [
          {
            id: "mis-1",
            date: "2026-10-03",
            missionId: "dragon-breathing",
            status: "completed",
            company: "family",
            confirmedBy: "parent-pin",
            createdAt: "2026-10-03T19:00:00Z",
          },
        ],
      };

      const req = new Request("http://localhost:3000/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test-secret" },
        body: JSON.stringify(payload),
      });

      const res = await ingestPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe("ok");
      expect(json.synced.checkinsWritten).toBe(1);
      expect(json.synced.parentLogsWritten).toBe(1);
      expect(json.synced.observationsWritten).toBe(1); // auto-generated from activity: "moderate"
      expect(json.synced.missionsWritten).toBe(1);
    });
  });
});
