// A3 — Nocturnal resting heart rate.
// Dense mode: lowest 30-minute rolling mean inside the main sleep session.
// Requires >= 120 covered minutes and >= 4 qualifying 30-minute windows.
// Sparse mode [adapted 2026-10-04 for 30-min sampling watches]: when the median gap between
// readings inside the session is more than 5 minutes, the value is the lowest mean of 3 readings
// in a row. Requires >= 6 readings that span >= 150 minutes. The mode follows the data, never the device.

import { median } from "./stats";

const MINUTE = 60_000;
const WINDOW = 30;
const MIN_MINUTES_IN_WINDOW = 20;
const MIN_COVERED = 120;
const MIN_WINDOWS = 4;
/** A median gap above this many minutes between readings switches to the sparse method. */
export const SPARSE_GAP_MINUTES = 5;
export const SPARSE_READINGS_IN_ROW = 3;
export const SPARSE_MIN_READINGS = 6;
export const SPARSE_MIN_SPAN_MINUTES = 150;

export type RestingHrMethod = "dense-30min" | "sparse-3-readings";

export type HeartRateSample = {
  timestamp: number;
  bpm: number;
};

export type SleepSession = {
  start: number;
  end: number;
};

export type NocturnalRestingHrResult =
  | {
      kind: "value";
      nRhr: number;
      nHrMean: number | null;
      coveredMinutes: number;
      qualifyingWindows: number;
      method: RestingHrMethod;
      /** Readings used (one per minute) inside the session. */
      sampleCount: number;
      /** Median minutes between readings inside the session; null with fewer than 2 readings. */
      medianGapMin: number | null;
    }
  | {
      kind: "insufficient-data";
      have: number;
      need: number;
      nRhr: null;
      coveredMinutes?: number;
      qualifyingWindows?: number;
      method?: RestingHrMethod;
      sampleCount?: number;
      medianGapMin?: number | null;
    };

export type SleepHeartRateProfile = {
  /** One reading per minute inside the session, in time order. */
  readings: Array<{ minute: number; bpm: number }>;
  /** Median minutes between consecutive readings; null with fewer than 2 readings. */
  medianGapMin: number | null;
  /** Minutes from the first to the last reading. */
  spanMin: number;
  method: RestingHrMethod;
};

/**
 * Heart-rate readings inside a sleep session, one per minute (median when several share a minute),
 * and the method the data allows: a median gap of more than 5 minutes means sparse sampling.
 */
export function sleepHeartRateProfile(
  samples: HeartRateSample[],
  session: SleepSession,
): SleepHeartRateProfile {
  const byMinute = new Map<number, number[]>();
  for (const sample of samples ?? []) {
    if (typeof sample.bpm !== "number" || Number.isNaN(sample.bpm)) continue;
    if (sample.timestamp < session.start || sample.timestamp >= session.end) continue;
    const minute = Math.floor(sample.timestamp / MINUTE);
    const list = byMinute.get(minute);
    if (list) list.push(sample.bpm);
    else byMinute.set(minute, [sample.bpm]);
  }
  const readings: Array<{ minute: number; bpm: number }> = [];
  for (const [minute, bpms] of byMinute) {
    const med = median(bpms);
    if (med !== null) readings.push({ minute, bpm: med });
  }
  readings.sort((a, b) => a.minute - b.minute);

  const gaps: number[] = [];
  for (let i = 1; i < readings.length; i += 1)
    gaps.push(readings[i].minute - readings[i - 1].minute);
  const medianGapMin = median(gaps);
  const spanMin =
    readings.length > 1 ? readings[readings.length - 1].minute - readings[0].minute : 0;
  const method: RestingHrMethod =
    medianGapMin !== null && medianGapMin > SPARSE_GAP_MINUTES
      ? "sparse-3-readings"
      : "dense-30min";
  return { readings, medianGapMin, spanMin, method };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Lowest mean of 3 readings in a row, with the mean of the readings away from both ends of the night. */
function sparseRestingHr(
  profile: SleepHeartRateProfile,
  session: SleepSession,
): NocturnalRestingHrResult {
  const { readings, medianGapMin, spanMin } = profile;
  const base = { method: "sparse-3-readings" as const, sampleCount: readings.length, medianGapMin };
  if (readings.length < SPARSE_MIN_READINGS) {
    return {
      kind: "insufficient-data",
      have: readings.length,
      need: SPARSE_MIN_READINGS,
      nRhr: null,
      coveredMinutes: readings.length,
      ...base,
    };
  }
  if (spanMin < SPARSE_MIN_SPAN_MINUTES) {
    return {
      kind: "insufficient-data",
      have: spanMin,
      need: SPARSE_MIN_SPAN_MINUTES,
      nRhr: null,
      coveredMinutes: readings.length,
      ...base,
    };
  }
  let lowest = Infinity;
  for (let i = 0; i + SPARSE_READINGS_IN_ROW <= readings.length; i += 1) {
    let sum = 0;
    for (let k = 0; k < SPARSE_READINGS_IN_ROW; k += 1) sum += readings[i + k].bpm;
    const mean = sum / SPARSE_READINGS_IN_ROW;
    if (mean < lowest) lowest = mean;
  }
  const innerFirst = Math.ceil((session.start + WINDOW * MINUTE) / MINUTE);
  const innerLast = Math.floor((session.end - WINDOW * MINUTE) / MINUTE);
  const inner = readings.filter((r) => r.minute >= innerFirst && r.minute < innerLast);
  return {
    kind: "value",
    nRhr: round1(lowest),
    nHrMean: inner.length > 0 ? round1(inner.reduce((a, r) => a + r.bpm, 0) / inner.length) : null,
    coveredMinutes: readings.length,
    qualifyingWindows: 0,
    ...base,
  };
}

export function nocturnalRestingHr(
  samples: HeartRateSample[],
  session: SleepSession | null,
): NocturnalRestingHrResult {
  if (!session || !(session.end > session.start)) {
    return { kind: "insufficient-data", have: 0, need: MIN_COVERED, nRhr: null };
  }

  const profile = sleepHeartRateProfile(samples, session);
  if (profile.method === "sparse-3-readings") return sparseRestingHr(profile, session);

  const minuteMedian = new Map<number, number>();
  for (const { minute, bpm } of profile.readings) minuteMedian.set(minute, bpm);
  const covered = minuteMedian.size;

  const firstFull = Math.ceil(session.start / MINUTE);
  const lastFull = Math.floor(session.end / MINUTE);
  let qualifying = 0;
  let nRhr = Infinity;

  for (let start = firstFull; start <= lastFull - WINDOW; start += 1) {
    let sum = 0;
    let n = 0;
    for (let k = 0; k < WINDOW; k += 1) {
      const value = minuteMedian.get(start + k);
      if (value === undefined) continue;
      sum += value;
      n += 1;
    }
    if (n < MIN_MINUTES_IN_WINDOW) continue;
    qualifying += 1;
    const mean = sum / n;
    if (mean < nRhr) nRhr = mean;
  }

  if (covered < MIN_COVERED) {
    return {
      kind: "insufficient-data",
      have: covered,
      need: MIN_COVERED,
      nRhr: null,
      coveredMinutes: covered,
      qualifyingWindows: qualifying,
      method: "dense-30min",
      sampleCount: covered,
      medianGapMin: profile.medianGapMin,
    };
  }
  if (qualifying < MIN_WINDOWS) {
    return {
      kind: "insufficient-data",
      have: qualifying,
      need: MIN_WINDOWS,
      nRhr: null,
      coveredMinutes: covered,
      qualifyingWindows: qualifying,
      method: "dense-30min",
      sampleCount: covered,
      medianGapMin: profile.medianGapMin,
    };
  }

  const innerStart = session.start + WINDOW * MINUTE;
  const innerEnd = session.end - WINDOW * MINUTE;
  const innerFirst = Math.ceil(innerStart / MINUTE);
  const innerLast = Math.floor(innerEnd / MINUTE);
  let innerSum = 0;
  let innerN = 0;
  for (let minute = innerFirst; minute < innerLast; minute += 1) {
    const value = minuteMedian.get(minute);
    if (value === undefined) continue;
    innerSum += value;
    innerN += 1;
  }

  return {
    kind: "value",
    nRhr: round1(nRhr),
    nHrMean: innerN > 0 ? round1(innerSum / innerN) : null,
    coveredMinutes: covered,
    qualifyingWindows: qualifying,
    method: "dense-30min",
    sampleCount: covered,
    medianGapMin: profile.medianGapMin,
  };
}
