import { z } from "zod";
import type { WatchState } from "@/types/watch";

export const WATCH_STORAGE_KEY = "crohncare_watch_daily";

const watchDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().nullable(),
  restingHr: z.number().nullable(),
  sleepMinutes: z.number().nullable(),
  nightComplete: z.boolean(),
  dayComplete: z.boolean(),
});

export const watchStateSchema = z.object({
  days: z.array(watchDaySchema),
  lastSyncAt: z.string().nullable(),
  isDemo: z.boolean(),
});

export function createEmptyWatchState(): WatchState {
  return { days: [], lastSyncAt: null, isDemo: false };
}

export function loadWatchState(): WatchState {
  try {
    const raw = window.localStorage.getItem(WATCH_STORAGE_KEY);
    if (!raw) return createEmptyWatchState();
    const parsed = watchStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyWatchState();
  } catch {
    return createEmptyWatchState();
  }
}

export function saveWatchState(state: WatchState): void {
  try {
    window.localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or blocked: the watch card simply shows no data
  }
}

/** Merge by date; incoming days win. Keeps the last 90 days. */
export function mergeWatchDays(
  existing: WatchState,
  incoming: WatchState["days"],
  options: { isDemo: boolean },
): WatchState {
  const byDate = new Map(existing.days.map((d) => [d.date, d]));
  for (const day of incoming) byDate.set(day.date, day);
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  return { days, lastSyncAt: new Date().toISOString(), isDemo: options.isDemo };
}

export function clearWatchState(): void {
  try {
    window.localStorage.removeItem(WATCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
