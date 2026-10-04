import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { saveWatchState, WATCH_STORAGE_KEY } from "@/lib/storage/watchStore";
import { localDateTime } from "@/lib/wearables/validity";
import type { WatchSample } from "@/lib/wearables/types";
import type { WatchDevice, WatchState } from "@/types/watch";
import { useWatchSync } from "./useWatchSync";

const devices: WatchDevice[] = [
  {
    id: "watch",
    kind: "watch",
    label: "Watch · X",
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

function stepSample(source: string, value: number): WatchSample {
  const at = new Date(yesterdayMs).toISOString();
  return { metric: "steps", startAt: at, endAt: at, value, source };
}

function seed(extra: Partial<WatchState> = {}): WatchState {
  const state: WatchState = {
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
    rawSamples: [stepSample("watch", 100), stepSample("phone", 900)],
    ...extra,
  };
  saveWatchState(state);
  return state;
}

describe("useWatchSync selectDevice", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("rebuilds the days with one device, keeps older days and the last sync time", () => {
    seed();
    const { result } = renderHook(() => useWatchSync());
    act(() => result.current.selectDevice("steps", "phone"));

    const { days, lastSyncAt, deviceSelection } = result.current.watch;
    expect(days.map((d) => d.date)).toEqual(["2020-01-01", yesterday]);
    expect(days[1].steps).toBe(900);
    expect(lastSyncAt).toBe("2026-10-01T08:00:00.000Z");
    expect(deviceSelection?.steps).toBe("phone");
    expect(JSON.parse(localStorage.getItem(WATCH_STORAGE_KEY) ?? "{}").deviceSelection.steps).toBe(
      "phone",
    );
    expect(result.current.message).toBeNull();

    act(() => result.current.selectDevice("steps", null));
    // automatic prefers the watch
    expect(result.current.watch.days[1].steps).toBe(100);
  });

  it("keeps the choice and asks for a new sync when the readings were not kept", () => {
    seed({ rawSamples: undefined });
    const { result } = renderHook(() => useWatchSync());
    act(() => result.current.selectDevice("steps", "phone"));
    expect(result.current.watch.deviceSelection?.steps).toBe("phone");
    expect(result.current.watch.days.map((d) => d.date)).toEqual(["2020-01-01"]);
    expect(result.current.message).toBe("Sync again to apply the new device.");
  });
});
