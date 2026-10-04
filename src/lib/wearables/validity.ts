// A0 — Valid-day / wear-time rule.
// A missing sample stays missing. This module only counts coverage; it does not fill it.

import {
  SPARSE_MIN_READINGS,
  SPARSE_MIN_SPAN_MINUTES,
  sleepHeartRateProfile,
  type RestingHrMethod,
} from "./restingHr";
import { addDays } from "./stats";
import type {
  CheckInAnswers,
  CheckInScore,
  DayAssessment,
  HeartRateSample,
  MainSleepSummary,
  SleepSession,
  SleepSessionInput,
} from "./types";

const MINUTE = 60_000;
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

export type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  date: string; // "YYYY-MM-DD"
};

export function localDateTime(ms: number, timeZone: string): LocalDateTimeParts {
  const parts = formatter(timeZone).formatToParts(new Date(ms));
  const bag: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") bag[part.type] = part.value;
  }
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  const year = Number(bag.year);
  const month = Number(bag.month);
  const day = Number(bag.day);
  const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return {
    year,
    month,
    day,
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
    date,
  };
}

/** UTC instant of a local civil time. Used for day length and for the synthetic clock (A0, 3.V). */
export function zonedTimeToUtc(
  date: string,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const [y, m, d] = date.split("-").map(Number);
  let utc = Date.UTC(y, m - 1, d, hour, minute, 0);
  const desired = utc;
  for (let i = 0; i < 4; i += 1) {
    const local = localDateTime(utc, timeZone);
    const asUtc = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );
    const delta = asUtc - desired;
    if (delta === 0) return utc;
    utc -= delta;
  }
  return utc;
}

export function localDayDurationHours(date: string, timeZone: string): number {
  const start = zonedTimeToUtc(date, 0, 0, timeZone);
  const end = zonedTimeToUtc(addDays(date, 1), 0, 0, timeZone);
  return (end - start) / 3_600_000;
}

/** A0: 23 h or 25 h local days. They stay valid for daily totals and carry this flag. */
export function isDstShift(date: string, timeZone: string): boolean {
  const hours = localDayDurationHours(date, timeZone);
  return hours !== 24;
}

export function asCheckInItem(value: unknown): CheckInScore {
  if (value === 0 || value === 1 || value === 2) return value;
  if (value === "notToday") return "notToday";
  return null;
}

/** Distinct local clock hours in [07:00, 23:00) that contain at least one heart-rate sample. */
export function daytimeHourCount(
  samples: Array<{ timestamp: number }> | undefined,
  day: string,
  timeZone: string,
): number {
  const hours = new Set<number>();
  for (const sample of samples ?? []) {
    const local = localDateTime(sample.timestamp, timeZone);
    if (local.date !== day) continue;
    if (local.hour >= 7 && local.hour < 23) {
      hours.add(local.hour);
    }
  }
  return hours.size;
}

export type NightAssessment = {
  nightValid: boolean;
  mainSleep: MainSleepSummary | null;
  /** Heart-rate method the readings inside the main sleep allow; null without a main sleep. */
  hrMethod: RestingHrMethod | null;
  /** Median minutes between heart-rate readings inside the main sleep; null with fewer than 2. */
  hrMedianGapMin: number | null;
};

function sessionDurationMin(session: SleepSessionInput): number {
  return (session.end - session.start) / MINUTE;
}

/**
 * Main sleep session for the local day it ends.
 * When the source app flags sessions as main sleep (isMainSleep), the longest flagged one is
 * chosen and the onset and offset windows are skipped. Otherwise the longest session is chosen
 * (tie goes to earlier onset) and it needs onset in [18:00, 04:00) and offset <= 14:00.
 * Duration >= 180 min in both cases.
 * Heart-rate coverage, dense sampling: >= 20 samples covering >= 120 distinct minutes.
 * Sparse sampling (median gap > 5 min between readings) [adapted 2026-10-04 for 30-min sampling
 * wearables]: >= 6 readings spanning >= 150 minutes.
 */
export function assessNight(
  heartRateSamples: Array<{ timestamp: number; bpm?: number }> | undefined,
  sleepSessions: SleepSessionInput[] | undefined,
  day: string,
  timeZone: string,
): NightAssessment {
  const ending = (sleepSessions ?? []).filter(
    (session) =>
      session && session.end > session.start && localDateTime(session.end, timeZone).date === day,
  );
  const byLengthThenOnset = (a: SleepSessionInput, b: SleepSessionInput) =>
    sessionDurationMin(b) - sessionDurationMin(a) || a.start - b.start;
  const flagged = ending.filter((session) => session.isMainSleep === true);
  const sourceFlagsMainSleep = flagged.length > 0;
  const candidates = sourceFlagsMainSleep ? flagged : ending;
  candidates.sort(byLengthThenOnset);
  const main = candidates[0] ?? null;
  if (!main) {
    return { nightValid: false, mainSleep: null, hrMethod: null, hrMedianGapMin: null };
  }

  const onset = localDateTime(main.start, timeZone);
  const offset = localDateTime(main.end, timeZone);
  const onsetMin = onset.hour * 60 + onset.minute;
  const offsetMin = offset.hour * 60 + offset.minute;

  // [18:00, 04:00) is half-open at 04:00
  const onsetOk = onsetMin >= 18 * 60 || onsetMin < 4 * 60;
  const offsetOk = offsetMin <= 14 * 60;
  const durationMin = sessionDurationMin(main);

  const minutes = new Set<number>();
  let hrSamples = 0;
  for (const sample of heartRateSamples ?? []) {
    if (sample.timestamp < main.start || sample.timestamp >= main.end) continue;
    hrSamples += 1;
    minutes.add(Math.floor(sample.timestamp / MINUTE));
  }
  const coveredMinutes = minutes.size;
  const profile = sleepHeartRateProfile(
    (heartRateSamples ?? []).filter(
      (sample): sample is { timestamp: number; bpm: number } => typeof sample.bpm === "number",
    ),
    main,
  );
  const hrCoverageOk =
    profile.method === "sparse-3-readings"
      ? profile.readings.length >= SPARSE_MIN_READINGS && profile.spanMin >= SPARSE_MIN_SPAN_MINUTES
      : hrSamples >= 20 && coveredMinutes >= 120;
  // The source app's own main-sleep flag replaces the clock windows.
  const windowsOk = sourceFlagsMainSleep || (onsetOk && offsetOk);
  const nightValid = windowsOk && durationMin >= 180 && hrCoverageOk;

  const midpointTimestamp = Math.floor((main.start + main.end) / 2);
  const midLocal = localDateTime(midpointTimestamp, timeZone);
  const midpointClockMinutes = midLocal.hour * 60 + midLocal.minute;
  const midpointFormatted = `${String(midLocal.hour).padStart(2, "0")}:${String(midLocal.minute).padStart(2, "0")}`;

  return {
    nightValid,
    hrMethod: profile.method,
    hrMedianGapMin: profile.medianGapMin,
    mainSleep: {
      start: main.start,
      end: main.end,
      durationMin,
      onsetOk,
      offsetOk,
      hrSamples,
      coveredMinutes,
      midpointTimestamp,
      midpointClockMinutes,
      midpointFormatted,
    },
  };
}

export interface AssessDayParams {
  day: string;
  timeZone: string;
  heartRateSamples?: HeartRateSample[];
  sleepSessions?: SleepSession[];
  checkIn?: CheckInAnswers | null;
}

export function assessDay({
  day,
  timeZone,
  heartRateSamples = [],
  sleepSessions = [],
  checkIn = null,
}: AssessDayParams): DayAssessment {
  const items = {
    bellyComfort: asCheckInItem(checkIn?.bellyComfort),
    energy: asCheckInItem(checkIn?.energy),
    playPace: asCheckInItem(checkIn?.playPace),
  };
  const numeric = Object.values(items).filter((item) => item === 0 || item === 1 || item === 2);
  const notToday = Object.values(items).every((item) => item === "notToday");
  const daytimeHours = daytimeHourCount(heartRateSamples, day, timeZone);
  const night = assessNight(heartRateSamples, sleepSessions, day, timeZone);
  return {
    day,
    timeZone,
    dayLengthHours: localDayDurationHours(day, timeZone),
    dstShift: isDstShift(day, timeZone),
    daytimeHours,
    daytimeValid: daytimeHours >= 10,
    nightValid: night.nightValid,
    mainSleep: night.mainSleep,
    checkInValid: numeric.length >= 1,
    notToday,
    items,
  };
}
