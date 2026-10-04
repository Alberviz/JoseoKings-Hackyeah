import type { WearableSample } from "@/lib/wearables/types";

/** Where a day's resting heart rate came from. */
export type RestingHrSource = "night-samples" | "wearable-daily";

/** How a night's resting heart rate was computed from the night readings. */
export type RestingHrMethod = "dense-30min" | "sparse-3-readings";

export type WearableDay = {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  steps: number | null;
  /** Resting heart rate, beats per minute (see restingHrSource for how it was obtained). */
  restingHr: number | null;
  /** "night-samples": computed here from night readings. "wearable-daily": the value the wearable reported. */
  restingHrSource?: RestingHrSource | null;
  /** "dense-30min": lowest 30-minute mean. "sparse-3-readings": lowest mean of 3 readings in a row. Missing on older saved data. */
  restingHrMethod?: RestingHrMethod | null;
  /** Median minutes between the night's heart-rate readings (set with restingHrMethod). */
  restingHrGapMin?: number | null;
  sleepMinutes: number | null;
  /** Enough night data to trust restingHr and sleepMinutes. */
  nightComplete: boolean;
  /** Enough daytime data to trust steps. */
  dayComplete: boolean;
};

/** The three kinds of data a device can supply. Resting heart rate follows "heartRate". */
export type DeviceMetric = "steps" | "heartRate" | "sleep";

export type WearableDeviceKind = "wearable" | "phone" | "other";

/** One device that sent data to Google Health. */
export type WearableDevice = {
  /** Stable id used as WearableSample.source. */
  id: string;
  kind: WearableDeviceKind;
  /** Plain English name, for example "Wearable · Fitbit Charge 6". */
  label: string;
  /** Which kinds of data this device has. */
  metrics: DeviceMetric[];
  /** How many records each metric has, used only to break ties when picking a device. */
  sampleCounts?: Partial<Record<DeviceMetric, number>>;
};

/** One chosen device id per metric. null means automatic. */
export type DeviceSelection = Record<DeviceMetric, string | null>;

export type WearableState = {
  days: WearableDay[];
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncAt: string | null;
  /** True when the days were generated demo data. */
  isDemo: boolean;
  /** Devices discovered in the last sync. */
  devices?: WearableDevice[];
  /** The parent's choice per metric; missing or null means automatic. */
  deviceSelection?: DeviceSelection;
  /** Optional cached raw samples to allow re-filtering by device. */
  rawSamples?: WearableSample[];
};
