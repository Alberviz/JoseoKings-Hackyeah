"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { clearStorage, createEmptyState, loadState, saveState } from "@/lib/storage";
import {
  buyItem,
  equipItem as equipEconomyItem,
  giveFood,
  claimReward as claimEconomyReward,
  markClaimDone as markEconomyClaimDone,
  setSpecialRewards as setEconomySpecialRewards,
  unequipItem as unequipEconomyItem,
  type BuyResult,
  type GiveFoodResult,
  type ClaimResult,
  type SetSpecialRewardsResult,
} from "@/lib/economy";
import { todayKey } from "@/lib/dates";
import {
  equipItem as equipCompanionItem,
  syncCompanion,
  unequipItem as unequipCompanionItem,
} from "@/lib/rewards";
import type {
  AppState,
  CheckIn,
  ChildProfile,
  Consultation,
  FoodEntry,
  MissionLog,
  ParentLog,
  ParentSettings,
  SpecialReward,
} from "@/types";

export type AppStateActions = {
  addCheckIn: (checkIn: CheckIn) => void;
  addMissionLog: (log: MissionLog) => void;
  saveParentLog: (log: ParentLog) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  addConsultation: (consultation: Consultation) => void;
  removeConsultation: (id: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  /** Spends coins in the shop. The result tells the UI what to say. */
  buyShopItem: (itemId: string) => BuyResult;
  giveFood: () => GiveFoodResult;
  equipShopItem: (itemId: string) => void;
  unequipShopItem: (itemId: string) => void;
  /** The only action that lowers fire: the child chooses to spend it on a special reward. */
  claimReward: (rewardId: string) => ClaimResult;
  /** A parent confirms the reward was given. Fire does not change. */
  markClaimDone: (claimId: string) => void;
  setSpecialRewards: (rewards: SpecialReward[]) => SetSpecialRewardsResult;
  setSettings: (settings: ParentSettings) => void;
  setChild: (child: ChildProfile) => void;
  loadDemo: (demoState: AppState) => void;
  /** Replaces the whole state with an imported backup (already validated). Keeps its isDemo flag. */
  importState: (imported: AppState) => void;
  clearAll: () => void;
};

export type AppStateContextValue = {
  state: AppState;
  actions: AppStateActions;
  isReady: boolean;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type StoreSnapshot = {
  state: AppState;
  isReady: boolean;
};

const initialServerSnapshot: StoreSnapshot = {
  state: createEmptyState(),
  isReady: false,
};

function createAppStateStore() {
  let snapshot: StoreSnapshot = initialServerSnapshot;
  const listeners = new Set<() => void>();

  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  return {
    getSnapshot: (): StoreSnapshot => snapshot,
    getServerSnapshot: (): StoreSnapshot => initialServerSnapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    load: () => {
      if (snapshot.isReady) {
        return;
      }
      const loaded = loadState();
      snapshot = {
        state: loaded,
        isReady: true,
      };
      notify();
    },
    updateState: (updater: (prev: AppState) => AppState) => {
      const nextState = updater(snapshot.state);
      snapshot = {
        state: nextState,
        isReady: snapshot.isReady,
      };
      if (snapshot.isReady) {
        saveState(nextState);
      }
      notify();
    },
    loadDemo: (demoState: AppState) => {
      const companion = syncCompanion({
        checkIns: demoState.checkIns,
        missionLogs: demoState.missionLogs,
        companion: demoState.companion,
      });
      const nextState: AppState = {
        ...demoState,
        isDemo: true,
        companion,
      };
      snapshot = {
        state: nextState,
        isReady: true,
      };
      saveState(nextState);
      notify();
    },
    importState: (imported: AppState) => {
      const nextState: AppState = {
        ...imported,
        companion: syncCompanion({
          checkIns: imported.checkIns,
          missionLogs: imported.missionLogs,
          companion: imported.companion,
        }),
      };
      snapshot = { state: nextState, isReady: true };
      saveState(nextState);
      notify();
    },
    clearAll: () => {
      clearStorage();
      snapshot = {
        state: createEmptyState(),
        isReady: true,
      };
      notify();
    },
  };
}

type AppStateProviderProps = {
  children: ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [store] = useState(() => createAppStateStore());

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  useEffect(() => {
    store.load();
  }, [store]);

  const addCheckIn = useCallback(
    (checkIn: CheckIn) => {
      store.updateState((prev) => {
        const existingIndex = prev.checkIns.findIndex((c) => c.date === checkIn.date);
        const nextCheckIns =
          existingIndex >= 0
            ? prev.checkIns.map((c, i) => (i === existingIndex ? { ...checkIn, id: c.id } : c))
            : [...prev.checkIns, checkIn];

        const nextCompanion = syncCompanion({
          checkIns: nextCheckIns,
          missionLogs: prev.missionLogs,
          companion: prev.companion,
        });

        return {
          ...prev,
          checkIns: nextCheckIns,
          companion: nextCompanion,
        };
      });
    },
    [store],
  );

  const addMissionLog = useCallback(
    (log: MissionLog) => {
      store.updateState((prev) => {
        const nextMissionLogs = [...prev.missionLogs, log];
        const nextCompanion = syncCompanion({
          checkIns: prev.checkIns,
          missionLogs: nextMissionLogs,
          companion: prev.companion,
        });

        return {
          ...prev,
          missionLogs: nextMissionLogs,
          companion: nextCompanion,
        };
      });
    },
    [store],
  );

  const saveParentLog = useCallback(
    (log: ParentLog) => {
      store.updateState((prev) => {
        const existingIndex = prev.parentLogs.findIndex((p) => p.date === log.date);
        const nextLogs =
          existingIndex >= 0
            ? prev.parentLogs.map((p, i) => (i === existingIndex ? log : p))
            : [...prev.parentLogs, log];

        return {
          ...prev,
          parentLogs: nextLogs,
        };
      });
    },
    [store],
  );

  const addFoodEntry = useCallback(
    (entry: FoodEntry) => {
      store.updateState((prev) => ({
        ...prev,
        foodEntries: [...prev.foodEntries, entry],
      }));
    },
    [store],
  );

  const addConsultation = useCallback(
    (consultation: Consultation) => {
      store.updateState((prev) => ({
        ...prev,
        consultations: [...prev.consultations, consultation],
      }));
    },
    [store],
  );

  const removeConsultation = useCallback(
    (id: string) => {
      store.updateState((prev) => ({
        ...prev,
        consultations: prev.consultations.filter((c) => c.id !== id),
      }));
    },
    [store],
  );

  const equipItem = useCallback(
    (itemId: string) => {
      store.updateState((prev) => ({
        ...prev,
        companion: equipCompanionItem(prev.companion, itemId),
      }));
    },
    [store],
  );

  const unequipItem = useCallback(
    (itemId: string) => {
      store.updateState((prev) => ({
        ...prev,
        companion: unequipCompanionItem(prev.companion, itemId),
      }));
    },
    [store],
  );

  const buyShopItem = useCallback(
    (itemId: string): BuyResult => {
      let result: BuyResult = { ok: false, reason: "unknown-item" };
      store.updateState((prev) => {
        result = buyItem(prev, itemId);
        return result.ok ? { ...prev, economy: result.economy } : prev;
      });
      return result;
    },
    [store],
  );

  const giveFoodToCompanion = useCallback((): GiveFoodResult => {
    let result: GiveFoodResult = { ok: false, reason: "no-food" };
    store.updateState((prev) => {
      result = giveFood(prev.economy);
      return result.ok ? { ...prev, economy: result.economy } : prev;
    });
    return result;
  }, [store]);

  const equipShopItem = useCallback(
    (itemId: string) => {
      store.updateState((prev) => ({ ...prev, economy: equipEconomyItem(prev.economy, itemId) }));
    },
    [store],
  );

  const unequipShopItem = useCallback(
    (itemId: string) => {
      store.updateState((prev) => ({ ...prev, economy: unequipEconomyItem(prev.economy, itemId) }));
    },
    [store],
  );

  const claimReward = useCallback(
    (rewardId: string): ClaimResult => {
      let result: ClaimResult = { ok: false, reason: "unknown-reward" };
      store.updateState((prev) => {
        result = claimEconomyReward(prev.economy, rewardId, todayKey());
        return result.ok ? { ...prev, economy: result.economy } : prev;
      });
      return result;
    },
    [store],
  );

  const markClaimDone = useCallback(
    (claimId: string) => {
      store.updateState((prev) => ({
        ...prev,
        economy: markEconomyClaimDone(prev.economy, claimId, todayKey()),
      }));
    },
    [store],
  );

  const setSpecialRewards = useCallback(
    (rewards: SpecialReward[]): SetSpecialRewardsResult => {
      let result: SetSpecialRewardsResult = { ok: false, reason: "invalid-name" };
      store.updateState((prev) => {
        result = setEconomySpecialRewards(prev.economy, rewards);
        return result.ok ? { ...prev, economy: result.economy } : prev;
      });
      return result;
    },
    [store],
  );

  const setSettings = useCallback(
    (settings: ParentSettings) => {
      store.updateState((prev) => ({
        ...prev,
        settings,
      }));
    },
    [store],
  );

  const setChild = useCallback(
    (child: ChildProfile) => {
      store.updateState((prev) => ({
        ...prev,
        child,
      }));
    },
    [store],
  );

  const loadDemo = useCallback(
    (demoState: AppState) => {
      store.loadDemo(demoState);
    },
    [store],
  );

  const importState = useCallback(
    (imported: AppState) => {
      store.importState(imported);
    },
    [store],
  );

  const clearAll = useCallback(() => {
    store.clearAll();
  }, [store]);

  const actions = useMemo<AppStateActions>(
    () => ({
      addCheckIn,
      addMissionLog,
      saveParentLog,
      addFoodEntry,
      addConsultation,
      removeConsultation,
      equipItem,
      unequipItem,
      buyShopItem,
      giveFood: giveFoodToCompanion,
      equipShopItem,
      unequipShopItem,
      claimReward,
      markClaimDone,
      setSpecialRewards,
      setSettings,
      setChild,
      loadDemo,
      importState,
      clearAll,
    }),
    [
      buyShopItem,
      giveFoodToCompanion,
      equipShopItem,
      unequipShopItem,
      claimReward,
      markClaimDone,
      setSpecialRewards,
      addCheckIn,
      addMissionLog,
      saveParentLog,
      addFoodEntry,
      addConsultation,
      removeConsultation,
      equipItem,
      unequipItem,
      setSettings,
      setChild,
      loadDemo,
      importState,
      clearAll,
    ],
  );

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      state: snapshot.state,
      actions,
      isReady: snapshot.isReady,
    }),
    [snapshot.state, snapshot.isReady, actions],
  );

  return <AppStateContext.Provider value={contextValue}>{children}</AppStateContext.Provider>;
}

export function useAppStateContext(): AppStateContextValue {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
