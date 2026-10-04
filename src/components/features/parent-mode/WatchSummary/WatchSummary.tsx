"use client";

import { useMemo, useSyncExternalStore } from "react";
import { addDays, todayKey } from "@/lib/dates";
import { getDayStatuses } from "@/lib/patterns";
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
  state?: AppState;
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
export function WatchSummary(props: WatchSummaryProps) {
  void props;
  const raw = useSyncExternalStore(subscribe, readRawWatch, () => null);
  const watch = useMemo(() => parseWatch(raw), [raw]);

  const statuses = useMemo(() => {
    const to = todayKey();
    return getDayStatuses(watch.days, { from: addDays(to, -(STRIP_DAYS - 1)), to });
  }, [watch]);

  return <WatchStatusCard statuses={statuses} isDemo={watch.isDemo} />;
}
