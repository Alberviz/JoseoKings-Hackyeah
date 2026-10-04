import type { WatchSample } from "@/lib/wearables/types";

/** Where a day's resting heart rate came from. */
export type RestingHrSource = "night-samples" | "watch-daily";

export type WatchDay = {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  steps: number | null;
  /** Resting heart rate, beats per minute (see restingHrSource for how it was obtained). */
  restingHr: number | null;
  /** "night-samples": computed here from night readings. "watch-daily": the value the watch reported. */
  restingHrSource?: RestingHrSource | null;
  sleepMinutes: number | null;
  /** Enough night data to trust restingHr and sleepMinutes. */
  nightComplete: boolean;
  /** Enough daytime data to trust steps. */
  dayComplete: boolean;
};

/** The three kinds of data a device can supply. Resting heart rate follows "heartRate". */
export type DeviceMetric = "steps" | "heartRate" | "sleep";

export type WatchDeviceKind = "watch" | "phone" | "other";

/** One device that sent data to Google Health. */
export type WatchDevice = {
  /** Stable id used as WatchSample.source. */
  id: string;
  kind: WatchDeviceKind;
  /** Plain English name, for example "Watch · Fitbit Charge 6". */
  label: string;
  /** Which kinds of data this device has. */
  metrics: DeviceMetric[];
  /** How many records each metric has, used only to break ties when picking a device. */
  sampleCounts?: Partial<Record<DeviceMetric, number>>;
};

/** One chosen device id per metric. null means automatic. */
export type DeviceSelection = Record<DeviceMetric, string | null>;

export type WatchState = {
  days: WatchDay[];
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncAt: string | null;
  /** True when the days were generated demo data. */
  isDemo: boolean;
  /** Devices discovered in the last sync. */
  devices?: WatchDevice[];
  /** The parent's choice per metric; missing or null means automatic. */
  deviceSelection?: DeviceSelection;
  /** Optional cached raw samples to allow re-filtering by device. */
  rawSamples?: WatchSample[];
};
