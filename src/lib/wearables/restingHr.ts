// A3 — Nocturnal resting heart rate.
// Lowest 30-minute rolling mean inside the main sleep session.
// Requires >= 120 covered minutes and >= 4 qualifying 30-minute windows.

import { median } from "./stats";

const MINUTE = 60_000;
const WINDOW = 30;
const MIN_MINUTES_IN_WINDOW = 20;
const MIN_COVERED = 120;
const MIN_WINDOWS = 4;

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
    }
  | {
      kind: "insufficient-data";
      have: number;
      need: number;
      nRhr: null;
      coveredMinutes?: number;
      qualifyingWindows?: number;
    };

export function nocturnalRestingHr(
  samples: HeartRateSample[],
  session: SleepSession | null,
): NocturnalRestingHrResult {
  if (!session || !(session.end > session.start)) {
    return { kind: "insufficient-data", have: 0, need: MIN_COVERED, nRhr: null };
  }

  const byMinute = new Map<number, number[]>();
  for (const sample of samples ?? []) {
    if (typeof sample.bpm !== "number" || Number.isNaN(sample.bpm)) continue;
    if (sample.timestamp < session.start || sample.timestamp >= session.end) continue;
    const minute = Math.floor(sample.timestamp / MINUTE);
    const list = byMinute.get(minute);
    if (list) list.push(sample.bpm);
    else byMinute.set(minute, [sample.bpm]);
  }

  const minuteMedian = new Map<number, number>();
  for (const [minute, bpms] of byMinute) {
    const med = median(bpms);
    if (med !== null) minuteMedian.set(minute, med);
  }
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
    nRhr: Math.round(nRhr * 10) / 10,
    nHrMean: innerN > 0 ? Math.round((innerSum / innerN) * 10) / 10 : null,
    coveredMinutes: covered,
    qualifyingWindows: qualifying,
  };
}
