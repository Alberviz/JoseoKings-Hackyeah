// Google Fit data types and constants (response shapes only). No credentials and no client code live here.
import type { WearableMetric } from "./types";

/** Metrics pulled as 1-minute buckets through dataset:aggregate. */
export const MINUTE_METRICS: Partial<Record<WearableMetric, string>> = {
  steps: "com.google.step_count.delta",
  heartRate: "com.google.heart_rate.bpm",
  activeMinutes: "com.google.active_minutes",
  calories: "com.google.calories.expended",
  distance: "com.google.distance.delta",
  spo2: "com.google.oxygen_saturation",
};

export const SLEEP_TYPE = "com.google.sleep.segment";
export const SLEEP_ACTIVITY_TYPE = 72;

export interface GoogleFitBucket {
  startTimeMillis?: string;
  endTimeMillis?: string;
  dataset?: Array<{
    dataSourceId?: string;
    point?: Array<{
      startTimeNanos: string;
      endTimeNanos: string;
      dataTypeName?: string;
      originDataSourceId?: string;
      value?: Array<{
        intVal?: number;
        fpVal?: number;
        stringVal?: string;
        mapVal?: Array<{ key: string; value: { fpVal?: number } }>;
      }>;
    }>;
  }>;
}

export interface GoogleFitSession {
  id?: string;
  name?: string;
  description?: string;
  startTimeMillis: string;
  endTimeMillis: string;
  activityType: number;
  application?: {
    packageName?: string;
    name?: string;
  };
}

export interface SleepSessionResult {
  session: GoogleFitSession;
  points: NonNullable<NonNullable<NonNullable<GoogleFitBucket["dataset"]>[0]>["point"]>;
}
