"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { STORAGE_KEY, createEmptyState, loadState, saveState } from "@/lib/storage";
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

export type AppStateActions = {
  addCheckIn: (checkIn: CheckIn) => void;
  addMissionLog: (log: MissionLog) => void;
  saveParentLog: (log: ParentLog) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  addConsultation: (consultation: Consultation) => void;
  equipItem: (itemId: string) => void;
  setSettings: (settings: ParentSettings) => void;
  setChild: (child: ChildProfile) => void;
  loadDemo: (demoState: AppState) => void;
  clearAll: () => void;
};

export type AppStateContextValue = {
  state: AppState;
  actions: AppStateActions;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = {
  children: ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, setState] = useState<AppState>(() => loadState());

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  const addCheckIn = useCallback(
    (checkIn: CheckIn) => {
      updateState((prev) => {
        const existingIndex = prev.checkIns.findIndex((c) => c.id === checkIn.id);
        const nextCheckIns =
          existingIndex >= 0
            ? prev.checkIns.map((c, i) => (i === existingIndex ? checkIn : c))
            : [...prev.checkIns, checkIn];

        return {
          ...prev,
          checkIns: nextCheckIns,
        };
      });
    },
    [updateState],
  );

  const addMissionLog = useCallback(
    (log: MissionLog) => {
      updateState((prev) => ({
        ...prev,
        missionLogs: [...prev.missionLogs, log],
      }));
    },
    [updateState],
  );

  const saveParentLog = useCallback(
    (log: ParentLog) => {
      updateState((prev) => {
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
    [updateState],
  );

  const addFoodEntry = useCallback(
    (entry: FoodEntry) => {
      updateState((prev) => ({
        ...prev,
        foodEntries: [...prev.foodEntries, entry],
      }));
    },
    [updateState],
  );

  const addConsultation = useCallback(
    (consultation: Consultation) => {
      updateState((prev) => ({
        ...prev,
        consultations: [...prev.consultations, consultation],
      }));
    },
    [updateState],
  );

  const equipItem = useCallback(
    (itemId: string) => {
      updateState((prev) => {
        const isEquipped = prev.companion.equippedItemIds.includes(itemId);
        const nextEquipped = isEquipped
          ? prev.companion.equippedItemIds.filter((id) => id !== itemId)
          : [...prev.companion.equippedItemIds, itemId];

        return {
          ...prev,
          companion: {
            ...prev.companion,
            equippedItemIds: nextEquipped,
          },
        };
      });
    },
    [updateState],
  );

  const setSettings = useCallback(
    (settings: ParentSettings) => {
      updateState((prev) => ({
        ...prev,
        settings,
      }));
    },
    [updateState],
  );

  const setChild = useCallback(
    (child: ChildProfile) => {
      updateState((prev) => ({
        ...prev,
        child,
      }));
    },
    [updateState],
  );

  const loadDemo = useCallback((demoState: AppState) => {
    const stateToLoad: AppState = {
      ...demoState,
      isDemo: true,
    };
    saveState(stateToLoad);
    setState(stateToLoad);
  }, []);

  const clearAll = useCallback(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setState(createEmptyState());
  }, []);

  const actions = useMemo<AppStateActions>(
    () => ({
      addCheckIn,
      addMissionLog,
      saveParentLog,
      addFoodEntry,
      addConsultation,
      equipItem,
      setSettings,
      setChild,
      loadDemo,
      clearAll,
    }),
    [
      addCheckIn,
      addMissionLog,
      saveParentLog,
      addFoodEntry,
      addConsultation,
      equipItem,
      setSettings,
      setChild,
      loadDemo,
      clearAll,
    ],
  );

  const contextValue = useMemo<AppStateContextValue>(
    () => ({
      state,
      actions,
    }),
    [state, actions],
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
