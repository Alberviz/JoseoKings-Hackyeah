import type { MissionCorroboration } from "@/types";

/** One reading from a wearable. Times are epoch milliseconds. */
export type WearableSample = {
  at: number;
  heartRate?: number | null;
  steps?: number | null;
};

export type CorroborationInput = {
  /** Mission start and end, epoch milliseconds. */
  startMs: number;
  endMs: number;
  wearableSamples?: WearableSample[];
  /** Aggregate variance of the device acceleration magnitude during the mission. */
  motionVariance?: number | null;
};

/** Steps in the window that count as movement. */
export const WEARABLE_MIN_STEPS = 20;
/** Heart rate rise (beats per minute) inside the window that counts as movement. */
export const WEARABLE_MIN_HEART_RATE_RISE = 10;
/** Acceleration variance, in (m/s^2)^2, that counts as movement. */
export const MOTION_MIN_VARIANCE = 0.5;

export const CORROBORATION_LABELS: Record<MissionCorroboration, string> = {
  wearable: "Wearable recorded movement",
  motion: "Device recorded movement",
};

export const corroborationLabel = (value: MissionCorroboration): string =>
  CORROBORATION_LABELS[value];

function wearableRecordedMovement(
  samples: WearableSample[],
  startMs: number,
  endMs: number,
): boolean {
  const inWindow = samples
    .filter((s) => s.at >= startMs && s.at <= endMs)
    .sort((a, b) => a.at - b.at);

  const steps = inWindow.reduce(
    (sum, s) => sum + (typeof s.steps === "number" && s.steps > 0 ? s.steps : 0),
    0,
  );
  if (steps >= WEARABLE_MIN_STEPS) return true;

  const rates = inWindow
    .map((s) => s.heartRate)
    .filter((hr): hr is number => typeof hr === "number" && hr > 0);
  if (rates.length < 2) return false;
  return Math.max(...rates) - rates[0] >= WEARABLE_MIN_HEART_RATE_RISE;
}

/**
 * Says which source recorded movement during a mission, or undefined when none did.
 * Only a positive label exists: no data never reads as "did not move". Wearable wins over the device.
 */
export function corroborateMission(input: CorroborationInput): MissionCorroboration | undefined {
  if (input.endMs < input.startMs) return undefined;
  if (
    input.wearableSamples &&
    wearableRecordedMovement(input.wearableSamples, input.startMs, input.endMs)
  ) {
    return "wearable";
  }
  if (typeof input.motionVariance === "number" && input.motionVariance >= MOTION_MIN_VARIANCE) {
    return "motion";
  }
  return undefined;
}
