import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppStateProvider } from "./AppStateProvider";
import { useAppState } from "@/hooks/useAppState";
import { STORAGE_KEY } from "@/lib/storage";
import type {
  CheckIn,
  ChildProfile,
  FoodEntry,
  MissionLog,
  ParentLog,
  ParentSettings,
} from "@/types";

function wrapper({ children }: { children: ReactNode }) {
  return <AppStateProvider>{children}</AppStateProvider>;
}

describe("AppStateProvider and useAppState hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("provides empty initial state when storage is empty", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.state.schemaVersion).toBe(1);
    expect(result.current.state.child).toBeNull();
    expect(result.current.state.checkIns).toEqual([]);
  });

  it("updates child profile with setChild and persists to localStorage", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const profile: ChildProfile = { nickname: "Lucas" };

    act(() => {
      result.current.actions.setChild(profile);
    });

    expect(result.current.state.child).toEqual(profile);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored.child).toEqual(profile);
  });

  it("updates parent settings with setSettings", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const settings: ParentSettings = {
      pinHash: "hash123",
      pinSalt: "salt123",
      allowedMissionIds: ["mission-1"],
    };

    act(() => {
      result.current.actions.setSettings(settings);
    });

    expect(result.current.state.settings).toEqual(settings);
  });

  it("appends check-in with addCheckIn", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const checkIn: CheckIn = {
      id: "ci-test-1",
      date: "2026-10-03",
      answers: { energy: 3 },
      notToday: false,
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn);
    });

    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.checkIns[0]).toEqual(checkIn);
  });

  it("appends mission log with addMissionLog", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const log: MissionLog = {
      id: "ml-test-1",
      date: "2026-10-03",
      missionId: "flamenco-balance",
      status: "completed",
      company: "family",
      confirmedBy: "child",
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addMissionLog(log);
    });

    expect(result.current.state.missionLogs).toHaveLength(1);
    expect(result.current.state.missionLogs[0]).toEqual(log);
  });

  it("saves parent log with saveParentLog, updating existing date entry if already present", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const log1: ParentLog = {
      date: "2026-10-03",
      sleepHours: 8,
      activity: "moderate",
    };
    const log2: ParentLog = {
      date: "2026-10-03",
      sleepHours: 9,
      activity: "high",
    };

    act(() => {
      result.current.actions.saveParentLog(log1);
    });
    expect(result.current.state.parentLogs).toHaveLength(1);
    expect(result.current.state.parentLogs[0]?.sleepHours).toBe(8);

    act(() => {
      result.current.actions.saveParentLog(log2);
    });
    expect(result.current.state.parentLogs).toHaveLength(1);
    expect(result.current.state.parentLogs[0]?.sleepHours).toBe(9);
  });

  it("appends food entry with addFoodEntry", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const food: FoodEntry = {
      id: "fe-1",
      date: "2026-10-03",
      text: "Arroz con pollo hervido",
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addFoodEntry(food);
    });

    expect(result.current.state.foodEntries).toHaveLength(1);
    expect(result.current.state.foodEntries[0]).toEqual(food);
  });

  it("equips and unequips item in companion", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.actions.equipItem("pirate-hat");
    });

    expect(result.current.state.companion.equippedItemIds).toContain("pirate-hat");
  });

  it("clearAll resets state and removes from localStorage", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.actions.setChild({ nickname: "Lucas" });
    });
    expect(result.current.state.child).not.toBeNull();

    act(() => {
      result.current.actions.clearAll();
    });

    expect(result.current.state.child).toBeNull();
    expect(result.current.state.checkIns).toEqual([]);
  });
});
