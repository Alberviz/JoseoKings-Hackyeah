import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WatchState } from "@/types/watch";
import {
  createEmptyWatchState,
  loadWatchState,
  mergeWatchDays,
  saveWatchState,
  WATCH_STORAGE_KEY,
  watchStateSchema,
} from "./watchStore";

const day = {
  date: "2026-10-01",
  steps: 4000,
  restingHr: 70,
  sleepMinutes: 480,
  nightComplete: true,
  dayComplete: true,
};

const sample = {
  metric: "steps",
  startAt: "2026-10-01T10:00:00.000Z",
  endAt: "2026-10-01T10:01:00.000Z",
  value: 10,
  source: "watch-uid-1",
};

const device = {
  id: "watch-uid-1",
  kind: "watch",
  label: "Watch · Fitbit Charge 6",
  metrics: ["steps", "heartRate"],
  sampleCounts: { steps: 1 },
};

function store(value: unknown) {
  localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(value));
}

describe("watch store", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("round-trips the new shape", () => {
    const state: WatchState = {
      days: [{ ...day, restingHrSource: "watch-daily" }],
      lastSyncAt: "2026-10-02T08:00:00.000Z",
      isDemo: false,
      devices: [
        {
          id: "watch-uid-1",
          kind: "watch",
          label: "Watch · Fitbit Charge 6",
          metrics: ["steps", "heartRate"],
          sampleCounts: { steps: 1 },
        },
      ],
      deviceSelection: { steps: "watch-uid-1", heartRate: null, sleep: null },
      rawSamples: [{ ...sample, metric: "steps" }],
    };
    saveWatchState(state);
    expect(loadWatchState()).toEqual(state);
  });

  it("round-trips the night method, its gap and the main-sleep flag", () => {
    const state: WatchState = {
      days: [
        {
          ...day,
          restingHrSource: "night-samples",
          restingHrMethod: "sparse-3-readings",
          restingHrGapMin: 30,
        },
      ],
      lastSyncAt: null,
      isDemo: false,
      devices: [
        { id: "watch-uid-1", kind: "watch", label: "Watch · Fitbit Charge 6", metrics: ["sleep"] },
      ],
      rawSamples: [{ ...sample, metric: "sleepSession", isMainSleep: true }],
    };
    saveWatchState(state);
    expect(loadWatchState()).toEqual(state);
  });

  it("migrates the old shape: device names and the global selection are dropped", () => {
    store({
      days: [day],
      lastSyncAt: "2026-10-02T08:00:00.000Z",
      isDemo: false,
      devices: ["Pixel Watch 2", "Pixel 8"],
      selectedDevice: "Pixel Watch 2",
      rawSamples: [{ ...sample, source: "Pixel Watch 2" }],
    });
    const loaded = loadWatchState();
    expect(loaded.days).toEqual([day]);
    expect(loaded.devices).toBeUndefined();
    expect(loaded.deviceSelection).toBeUndefined();
    // old raw samples cannot be matched to a device list, so the parent syncs again
    expect(loaded.rawSamples).toBeUndefined();
    expect(loaded).not.toHaveProperty("selectedDevice");
  });

  it("keeps the days when the devices or the selection are corrupt", () => {
    store({
      days: [day],
      lastSyncAt: null,
      isDemo: false,
      devices: [{ id: 5 }],
      deviceSelection: "nope",
      rawSamples: [{ metric: "bogus" }],
    });
    const loaded = loadWatchState();
    expect(loaded.days).toEqual([day]);
    expect(loaded.devices).toBeUndefined();
    expect(loaded.rawSamples).toBeUndefined();
  });

  it("repairs a partly broken selection", () => {
    store({
      days: [],
      lastSyncAt: null,
      isDemo: false,
      devices: [device],
      deviceSelection: { steps: "watch-uid-1", heartRate: 7 },
    });
    expect(loadWatchState().deviceSelection).toEqual({
      steps: "watch-uid-1",
      heartRate: null,
      sleep: null,
    });
  });

  it("returns an empty state for broken JSON or a wrong shape", () => {
    localStorage.setItem(WATCH_STORAGE_KEY, "{broken");
    expect(loadWatchState()).toEqual(createEmptyWatchState());
    store({ days: "nope" });
    expect(loadWatchState()).toEqual(createEmptyWatchState());
  });

  it("rejects raw samples with a wrong shape through the schema", () => {
    const parsed = watchStateSchema.safeParse({
      days: [],
      lastSyncAt: null,
      isDemo: false,
      devices: [],
      rawSamples: [{ ...sample, value: "ten" }],
    });
    expect(parsed.success && parsed.data.rawSamples).toBeFalsy();
  });

  it("merges days by date and keeps the selection when none is given", () => {
    const existing: WatchState = {
      days: [day],
      lastSyncAt: null,
      isDemo: false,
      deviceSelection: { steps: "a", heartRate: null, sleep: null },
    };
    const merged = mergeWatchDays(existing, [{ ...day, date: "2026-10-02" }], { isDemo: false });
    expect(merged.days.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(merged.deviceSelection).toEqual(existing.deviceSelection);
  });
});
