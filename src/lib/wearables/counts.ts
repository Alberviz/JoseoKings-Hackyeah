// Counts only, descriptive co-occurrence, day counts, period windows.
// No test statistic, no composite, no cause.

import {
  addDays,
  enumerateDates,
  median,
  mulberry32,
  quantileType7,
  quartiles,
  resample,
} from "./stats";

const BOOTSTRAP = 2000;

import type { CheckInScore } from "./types";

export function asScore(value: unknown): CheckInScore {
  if (value === 0 || value === 1 || value === 2) return value;
  if (value === "notToday") return "notToday";
  return null;
}

export interface ItemCounts {
  0: number;
  1: number;
  2: number;
  notAnswered: number;
}

function emptyItemCounts(): ItemCounts {
  return { 0: 0, 1: 0, 2: 0, notAnswered: 0 };
}

function datesAreSteps(dates: Array<string | null>, index: number): boolean {
  if (!dates || !dates[index] || !dates[index - 1]) return true;
  return addDays(dates[index - 1]!, 1) === dates[index];
}

export interface RunInfo {
  length: number;
  startIndex: number | null;
  endIndex: number | null;
}

function longestRun(flags: boolean[], dates: Array<string | null>): RunInfo {
  let best: RunInfo = { length: 0, startIndex: null, endIndex: null };
  let run = 0;
  let runStart = 0;
  const close = (endIndex: number) => {
    if (run > best.length) best = { length: run, startIndex: runStart, endIndex };
  };
  for (let i = 0; i < flags.length; i += 1) {
    const continues = flags[i] && (run === 0 || datesAreSteps(dates, i));
    if (continues) {
      if (run === 0) runStart = i;
      run += 1;
    } else {
      close(i - 1);
      if (flags[i]) {
        run = 1;
        runStart = i;
      } else {
        run = 0;
      }
    }
  }
  close(flags.length - 1);
  return best;
}

export interface DayForCounts {
  date?: string;
  bellyComfort?: unknown;
  energy?: unknown;
  playPace?: unknown;
  foodEntries?: Array<{ text?: string; tags?: string[] }>;
  missionRecords?: unknown[];
  missions?: number;
}

export interface PeriodCountsResult {
  calendarDays: number;
  answeredDays: number;
  notTodayDays: number;
  steadyDays: number;
  comfortDays: number;
  discomfortDays: number;
  longestSteadyRun: RunInfo;
  longestComfortRun: RunInfo;
  items: {
    bellyComfort: ItemCounts;
    energy: ItemCounts;
    playPace: ItemCounts;
  };
}

/**
 * A steady day is a day on which all three items were answered and each is 0.
 * A day with a notToday item is not steady.
 * "I don't feel like it today" is not 0. Items are counted, never summed.
 * Dates, when present, are calendar days: a skipped date breaks a run.
 */
export function periodCounts(days: DayForCounts[]): PeriodCountsResult {
  const items = {
    bellyComfort: emptyItemCounts(),
    energy: emptyItemCounts(),
    playPace: emptyItemCounts(),
  };
  const steady: boolean[] = [];
  const comfort: boolean[] = [];
  const dates: Array<string | null> = [];
  let answeredDays = 0;
  let notTodayDays = 0;
  let comfortDays = 0;
  let discomfortDays = 0;

  for (const day of days) {
    const scores = {
      bellyComfort: asScore(day?.bellyComfort),
      energy: asScore(day?.energy),
      playPace: asScore(day?.playPace),
    };
    dates.push(day?.date ?? null);
    let numeric = 0;
    for (const key of Object.keys(items) as Array<keyof typeof items>) {
      const score = scores[key];
      if (score === 0 || score === 1 || score === 2) {
        items[key][score] += 1;
        numeric += 1;
      } else {
        items[key].notAnswered += 1;
      }
    }
    const allNotToday = Object.values(scores).every((score) => score === "notToday");
    if (allNotToday) notTodayDays += 1;
    if (numeric >= 1) answeredDays += 1;
    const isSteady = scores.bellyComfort === 0 && scores.energy === 0 && scores.playPace === 0;
    const isComfort = scores.bellyComfort === 0;
    const isDiscomfort = scores.bellyComfort === 1 || scores.bellyComfort === 2;
    steady.push(isSteady);
    comfort.push(isComfort);
    if (isComfort) comfortDays += 1;
    if (isDiscomfort) discomfortDays += 1;
  }

  const steadyDays = steady.filter(Boolean).length;
  return {
    calendarDays: days.length,
    answeredDays,
    notTodayDays,
    steadyDays,
    comfortDays,
    discomfortDays,
    longestSteadyRun: longestRun(steady, dates),
    longestComfortRun: longestRun(comfort, dates),
    items,
  };
}

function foodTagsOf(day: DayForCounts): { hasEntry: boolean; tags: string[] } {
  if (Array.isArray(day?.foodEntries)) {
    const tags: string[] = [];
    let hasEntry = false;
    for (const entry of day.foodEntries) {
      const text = typeof entry?.text === "string" ? entry.text.trim() : "";
      const entryTags = Array.isArray(entry?.tags)
        ? entry.tags.filter(
            (tag: unknown): tag is string => typeof tag === "string" && tag.length > 0,
          )
        : [];
      if (text.length > 0 || entryTags.length > 0) hasEntry = true;
      tags.push(...entryTags);
    }
    return { hasEntry, tags };
  }
  return { hasEntry: false, tags: [] };
}

export interface FoodTagCount {
  tag: string;
  n: number;
}

export interface FoodCooccurrenceResult {
  discomfortDays: number;
  discomfortDaysWithFood: number;
  tags: FoodTagCount[];
}

/**
 * Counts of tags written on discomfort days (bellyComfort 1 or 2).
 * Sorted by count descending, then tag name. No test, no rank, no cause.
 * The same tag on one day counts once.
 */
export function foodCooccurrence(days: DayForCounts[]): FoodCooccurrenceResult {
  let discomfortDays = 0;
  let discomfortDaysWithFood = 0;
  const counts = new Map<string, number>();
  for (const day of days) {
    const comfort = asScore(day?.bellyComfort);
    if (comfort !== 1 && comfort !== 2) continue;
    discomfortDays += 1;
    const food = foodTagsOf(day);
    if (!food.hasEntry) continue;
    discomfortDaysWithFood += 1;
    const seen = new Set(food.tags);
    for (const tag of seen) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  const tags = [...counts.entries()]
    .map(([tag, n]) => ({ tag, n }))
    .sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
  return { discomfortDays, discomfortDaysWithFood, tags };
}

function percentileInterval(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    low: quantileType7(sorted, 0.025),
    high: quantileType7(sorted, 0.975),
  };
}

function valueMap(series: Array<{ date?: string; value?: unknown }>) {
  const map = new Map<string, number | null>();
  for (const row of series) {
    if (!row?.date) continue;
    map.set(row.date, typeof row.value === "number" && !Number.isNaN(row.value) ? row.value : null);
  }
  return map;
}

function summarise(dates: string[], values: Map<string, number | null>) {
  const observed: number[] = [];
  for (const date of dates) {
    const value = values.get(date);
    if (typeof value === "number") observed.push(value);
  }
  if (observed.length === 0) {
    return { calendarDays: dates.length, n: 0, median: null, iqr: null, values: [] };
  }
  const { iqr } = quartiles(observed);
  return {
    calendarDays: dates.length,
    n: observed.length,
    median: median(observed),
    iqr,
    values: observed,
  };
}

export interface ConsultationComparisonParams {
  consultations: string[];
  today: string;
  series: Array<{ date?: string; value?: unknown }>;
  seed?: number;
  resamples?: number;
}

/**
 * Period comparison before and after consultations.
 */
export function consultationComparison({
  consultations,
  today,
  series,
  seed,
  resamples = BOOTSTRAP,
}: ConsultationComparisonParams) {
  const sorted = [...consultations].sort();
  const values = valueMap(series);
  const last = sorted.length > 0 ? sorted[sorted.length - 1] : null;
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const period1Dates = last
    ? enumerateDates(last, today)
    : [...values.keys()].filter((date) => date <= today).sort();
  const period0Dates = previous && last ? enumerateDates(previous, last) : [];
  const period1 = summarise(period1Dates, values);
  const period0 = previous ? summarise(period0Dates, values) : null;

  const finish = (reason: string, have: number, need: number) => ({
    period1: {
      calendarDays: period1.calendarDays,
      n: period1.n,
      median: period1.median,
      iqr: period1.iqr,
    },
    period0: period0
      ? {
          calendarDays: period0.calendarDays,
          n: period0.n,
          median: period0.median,
          iqr: period0.iqr,
        }
      : null,
    comparison: {
      kind: "insufficient-data",
      reason,
      have,
      need,
      difference: null,
      ci: null,
    },
  });

  if (!previous) return finish("no-previous-period", period1.n, 28);
  if (period0!.calendarDays === 0 || period1.calendarDays === 0) {
    return finish("need-valid-days", 0, 28);
  }
  const lengthOk =
    period0!.calendarDays > 0 &&
    period1.calendarDays > 0 &&
    Math.max(period0!.calendarDays, period1.calendarDays) /
      Math.min(period0!.calendarDays, period1.calendarDays) <
      3;
  if (!lengthOk) {
    return finish("length-factor", Math.min(period0!.calendarDays, period1.calendarDays), 28);
  }
  if (period0!.n < 28 || period1.n < 28) {
    return finish("need-valid-days", Math.min(period0!.n, period1.n), 28);
  }
  if (typeof seed !== "number") {
    throw new Error("consultationComparison requires an integer seed");
  }

  const rng = mulberry32(seed);
  const diffs = new Array<number>(resamples);
  for (let i = 0; i < resamples; i += 1) {
    diffs[i] =
      (median(resample(period1.values, rng)) ?? 0) - (median(resample(period0!.values, rng)) ?? 0);
  }
  return {
    period1: {
      calendarDays: period1.calendarDays,
      n: period1.n,
      median: period1.median,
      iqr: period1.iqr,
    },
    period0: {
      calendarDays: period0!.calendarDays,
      n: period0!.n,
      median: period0!.median,
      iqr: period0!.iqr,
    },
    comparison: {
      kind: "value",
      difference: (period1.median ?? 0) - (period0!.median ?? 0),
      ci: percentileInterval(diffs),
      seed,
    },
  };
}
