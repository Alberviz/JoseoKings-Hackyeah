import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INITIAL_COINS } from "@/config/economy";
import { ITEM_IDS } from "@/config/content-ids";
import { useAppState } from "@/hooks/useAppState";
import { BACKUP_STORAGE_KEY, STORAGE_KEY, createEmptyState } from "@/lib/storage";
import type {
  AppState,
  CheckIn,
  ChildProfile,
  Consultation,
  FoodEntry,
  MissionLog,
  ParentLog,
  ParentSettings,
} from "@/types";
import { AppStateProvider } from "./AppStateProvider";

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

  it("the first render equals the empty state and isReady becomes true after loading", () => {
    const existing = createEmptyState();
    existing.child = { nickname: "Lucas" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));

    const renders: Array<{ state: AppState; isReady: boolean }> = [];
    function TestConsumer() {
      const { state, isReady } = useAppState();
      renders.push({ state, isReady });
      return null;
    }

    render(
      <AppStateProvider>
        <TestConsumer />
      </AppStateProvider>,
    );

    // Initial render before effect runs must equal empty state with isReady = false:
    expect(renders[0].isReady).toBe(false);
    expect(renders[0].state).toEqual(createEmptyState());

    // Final render after loading must have loaded state with isReady = true:
    expect(renders[renders.length - 1].isReady).toBe(true);
    expect(renders[renders.length - 1].state.child?.nickname).toBe("Lucas");
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
    };

    act(() => {
      result.current.actions.setSettings(settings);
    });

    expect(result.current.state.settings).toEqual(settings);
  });

  it("two check-ins on the same day leave one check-in and keep the first id", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    const checkIn1: CheckIn = {
      id: "ci-original-id",
      date: "2026-10-03",
      answers: { mood: 2 },
      notToday: false,
      createdAt: "2026-10-03T09:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn1);
      result.current.actions.addFoodEntry({
        id: "fe-1",
        date: "2026-10-03",
        text: "Oatmeal",
        relatedCheckInId: "ci-original-id",
        createdAt: "2026-10-03T09:30:00.000Z",
      });
    });

    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.checkIns[0].id).toBe("ci-original-id");

    const checkIn2: CheckIn = {
      id: "ci-new-id",
      date: "2026-10-03",
      answers: { mood: 4 },
      notToday: false,
      createdAt: "2026-10-03T18:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn2);
    });

    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.checkIns[0].id).toBe("ci-original-id");
    expect(result.current.state.checkIns[0].answers).toEqual({ mood: 4 });
    expect(result.current.state.foodEntries[0].relatedCheckInId).toBe(
      result.current.state.checkIns[0].id,
    );
  });

  it("points do not double when a check-in of the same day is replaced", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    const checkIn1: CheckIn = {
      id: "ci-1",
      date: "2026-10-03",
      answers: { energy: 3 },
      notToday: false,
      createdAt: "2026-10-03T10:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn1);
    });

    expect(result.current.state.checkIns).toHaveLength(1);
    const initialPoints = result.current.state.companion.points;
    expect(initialPoints).toBe(10); // CHECK_IN_POINTS = 10

    const checkIn2: CheckIn = {
      id: "ci-2",
      date: "2026-10-03",
      answers: { energy: 4 },
      notToday: false,
      createdAt: "2026-10-03T14:00:00.000Z",
    };

    act(() => {
      result.current.actions.addCheckIn(checkIn2);
    });

    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.companion.points).toBe(initialPoints);
  });

  it("syncCompanion is applied after addMissionLog", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    expect(result.current.state.companion.points).toBe(0);

    const log: MissionLog = {
      id: "ml-test-1",
      date: "2026-10-03",
      missionId: "flamingo-balance",
      status: "completed",
      company: "family",
      confirmedBy: "parent-pin",
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addMissionLog(log);
    });

    expect(result.current.state.missionLogs).toHaveLength(1);
    expect(result.current.state.companion.points).toBe(10); // MISSION_POINTS = 10
    expect(result.current.state.companion.teamStars).toBe(1); // completed with family
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
      text: "Boiled rice with chicken",
      createdAt: "2026-10-03T12:00:00.000Z",
    };

    act(() => {
      result.current.actions.addFoodEntry(food);
    });

    expect(result.current.state.foodEntries).toHaveLength(1);
    expect(result.current.state.foodEntries[0]).toEqual(food);
  });

  it("appends consultation with addConsultation", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const consultation: Consultation = {
      id: "c-1",
      date: "2026-10-03",
    };

    act(() => {
      result.current.actions.addConsultation(consultation);
    });

    expect(result.current.state.consultations).toHaveLength(1);
    expect(result.current.state.consultations[0]).toEqual(consultation);
  });

  it("removes consultation with removeConsultation", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const consultation: Consultation = {
      id: "c-1",
      date: "2026-10-03",
    };

    act(() => {
      result.current.actions.addConsultation(consultation);
    });
    expect(result.current.state.consultations).toHaveLength(1);

    act(() => {
      result.current.actions.removeConsultation("c-1");
    });
    expect(result.current.state.consultations).toHaveLength(0);
  });

  it("enforces equip rules: not owned items cannot be equipped, one item per slot, and unequipItem removes it", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    // 1. Not owned item cannot be equipped:
    act(() => {
      result.current.actions.equipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).toEqual([]);

    // 2. Complete two missions to earn 30 points (enough for hatExplorer which costs 20):
    act(() => {
      result.current.actions.addMissionLog({
        id: "ml-1",
        date: "2026-10-02",
        missionId: "bed-stretch",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-02T10:00:00.000Z",
      });
      result.current.actions.addMissionLog({
        id: "ml-2",
        date: "2026-10-03",
        missionId: "bed-stretch",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-03T10:00:00.000Z",
      });
    });

    expect(result.current.state.companion.points).toBe(20);
    expect(result.current.state.companion.ownedItemIds).toContain(ITEM_IDS.hatExplorer);
    expect(result.current.state.companion.ownedItemIds).not.toContain(ITEM_IDS.capeStar);

    // 3. Equipping owned item succeeds:
    act(() => {
      result.current.actions.equipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).toEqual([ITEM_IDS.hatExplorer]);

    // 4. Trying to equip an item that is still not owned (capeStar) fails and keeps current equipped items:
    act(() => {
      result.current.actions.equipItem(ITEM_IDS.capeStar);
    });
    expect(result.current.state.companion.equippedItemIds).toEqual([ITEM_IDS.hatExplorer]);

    // 5. Equipping same item again does not duplicate in slot:
    act(() => {
      result.current.actions.equipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).toEqual([ITEM_IDS.hatExplorer]);

    // 6. Unequipping removes it:
    act(() => {
      result.current.actions.unequipItem(ITEM_IDS.hatExplorer);
    });
    expect(result.current.state.companion.equippedItemIds).toEqual([]);
  });

  it("loadDemo passes data through syncCompanion and marks isDemo", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    const demoState: AppState = {
      ...createEmptyState(),
      child: { nickname: "Lucas" },
      checkIns: [
        {
          id: "ci-1",
          date: "2026-10-01",
          answers: {},
          notToday: false,
          createdAt: "2026-10-01T10:00:00.000Z",
        },
        {
          id: "ci-2",
          date: "2026-10-02",
          answers: {},
          notToday: false,
          createdAt: "2026-10-02T10:00:00.000Z",
        },
      ],
      companion: {
        name: "Hero",
        points: 0,
        teamStars: 0,
        ownedItemIds: [],
        equippedItemIds: [],
        badgeIds: [],
      },
    };

    act(() => {
      result.current.actions.loadDemo(demoState);
    });

    expect(result.current.state.isDemo).toBe(true);
    expect(result.current.state.companion.points).toBe(20);
    expect(result.current.state.companion.ownedItemIds).toContain(ITEM_IDS.hatExplorer);
  });

  it("importState replaces the whole state, keeps isDemo and saves it", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    const imported = createEmptyState();
    imported.child = { nickname: "Imported" };
    imported.checkIns = [
      {
        id: "c1",
        date: "2026-10-01",
        answers: {},
        notToday: true,
        createdAt: "2026-10-01T17:00:00.000Z",
      },
    ];

    act(() => {
      result.current.actions.importState(imported);
    });

    expect(result.current.state.child?.nickname).toBe("Imported");
    expect(result.current.state.checkIns).toHaveLength(1);
    expect(result.current.state.isDemo).toBe(false);
    expect(result.current.state.companion.points).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}").child.nickname).toBe("Imported");
  });

  it("clearAll removes both keys and resets state", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });

    act(() => {
      result.current.actions.setChild({ nickname: "Lucas" });
    });
    localStorage.setItem(BACKUP_STORAGE_KEY, "corrupt-backup-data");

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.actions.clearAll();
    });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toBeNull();
    expect(result.current.state.child).toBeNull();
    expect(result.current.state.checkIns).toEqual([]);
  });

  it("economy actions return the result and persist", () => {
    const { result } = renderHook(() => useAppState(), { wrapper });
    act(() => {
      result.current.actions.importState({
        ...result.current.state,
        economy: {
          ...result.current.state.economy,
          coinsSpent: INITIAL_COINS,
        },
      });
    });
    let bought: ReturnType<typeof result.current.actions.buyShopItem> | undefined;
    act(() => {
      bought = result.current.actions.buyShopItem("food");
    });
    expect(bought).toEqual({ ok: false, reason: "not-enough-coins" });
    expect(result.current.state.economy.coinsSpent).toBe(INITIAL_COINS);

    act(() => {
      result.current.actions.addMissionLog({
        id: "m1",
        date: "2026-10-03",
        missionId: "dragon-breathing",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-03T10:00:00.000Z",
      });
    });
    act(() => {
      bought = result.current.actions.buyShopItem("food");
    });
    expect(bought?.ok).toBe(true);
    act(() => {
      result.current.actions.giveFood();
    });
    expect(result.current.state.economy.fire).toBe(10);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    expect(saved.economy.fire).toBe(10);
  });
});
