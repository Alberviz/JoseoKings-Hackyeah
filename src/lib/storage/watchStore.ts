import { z } from "zod";
import type { DeviceSelection, WatchDevice, WatchState } from "@/types/watch";
import type { WatchSample } from "@/lib/wearables/types";

export const WATCH_STORAGE_KEY = "crohncare_watch_daily";

const watchDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().nullable(),
  restingHr: z.number().nullable(),
  restingHrSource: z.enum(["night-samples", "watch-daily"]).nullable().optional().catch(undefined),
  sleepMinutes: z.number().nullable(),
  nightComplete: z.boolean(),
  dayComplete: z.boolean(),
});

const deviceMetricSchema = z.enum(["steps", "heartRate", "sleep"]);

const watchDeviceSchema = z.object({
  id: z.string(),
  kind: z.enum(["watch", "phone", "other"]),
  label: z.string(),
  metrics: z.array(deviceMetricSchema),
  sampleCounts: z.partialRecord(deviceMetricSchema, z.number()).optional().catch(undefined),
});

const selectedIdSchema = z.string().nullable().catch(null);

const deviceSelectionSchema = z.object({
  steps: selectedIdSchema.default(null),
  heartRate: selectedIdSchema.default(null),
  sleep: selectedIdSchema.default(null),
});

const watchSampleSchema = z.object({
  metric: z.enum([
    "steps",
    "heartRate",
    "restingHrDaily",
    "activeMinutes",
    "calories",
    "distance",
    "spo2",
    "sleepSession",
    "sleepSegment",
  ]),
  startAt: z.string(),
  endAt: z.string(),
  value: z.number(),
  valueMax: z.number().nullable().optional(),
  valueMin: z.number().nullable().optional(),
  stage: z.string().nullable().optional(),
  source: z.string(),
});

/**
 * Anything that does not fit the current shape is dropped instead of failing the whole state:
 * the old `devices: string[]` and `selectedDevice` are ignored, and raw samples that cannot be
 * matched to a device list (old format) are dropped so the parent syncs again.
 */
export const watchStateSchema = z
  .object({
    days: z.array(watchDaySchema),
    lastSyncAt: z.string().nullable(),
    isDemo: z.boolean(),
    devices: z.array(watchDeviceSchema).optional().catch(undefined),
    deviceSelection: deviceSelectionSchema.optional().catch(undefined),
    rawSamples: z.array(watchSampleSchema).optional().catch(undefined),
  })
  .transform((state): WatchState => {
    const { devices, deviceSelection, rawSamples, ...rest } = state;
    const result: WatchState = { ...rest };
    if (devices !== undefined) result.devices = devices;
    if (deviceSelection !== undefined) result.deviceSelection = deviceSelection;
    if (rawSamples !== undefined && devices !== undefined) result.rawSamples = rawSamples;
    return result;
  });

export function createEmptyWatchState(): WatchState {
  return {
    days: [],
    lastSyncAt: null,
    isDemo: false,
    devices: [],
    deviceSelection: { steps: null, heartRate: null, sleep: null },
  };
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
    devices?: WatchDevice[];
    deviceSelection?: DeviceSelection;
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
  const deviceSelection = options.deviceSelection ?? existing.deviceSelection;
  if (deviceSelection !== undefined) result.deviceSelection = deviceSelection;
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
