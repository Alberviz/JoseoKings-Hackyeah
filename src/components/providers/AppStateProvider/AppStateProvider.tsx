"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clearStorage, createEmptyState, loadState, saveState } from "@/lib/storage";
import {
  equipItem as equipRewardItem,
  syncCompanion,
  unequipItem as unequipRewardItem,
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
} from "@/types";

export type AppStateActions = {
  addCheckIn: (checkIn: CheckIn) => void;
  addMissionLog: (log: MissionLog) => void;
  saveParentLog: (log: ParentLog) => void;
  addFoodEntry: (entry: FoodEntry) => void;
  addConsultation: (consultation: Consultation) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  setSettings: (settings: ParentSettings) => void;
  setChild: (child: ChildProfile) => void;
  loadDemo: (demoState: AppState) => void;
  clearAll: () => void;
};

export type AppStateContextValue = {
  state: AppState;
  actions: AppStateActions;
  isReady: boolean;
};

export const AppStateContext = createContext<AppStateContextValue | null>(null);

type AppStateProviderProps = {
  children: ReactNode;
};

export function AppStateProvider({ children }: AppStateProviderProps) {
  // Start with empty state to prevent SSR/client hydration mismatch
  const [state, setState] = useState<AppState>(createEmptyState);
  const [isReady, setIsReady] = useState(false);
  const isClearingRef = useRef(false);

  // Load from localStorage on client mount
  useEffect(() => {
    let mounted = true;
    Promise.resolve().then(() => {
      if (mounted) {
        setState(loadState());
        setIsReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save to localStorage whenever state changes after initial hydration
  useEffect(() => {
    if (!isReady) return;
    if (isClearingRef.current) {
      isClearingRef.current = false;
      return;
    }
    saveState(state);
  }, [state, isReady]);

  const addCheckIn = useCallback((checkIn: CheckIn) => {
    setState((prev) => {
      // Replace check-in by date to prevent duplicate check-ins on the same day
      const existingIndex = prev.checkIns.findIndex((c) => c.date === checkIn.date);
      const nextCheckIns =
        existingIndex >= 0
          ? prev.checkIns.map((c, i) => (i === existingIndex ? checkIn : c))
          : [...prev.checkIns, checkIn];

      const intermediate = {
        ...prev,
        checkIns: nextCheckIns,
      };

      return {
        ...intermediate,
        companion: syncCompanion(intermediate),
      };
    });
  }, []);

  const addMissionLog = useCallback((log: MissionLog) => {
    setState((prev) => {
      const intermediate = {
        ...prev,
        missionLogs: [...prev.missionLogs, log],
      };

      return {
        ...intermediate,
        companion: syncCompanion(intermediate),
      };
    });
  }, []);

  const saveParentLog = useCallback((log: ParentLog) => {
    setState((prev) => {
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
  }, []);

  const addFoodEntry = useCallback((entry: FoodEntry) => {
    setState((prev) => ({
      ...prev,
      foodEntries: [...prev.foodEntries, entry],
    }));
  }, []);

  const addConsultation = useCallback((consultation: Consultation) => {
    setState((prev) => ({
      ...prev,
      consultations: [...prev.consultations, consultation],
    }));
  }, []);

  const equipItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      companion: equipRewardItem(prev.companion, itemId),
    }));
  }, []);

  const unequipItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      companion: unequipRewardItem(prev.companion, itemId),
    }));
  }, []);

  const setSettings = useCallback((settings: ParentSettings) => {
    setState((prev) => ({
      ...prev,
      settings,
    }));
  }, []);

  const setChild = useCallback((child: ChildProfile) => {
    setState((prev) => ({
      ...prev,
      child,
    }));
  }, []);

  const loadDemo = useCallback((demoState: AppState) => {
    setState({
      ...demoState,
      isDemo: true,
    });
  }, []);

  const clearAll = useCallback(() => {
    isClearingRef.current = true;
    clearStorage();
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
      unequipItem,
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
      unequipItem,
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
      isReady,
    }),
    [state, actions, isReady],
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
