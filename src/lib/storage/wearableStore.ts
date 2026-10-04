import { z } from "zod";
import type { DeviceSelection, WearableDevice, WearableState } from "@/types/wearable";
import type { WearableSample } from "@/lib/wearables/types";

export const WEARABLE_STORAGE_KEY = "crohncare_wearable_daily";

const wearableDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().nullable(),
  restingHr: z.number().nullable(),
  restingHrSource: z
    .enum(["night-samples", "wearable-daily"])
    .nullable()
    .optional()
    .catch(undefined),
  restingHrMethod: z
    .enum(["dense-30min", "sparse-3-readings"])
    .nullable()
    .optional()
    .catch(undefined),
  restingHrGapMin: z.number().nullable().optional().catch(undefined),
  sleepMinutes: z.number().nullable(),
  nightComplete: z.boolean(),
  dayComplete: z.boolean(),
});

const deviceMetricSchema = z.enum(["steps", "heartRate", "sleep"]);

const wearableDeviceSchema = z.object({
  id: z.string(),
  kind: z.enum(["wearable", "phone", "other"]),
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

const wearableSampleSchema = z.object({
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
  isMainSleep: z.boolean().optional().catch(undefined),
  source: z.string(),
});

/**
 * Anything that does not fit the current shape is dropped instead of failing the whole state:
 * the old `devices: string[]` and `selectedDevice` are ignored, and raw samples that cannot be
 * matched to a device list (old format) are dropped so the parent syncs again.
 */
export const wearableStateSchema = z
  .object({
    days: z.array(wearableDaySchema),
    lastSyncAt: z.string().nullable(),
    isDemo: z.boolean(),
    devices: z.array(wearableDeviceSchema).optional().catch(undefined),
    deviceSelection: deviceSelectionSchema.optional().catch(undefined),
    rawSamples: z.array(wearableSampleSchema).optional().catch(undefined),
  })
  .transform((state): WearableState => {
    const { devices, deviceSelection, rawSamples, ...rest } = state;
    const result: WearableState = { ...rest };
    if (devices !== undefined) result.devices = devices;
    if (deviceSelection !== undefined) result.deviceSelection = deviceSelection;
    if (rawSamples !== undefined && devices !== undefined) result.rawSamples = rawSamples;
    return result;
  });

export function createEmptyWearableState(): WearableState {
  return {
    days: [],
    lastSyncAt: null,
    isDemo: false,
    devices: [],
    deviceSelection: { steps: null, heartRate: null, sleep: null },
  };
}

export function loadWearableState(): WearableState {
  try {
    const raw = window.localStorage.getItem(WEARABLE_STORAGE_KEY);
    if (!raw) return createEmptyWearableState();
    const parsed = wearableStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyWearableState();
  } catch {
    return createEmptyWearableState();
  }
}

export function saveWearableState(state: WearableState): void {
  try {
    window.localStorage.setItem(WEARABLE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // If storage is full due to rawSamples, strip them and persist the core state
    try {
      const withoutRaw = { ...state };
      delete withoutRaw.rawSamples;
      window.localStorage.setItem(WEARABLE_STORAGE_KEY, JSON.stringify(withoutRaw));
    } catch {
      // storage full or blocked: the wearable card simply shows no data
    }
  }
}

/** Merge by date; incoming days win. Keeps the last 90 days. */
export function mergeWearableDays(
  existing: WearableState,
  incoming: WearableState["days"],
  options: {
    isDemo: boolean;
    devices?: WearableDevice[];
    deviceSelection?: DeviceSelection;
    rawSamples?: WearableSample[];
  },
): WearableState {
  const byDate = new Map(existing.days.map((d) => [d.date, d]));
  for (const day of incoming) byDate.set(day.date, day);
  const days = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-90);
  const result: WearableState = {
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

export function clearWearableState(): void {
  try {
    window.localStorage.removeItem(WEARABLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
