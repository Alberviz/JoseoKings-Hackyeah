"use client";

import { useMemo, useSyncExternalStore } from "react";
import { QUESTION_IDS } from "@/config/content-ids";
import { useParentAlert } from "@/hooks/useParentAlert";
import { addDays, todayKey } from "@/lib/dates";
import { getDayStatuses, shouldAlertParent } from "@/lib/patterns";
import {
  createEmptyWatchState,
  WATCH_STORAGE_KEY,
  watchStateSchema,
} from "@/lib/storage/watchStore";
import type { AppState } from "@/types";
import type { WatchState } from "@/types/watch";
import { WatchStatusCard } from "../WatchStatusCard/WatchStatusCard";

const STRIP_DAYS = 7;

type WatchSummaryProps = {
  state: AppState;
};

function subscribe(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("focus", onChange);
  };
}

function readRawWatch(): string | null {
  try {
    return window.localStorage.getItem(WATCH_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseWatch(raw: string | null): WatchState {
  if (!raw) return createEmptyWatchState();
  try {
    const parsed = watchStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyWatchState();
  } catch {
    return createEmptyWatchState();
  }
}

/** Reads the watch data from this device and shows one light status per day for the parent. */
export function WatchSummary({ state }: WatchSummaryProps) {
  const raw = useSyncExternalStore(subscribe, readRawWatch, () => null);
  const watch = useMemo(() => parseWatch(raw), [raw]);

  const statuses = useMemo(() => {
    const to = todayKey();
    return getDayStatuses(watch.days, { from: addDays(to, -(STRIP_DAYS - 1)), to });
  }, [watch]);

  const alert = useMemo(() => {
    const today = todayKey();
    const checkIn = state.checkIns.find((item) => item.date === today);
    const belly = checkIn && !checkIn.notToday ? checkIn.answers[QUESTION_IDS.bellyComfort] : null;
    return shouldAlertParent(watch.days, {
      bellyComfort: typeof belly === "number" ? belly : null,
    });
  }, [state.checkIns, watch]);

  const { available, permission, requestPermission } = useParentAlert(alert, watch.lastSyncAt);

  return (
    <WatchStatusCard
      statuses={statuses}
      isDemo={watch.isDemo}
      alertReason={alert.alert ? alert.reason : ""}
      alertsAvailable={available}
      alertsPermission={permission}
      onEnableAlerts={requestPermission}
    />
  );
}
