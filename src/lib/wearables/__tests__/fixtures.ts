// Realistic Google Health API v4 payloads. int64 numbers arrive as strings, as in the real API.
import type { HealthDataPoint } from "../googleHealthV4";

export const WEARABLE_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: {
    formFactor: "WATCH",
    manufacturer: "Fitbit",
    model: "Charge 6",
    uid: "wearable-uid-1",
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

export const stepsWearable = (start: string, end: string, count: string): HealthDataPoint => ({
  steps: {
    interval: { startTime: start, endTime: end, civilStartTime: {}, civilEndTime: {} },
    count,
  },
  dataSource: WEARABLE_SOURCE,
});

export const stepsPhone = (start: string, end: string, count: string): HealthDataPoint => ({
  steps: { interval: { startTime: start, endTime: end }, count },
  dataSource: PHONE_SOURCE,
});

export const heartRateWearable = (at: string, bpm: string): HealthDataPoint => ({
  heartRate: {
    sampleTime: { physicalTime: at, utcOffset: "3600s", civilTime: {} },
    beatsPerMinute: bpm,
  },
  dataSource: WEARABLE_SOURCE,
});

export const sleepWearable = (
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
  dataSource: WEARABLE_SOURCE,
});

export const restingDailyString = (date: string, bpm: string): HealthDataPoint => ({
  dailyRestingHeartRate: { date, beatsPerMinute: bpm },
  dataSource: WEARABLE_SOURCE,
});

export const restingDailyObject = (
  year: number,
  month: number,
  day: number,
  bpm: string,
): HealthDataPoint => ({
  dailyRestingHeartRate: { date: { year, month, day }, beatsPerMinute: bpm },
  dataSource: WEARABLE_SOURCE,
});

// Shapes seen in a live capture through Health Connect (synthetic values only): the wearable app
// sends empty device objects or only a form factor, and the phone app has a hashed package name.
export const ZEPP_EMPTY_DEVICE_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: {},
  application: { packageName: "com.huami.watch.hmwatchmanager" },
  platform: "HEALTH_CONNECT",
};

export const ZEPP_BAND_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: { formFactor: "FITNESS_BAND" },
  application: { packageName: "com.huami.watch.hmwatchmanager" },
  platform: "HEALTH_CONNECT",
};

export const HC_PHONE_SOURCE: NonNullable<HealthDataPoint["dataSource"]> = {
  recordingMethod: "PASSIVELY_MEASURED",
  device: { formFactor: "PHONE", manufacturer: "Xiaomi" },
  application: { packageName: "com.android.healthconnect.phone.0123abcd" },
  platform: "HEALTH_CONNECT",
};

export const stepsFrom = (
  dataSource: NonNullable<HealthDataPoint["dataSource"]>,
  start: string,
  end: string,
  count: string,
): HealthDataPoint => ({
  steps: { interval: { startTime: start, endTime: end }, count },
  dataSource,
});

/** Heart rate with the civilTime object the real API returns (we only read physicalTime). */
export const heartRateFrom = (
  dataSource: NonNullable<HealthDataPoint["dataSource"]>,
  at: string,
  bpm: string,
): HealthDataPoint => ({
  heartRate: {
    sampleTime: {
      physicalTime: at,
      utcOffset: "7200s",
      civilTime: { date: { year: 2026, month: 9, day: 1 }, time: { hours: 10, minutes: 0 } },
    },
    beatsPerMinute: bpm,
  },
  dataSource,
});

export const sleepFrom = (
  dataSource: NonNullable<HealthDataPoint["dataSource"]>,
  start: string,
  end: string,
  minutesAsleep: string,
): HealthDataPoint => ({
  sleep: {
    interval: { startTime: start, endTime: end },
    type: "CLASSIC",
    summary: { minutesAsleep, minutesAwake: "20" },
    metadata: { nap: false, mainSleep: true },
  },
  dataSource,
});
