import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { saveWearableState, WEARABLE_STORAGE_KEY } from "@/lib/storage/wearableStore";
import { localDateTime } from "@/lib/wearables/validity";
import type { WearableSample } from "@/lib/wearables/types";
import type { WearableDevice, WearableState } from "@/types/wearable";
import { useWearableSync } from "./useWearableSync";

const devices: WearableDevice[] = [
  {
    id: "wearable",
    kind: "wearable",
    label: "Wearable · X",
    metrics: ["steps"],
    sampleCounts: { steps: 1 },
  },
  {
    id: "phone",
    kind: "phone",
    label: "Phone · Y",
    metrics: ["steps"],
    sampleCounts: { steps: 1 },
  },
];

const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const yesterdayMs = Date.now() - 86_400_000;
const yesterday = localDateTime(yesterdayMs, timeZone).date;

function stepSample(source: string, value: number): WearableSample {
  const at = new Date(yesterdayMs).toISOString();
  return { metric: "steps", startAt: at, endAt: at, value, source };
}

function seed(extra: Partial<WearableState> = {}): WearableState {
  const state: WearableState = {
    days: [
      {
        date: "2020-01-01",
        steps: 1,
        restingHr: null,
        sleepMinutes: null,
        nightComplete: false,
        dayComplete: false,
      },
    ],
    lastSyncAt: "2026-10-01T08:00:00.000Z",
    isDemo: false,
    devices,
    deviceSelection: { steps: null, heartRate: null, sleep: null },
    rawSamples: [stepSample("wearable", 100), stepSample("phone", 900)],
    ...extra,
  };
  saveWearableState(state);
  return state;
}

describe("useWearableSync selectDevice", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("rebuilds the days with one device, keeps older days and the last sync time", () => {
    seed();
    const { result } = renderHook(() => useWearableSync());
    act(() => result.current.selectDevice("steps", "phone"));

    const { days, lastSyncAt, deviceSelection } = result.current.wearable;
    expect(days.map((d) => d.date)).toEqual(["2020-01-01", yesterday]);
    expect(days[1].steps).toBe(900);
    expect(lastSyncAt).toBe("2026-10-01T08:00:00.000Z");
    expect(deviceSelection?.steps).toBe("phone");
    expect(
      JSON.parse(localStorage.getItem(WEARABLE_STORAGE_KEY) ?? "{}").deviceSelection.steps,
    ).toBe("phone");
    expect(result.current.message).toBeNull();

    act(() => result.current.selectDevice("steps", null));
    // automatic prefers the wearable
    expect(result.current.wearable.days[1].steps).toBe(100);
  });

  it("keeps the choice and asks for a new sync when the readings were not kept", () => {
    seed({ rawSamples: undefined });
    const { result } = renderHook(() => useWearableSync());
    act(() => result.current.selectDevice("steps", "phone"));
    expect(result.current.wearable.deviceSelection?.steps).toBe("phone");
    expect(result.current.wearable.days.map((d) => d.date)).toEqual(["2020-01-01"]);
    expect(result.current.message).toBe("Sync again to apply the new device.");
  });
});
