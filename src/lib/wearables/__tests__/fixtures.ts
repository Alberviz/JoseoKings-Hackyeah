// Realistic Google Health API v4 payloads. int64 numbers arrive as strings, as in the real API.
import type { HealthDataPoint } from "../googleHealthV4";

export const WATCH_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: {
    formFactor: "WATCH",
    manufacturer: "Fitbit",
    model: "Charge 6",
    uid: "watch-uid-1",
  },
  application: { packageName: "com.fitbit.FitbitMobile", name: "Fitbit" },
  platform: "FITBIT",
};

export const PHONE_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: { formFactor: "PHONE", manufacturer: "Google", model: "Pixel 8" },
  application: { packageName: "com.google.android.apps.fitness", name: "Fitness" },
  platform: "GOOGLE_WEB_API",
};

export const stepsWatch = (start: string, end: string, count: string): HealthDataPoint => ({
  steps: {
    interval: { startTime: start, endTime: end, civilStartTime: {}, civilEndTime: {} },
    count,
  },
  dataSource: WATCH_SOURCE,
});

export const stepsPhone = (start: string, end: string, count: string): HealthDataPoint => ({
  steps: { interval: { startTime: start, endTime: end }, count },
  dataSource: PHONE_SOURCE,
});

export const heartRateWatch = (at: string, bpm: string): HealthDataPoint => ({
  heartRate: {
    sampleTime: { physicalTime: at, utcOffset: "3600s", civilTime: {} },
    beatsPerMinute: bpm,
  },
  dataSource: WATCH_SOURCE,
});

export const sleepWatch = (
  start: string,
  end: string,
  minutesAsleep: string,
  nap: boolean,
): HealthDataPoint => ({
  sleep: {
    interval: { startTime: start, endTime: end, civilStartTime: {}, civilEndTime: {} },
    type: "CLASSIC",
    summary: { minutesAsleep, minutesAwake: "20" },
    metadata: { nap, mainSleep: !nap },
  },
  dataSource: WATCH_SOURCE,
});

export const restingDailyString = (date: string, bpm: string): HealthDataPoint => ({
  dailyRestingHeartRate: { date, beatsPerMinute: bpm },
  dataSource: WATCH_SOURCE,
});

export const restingDailyObject = (
  year: number,
  month: number,
  day: number,
  bpm: string,
): HealthDataPoint => ({
  dailyRestingHeartRate: { date: { year, month, day }, beatsPerMinute: bpm },
  dataSource: WATCH_SOURCE,
});
