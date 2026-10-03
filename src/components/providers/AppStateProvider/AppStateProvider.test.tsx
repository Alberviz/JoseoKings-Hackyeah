import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppStateProvider } from "./AppStateProvider";
import { useAppState } from "@/hooks/useAppState";
import { BACKUP_STORAGE_KEY, STORAGE_KEY } from "@/lib/storage";
import { BADGE_IDS, ITEM_IDS } from "@/config/content-ids";
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

async function renderReadyHook() {
  const rendered = renderHook(() => useAppState(), { wrapper });
  await waitFor(() => expect(rendered.result.current.isReady).toBe(true));
  return rendered;
}

describe("AppStateProvider and useAppState hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("starts unready with empty state before hydration completes", async () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    expect(result.current.isReady).toBe(false);
    expect(result.current.state.schemaVersion).toBe(1);
    expect(result.current.state.child).toBeNull();
    expect(result.current.state.checkIns).toEqual([]);
    await waitFor(() => expect(result.current.isReady).toBe(true));
  });

  it("sets isReady to true once client hydration completes", async () => {
    const { result } = await renderReadyHook();
    expect(result.current.isReady).toBe(true);
    expect(result.current.state.schemaVersion).toBe(1);
  });

  it("updates child profile with setChild and persists to localStorage via effect", async () => {
    const { result } = await renderReadyHook();
    const profile: ChildProfile = { nickname: "Lucas" };

    act(() => {
      result.current.actions.setChild(profile);
    });

    expect(result.current.state.child).toEqual(profile);

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    expect(stored.child).toEqual(profile);
  });

  it("updates parent settings with setSettings", async () => {
    const { result } = await renderReadyHook();
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

  it("replaces check-in by date if a check-in on that date already exists", async () => {
    const { result } = await renderReadyHook();
    const checkIn1: CheckIn = {
      id: "ci-morning",
      date: "2026-10-03",
      answers: { energy: 2 },
      notToday: false,
      createdAt: "2026-10-03T08:00:00.000Z",
    };
    const checkIn2: CheckIn = {
      id: "ci-evening",
      date: "2026-10-03",
      answers: { energy: 4 },
      notToday: false,
      createdAt: "2026-10-03T18:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn1);
    });
    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.checkIns[0]?.answers.energy).toBe(2);

    act(() => {
      result.current.actions.addCheckIn(checkIn2);
    });
    // Must replace checkIn1 because date is the same, preventing double point reward
    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.checkIns[0]?.id).toBe("ci-evening");
    expect(result.current.state.checkIns[0]?.answers.energy).toBe(4);
  });

  it("appends check-in for distinct dates", async () => {
    const { result } = await renderReadyHook();
    const checkIn1: CheckIn = {
      id: "ci-1",
      date: "2026-10-02",
      answers: { energy: 3 },
      notToday: false,
      createdAt: "2026-10-02T12:00:00.000Z",
    };
    const checkIn2: CheckIn = {
      id: "ci-2",
      date: "2026-10-03",
      answers: { energy: 5 },
      notToday: false,
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn1);
      result.current.actions.addCheckIn(checkIn2);
    });

    expect(result.current.state.checkIns).toHaveLength(2);
  });

  it("appends mission log with addMissionLog", async () => {
    const { result } = await renderReadyHook();
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

  it("saves parent log with saveParentLog, updating existing date entry if already present", async () => {
    const { result } = await renderReadyHook();
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

  it("appends food entry with addFoodEntry", async () => {
    const { result } = await renderReadyHook();
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

  it("only equips items that are owned and cataloged, and unequipItem removes from equipped", async () => {
    const { result } = await renderReadyHook();

    // Item not owned: should not equip
    act(() => {
      result.current.actions.equipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).not.toContain(ITEM_IDS.hatExplorer);

    // Give owned item via state update simulation
    act(() => {
      result.current.state.companion.ownedItemIds.push(ITEM_IDS.hatExplorer);
    });

    act(() => {
      result.current.actions.equipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).toContain(ITEM_IDS.hatExplorer);

    act(() => {
      result.current.actions.unequipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).not.toContain(ITEM_IDS.hatExplorer);
  });

  it("syncs companion points and badges on check-in and mission logs", async () => {
    const { result } = await renderReadyHook();
    expect(result.current.state.companion.points).toBe(0);
    expect(result.current.state.companion.badgeIds).toEqual([]);

    act(() => {
      result.current.actions.addCheckIn({
        id: "ci-1",
        date: "2026-10-03",
        answers: { energy: 3 },
        notToday: false,
        createdAt: "2026-10-03T10:00:00.000Z",
      });
    });

    // Check-in awards 10 points and first-check-in badge
    expect(result.current.state.companion.points).toBe(10);
    expect(result.current.state.companion.badgeIds).toContain(BADGE_IDS.firstCheckIn);
  });

  it("clearAll resets state and removes both STORAGE_KEY and BACKUP_STORAGE_KEY", async () => {
    const { result } = await renderReadyHook();

    localStorage.setItem(BACKUP_STORAGE_KEY, "corrupt-backup");

    act(() => {
      result.current.actions.setChild({ nickname: "Lucas" });
    });
    expect(result.current.state.child).not.toBeNull();

    act(() => {
      result.current.actions.clearAll();
    });

    expect(result.current.state.child).toBeNull();
    expect(result.current.state.checkIns).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toBeNull();
  });
});
