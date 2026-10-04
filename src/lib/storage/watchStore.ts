import { z } from "zod";
import type { WatchState } from "@/types/watch";
import { computeDailyMetrics, DEFAULT_TIMEZONE } from "@/lib/wearables/daily";
import type { DailyMetric, WatchSample } from "@/lib/wearables/types";

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
  devices: z.array(z.string()).optional(),
  selectedDevice: z.string().nullable().optional(),
  rawSamples: z.array(z.any()).optional(),
});

export function createEmptyWatchState(): WatchState {
  return { days: [], lastSyncAt: null, isDemo: false, devices: [], selectedDevice: null };
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

export function filterSamplesByDevice(
  samples: WatchSample[],
  selectedDevice?: string | null,
): WatchSample[] {
  if (!selectedDevice) return samples;
  return samples.filter((s) => s.source === selectedDevice);
}

export function computeDailyMetricsForDevice(
  samples: WatchSample[],
  selectedDevice?: string | null,
  timeZone: string = DEFAULT_TIMEZONE,
): DailyMetric[] {
  const filtered = filterSamplesByDevice(samples, selectedDevice);
  return computeDailyMetrics(filtered, timeZone);
}

export function saveWatchState(state: WatchState): void {
  try {
    window.localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // If storage is full due to rawSamples, strip them and persist the core state
    try {
      const withoutRaw = { ...state };
      delete withoutRaw.rawSamples;
      window.localStorage.setItem(WATCH_STORAGE_KEY, JSON.stringify(withoutRaw));
    } catch {
      // storage full or blocked: the watch card simply shows no data
    }
  }
}

/** Merge by date; incoming days win. Keeps the last 90 days. */
export function mergeWatchDays(
  existing: WatchState,
  incoming: WatchState["days"],
  options: {
    isDemo: boolean;
    devices?: string[];
    selectedDevice?: string | null;
    rawSamples?: WatchSample[];
  },
): WatchState {
  const byDate = new Map(existing.days.map((d) => [d.date, d]));
  for (const day of incoming) byDate.set(day.date, day);
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  const result: WatchState = {
    days,
    lastSyncAt: new Date().toISOString(),
    isDemo: options.isDemo,
  };
  const devices = options.devices ?? existing.devices;
  if (devices !== undefined) result.devices = devices;
  const selectedDevice =
    options.selectedDevice !== undefined ? options.selectedDevice : existing.selectedDevice;
  if (selectedDevice !== undefined) result.selectedDevice = selectedDevice;
  const rawSamples = options.rawSamples ?? existing.rawSamples;
  if (rawSamples !== undefined) result.rawSamples = rawSamples;
  return result;
}

export function clearWatchState(): void {
  try {
    window.localStorage.removeItem(WATCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}
