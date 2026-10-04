"use client";

import { useMemo, useSyncExternalStore } from "react";
import { addDays, todayKey } from "@/lib/dates";
import { getDayStatuses } from "@/lib/patterns";
import {
  createEmptyWearableState,
  WEARABLE_STORAGE_KEY,
  wearableStateSchema,
} from "@/lib/storage/wearableStore";
import type { AppState } from "@/types";
import type { WearableState } from "@/types/wearable";
import { WearableStatusCard } from "../WearableStatusCard/WearableStatusCard";

const STRIP_DAYS = 7;

type WearableSummaryProps = {
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

function readRawWearable(): string | null {
  try {
    return window.localStorage.getItem(WEARABLE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseWearable(raw: string | null): WearableState {
  if (!raw) return createEmptyWearableState();
  try {
    const parsed = wearableStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyWearableState();
  } catch {
    return createEmptyWearableState();
  }
}

/** Reads the wearable data from this device and shows one light status per day for the parent. */
export function WearableSummary(props: WearableSummaryProps) {
  void props;
  const raw = useSyncExternalStore(subscribe, readRawWearable, () => null);
  const wearable = useMemo(() => parseWearable(raw), [raw]);

  const statuses = useMemo(() => {
    const to = todayKey();
    return getDayStatuses(wearable.days, { from: addDays(to, -(STRIP_DAYS - 1)), to });
  }, [wearable]);

  return <WearableStatusCard statuses={statuses} isDemo={wearable.isDemo} />;
}
