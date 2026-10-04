import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WearableState } from "@/types/wearable";
import {
  createEmptyWearableState,
  clearWearableState,
  LEGACY_WATCH_STORAGE_KEY,
  loadWearableState,
  mergeWearableDays,
  saveWearableState,
  WEARABLE_STORAGE_KEY,
  wearableStateSchema,
} from "./wearableStore";

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
  source: "wearable-uid-1",
};

const device = {
  id: "wearable-uid-1",
  kind: "wearable",
  label: "Wearable · Fitbit Charge 6",
  metrics: ["steps", "heartRate"],
  sampleCounts: { steps: 1 },
};

function store(value: unknown) {
  localStorage.setItem(WEARABLE_STORAGE_KEY, JSON.stringify(value));
}

describe("wearable store", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("round-trips the new shape", () => {
    const state: WearableState = {
      days: [{ ...day, restingHrSource: "wearable-daily" }],
      lastSyncAt: "2026-10-02T08:00:00.000Z",
      isDemo: false,
      devices: [
        {
          id: "wearable-uid-1",
          kind: "wearable",
          label: "Wearable · Fitbit Charge 6",
          metrics: ["steps", "heartRate"],
          sampleCounts: { steps: 1 },
        },
      ],
      deviceSelection: { steps: "wearable-uid-1", heartRate: null, sleep: null },
      rawSamples: [{ ...sample, metric: "steps" }],
    };
    saveWearableState(state);
    expect(loadWearableState()).toEqual(state);
  });

  it("round-trips the night method, its gap and the main-sleep flag", () => {
    const state: WearableState = {
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
        {
          id: "wearable-uid-1",
          kind: "wearable",
          label: "Wearable · Fitbit Charge 6",
          metrics: ["sleep"],
        },
      ],
      rawSamples: [{ ...sample, metric: "sleepSession", isMainSleep: true }],
    };
    saveWearableState(state);
    expect(loadWearableState()).toEqual(state);
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
    const loaded = loadWearableState();
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
    const loaded = loadWearableState();
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
      deviceSelection: { steps: "wearable-uid-1", heartRate: 7 },
    });
    expect(loadWearableState().deviceSelection).toEqual({
      steps: "wearable-uid-1",
      heartRate: null,
      sleep: null,
    });
  });

  it("returns an empty state for broken JSON or a wrong shape", () => {
    localStorage.setItem(WEARABLE_STORAGE_KEY, "{broken");
    expect(loadWearableState()).toEqual(createEmptyWearableState());
    store({ days: "nope" });
    expect(loadWearableState()).toEqual(createEmptyWearableState());
  });

  it("rejects raw samples with a wrong shape through the schema", () => {
    const parsed = wearableStateSchema.safeParse({
      days: [],
      lastSyncAt: null,
      isDemo: false,
      devices: [],
      rawSamples: [{ ...sample, value: "ten" }],
    });
    expect(parsed.success && parsed.data.rawSamples).toBeFalsy();
  });

  it("merges days by date and keeps the selection when none is given", () => {
    const existing: WearableState = {
      days: [day],
      lastSyncAt: null,
      isDemo: false,
      deviceSelection: { steps: "a", heartRate: null, sleep: null },
    };
    const merged = mergeWearableDays(existing, [{ ...day, date: "2026-10-02" }], { isDemo: false });
    expect(merged.days.map((d) => d.date)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(merged.deviceSelection).toEqual(existing.deviceSelection);
  });

  describe("migration from the old watch names", () => {
    const legacyState = {
      days: [{ ...day, restingHrSource: "watch-daily" }],
      lastSyncAt: "2026-10-02T08:00:00.000Z",
      isDemo: false,
      devices: [{ ...device, kind: "watch" }],
    };

    it("moves the old key to the new key and removes the old one", () => {
      localStorage.setItem(LEGACY_WATCH_STORAGE_KEY, JSON.stringify(legacyState));
      const loaded = loadWearableState();
      expect(loaded.days).toHaveLength(1);
      expect(loaded.days[0].restingHrSource).toBe("wearable-daily");
      expect(loaded.devices?.[0].kind).toBe("wearable");
      expect(localStorage.getItem(LEGACY_WATCH_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(WEARABLE_STORAGE_KEY)).not.toBeNull();
    });

    it("keeps the new key when both exist and drops the old one", () => {
      store({ ...legacyState, days: [] });
      localStorage.setItem(LEGACY_WATCH_STORAGE_KEY, JSON.stringify(legacyState));
      expect(loadWearableState().days).toHaveLength(0);
      expect(localStorage.getItem(LEGACY_WATCH_STORAGE_KEY)).toBeNull();
    });

    it("does nothing when neither key exists", () => {
      expect(loadWearableState().days).toEqual([]);
      expect(localStorage.getItem(WEARABLE_STORAGE_KEY)).toBeNull();
    });

    it("clearing removes the old key too", () => {
      localStorage.setItem(LEGACY_WATCH_STORAGE_KEY, "{}");
      clearWearableState();
      expect(localStorage.getItem(LEGACY_WATCH_STORAGE_KEY)).toBeNull();
    });
  });
});
