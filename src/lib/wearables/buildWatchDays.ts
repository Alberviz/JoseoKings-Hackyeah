import type { DeviceSelection, WatchDay } from "@/types/watch";
import { computeDailyMetrics, DEFAULT_TIMEZONE } from "./daily";
import type { WatchSample } from "./types";

/**
 * Keeps, for each metric, only the samples of the device chosen for that metric. Steps are never
 * summed across devices. Daily resting heart rate follows the heart-rate device. A metric with no
 * chosen device (null or missing) is left unfiltered.
 */
export function filterSamplesByDeviceSelection(
  samples: WatchSample[],
  deviceIds: Partial<DeviceSelection> = {},
): WatchSample[] {
  return samples.filter((s) => {
    switch (s.metric) {
      case "steps":
        return !deviceIds.steps || s.source === deviceIds.steps;
      case "heartRate":
      case "restingHrDaily":
        return !deviceIds.heartRate || s.source === deviceIds.heartRate;
      case "sleepSession":
      case "sleepSegment":
        return !deviceIds.sleep || s.source === deviceIds.sleep;
      default:
        return true;
    }
  });
}

/**
 * Raw watch samples -> one WatchDay per local day. Days before `fromDate` (YYYY-MM-DD) are dropped.
 * `deviceIds` are the resolved device ids per metric (see resolveDeviceSelection).
 * A missing value stays null; the two "complete" flags say whether the day or the night can be trusted.
 */
export function buildWatchDays(
  samples: WatchSample[],
  options: { timeZone?: string; fromDate?: string; deviceIds?: Partial<DeviceSelection> } = {},
): WatchDay[] {
  const { timeZone = DEFAULT_TIMEZONE, fromDate, deviceIds } = options;
  return computeDailyMetrics(filterSamplesByDeviceSelection(samples, deviceIds), timeZone)
    .filter((m) => !fromDate || m.localDate >= fromDate)
    .map((m) => ({
      date: m.localDate,
      steps: m.steps,
      restingHr: m.restingHr,
      restingHrSource: m.restingHrSource,
      restingHrMethod: m.restingHrMethod,
      restingHrGapMin: m.restingHrGapMin,
      sleepMinutes: m.sleepMinutes,
      nightComplete: m.validSleep,
      dayComplete: m.validActivity,
    }));
}
