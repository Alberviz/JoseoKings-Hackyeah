// Parent status engine.
// Compares watch metrics (steps, sleep, resting HR) with the child's own usual range and reports
// what the child marked in the check-in. Deterministic math only: no AI, no ML, no LLM.
// Grounded in docs/research/CLINICAL_EVIDENCE_AND_ALGORITHMS.md.
// Wording follows docs/PRODUCT.md section 6: no medical claims, no advice, no predictions,
// no invented composite indices, no colours or warning levels.

import { outsideUsualRange, personalBaseline, S_MIN } from "./baseline";
import { hampel } from "./clean";
import { asScore } from "./counts";
import type { CheckInScore, RangeBand } from "./types";

export type ParentStatusBand = "usualRange" | "differentFromUsual" | "collectingBaseline";

export interface DailyParentInput {
  date: string;
  bellyComfort?: unknown;
  energy?: unknown;
  playPace?: unknown;
  steps?: number | null;
  sleepMinutes?: number | null;
  restingHr?: number | null;
  daytimeValid?: boolean;
  nightValid?: boolean;
}

export interface MetricEvaluation {
  metric: "steps" | "sleep" | "restingHr";
  value: number | null;
  deviation: number | null;
  baselineMedian: number | null;
  band: RangeBand | "collecting-baseline";
  outsideRange: boolean;
  consecutiveOutsideDays: number;
}

export interface WatchCoverageInfo {
  /** Share of days in the window that have watch data, from 0 to 1. */
  coverage: number;
  validDays: number;
  totalDays: number;
  description: string;
}

export interface ParentStatusResult {
  status: ParentStatusBand;
  label: string;
  watchCoverage: WatchCoverageInfo;
  headline: string;
  descriptions: string[];
  targetDate: string;
  metrics: {
    steps?: MetricEvaluation;
    sleep?: MetricEvaluation;
    restingHr?: MetricEvaluation;
  };
  checkInSummary: {
    todayComfort: CheckInScore;
    todayEnergy: CheckInScore;
    consecutiveDiscomfortDays: number;
    consecutiveLowEnergyDays: number;
  };
}

export interface EvaluateParentStatusOptions {
  targetDate?: string;
  windowDays?: number;
}

function isDayValid(day: DailyParentInput): boolean {
  if (typeof day.daytimeValid === "boolean" || typeof day.nightValid === "boolean") {
    return Boolean(day.daytimeValid || day.nightValid);
  }
  return (
    (typeof day.steps === "number" && !Number.isNaN(day.steps)) ||
    (typeof day.sleepMinutes === "number" && !Number.isNaN(day.sleepMinutes)) ||
    (typeof day.restingHr === "number" && !Number.isNaN(day.restingHr))
  );
}

const DAY_MS = 86_400_000;

function dayNumber(date: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return Number.NaN;
  return Math.round(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY_MS);
}

/**
 * One slot per calendar day from the first to the last logged date, so a gap in the log
 * stays a gap in the series. Falls back to the sorted list when a date is not YYYY-MM-DD.
 */
function toCalendarDays(sorted: DailyParentInput[]): Array<DailyParentInput | null> {
  const numbers = sorted.map((d) => dayNumber(d.date));
  if (numbers.some((n) => Number.isNaN(n))) return sorted;
  const first = numbers[0];
  const calendar: Array<DailyParentInput | null> = Array.from(
    { length: numbers[numbers.length - 1] - first + 1 },
    () => null,
  );
  sorted.forEach((day, i) => {
    calendar[numbers[i] - first] = day;
  });
  return calendar;
}

export function calculateWatchCoverage(days: DailyParentInput[]): WatchCoverageInfo {
  const totalDays = days.length;
  if (totalDays === 0) {
    return {
      coverage: 0,
      validDays: 0,
      totalDays: 0,
      description: "No days logged yet.",
    };
  }
  const validDays = days.filter(isDayValid).length;
  return {
    coverage: validDays / totalDays,
    validDays,
    totalDays,
    description: `Watch data was present on ${validDays} of ${totalDays} days.`,
  };
}

export function evaluateParentStatus(
  days: DailyParentInput[],
  options: EvaluateParentStatusOptions = {},
): ParentStatusResult {
  if (!days || days.length === 0) {
    return {
      status: "collectingBaseline",
      label: "Collecting baseline",
      watchCoverage: calculateWatchCoverage([]),
      headline: "No data logged yet",
      descriptions: ["There are no entries yet for this period."],
      targetDate: options.targetDate ?? "",
      metrics: {},
      checkInSummary: {
        todayComfort: null,
        todayEnergy: null,
        consecutiveDiscomfortDays: 0,
        consecutiveLowEnergyDays: 0,
      },
    };
  }

  // Sort days chronologically
  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date));

  // Determine target index
  let targetIndex = sortedDays.length - 1;
  if (options.targetDate) {
    const idx = sortedDays.findIndex((d) => d.date === options.targetDate);
    if (idx !== -1) targetIndex = idx;
  }
  const targetDay = sortedDays[targetIndex];
  const targetDate = targetDay.date;

  // Confidence calculation over up to 14 days leading to targetDate (or whole period)
  const windowSize = options.windowDays ?? 14;
  const windowStart = Math.max(0, targetIndex - windowSize + 1);
  const evaluationWindow = sortedDays.slice(windowStart, targetIndex + 1);
  const watchCoverage = calculateWatchCoverage(evaluationWindow);

  const calendarDays = toCalendarDays(sortedDays);
  const calendarTargetIndex = calendarDays.findIndex((d) => d === targetDay);

  // Helper to extract and analyze metric
  function analyzeMetricSeries(
    extractor: (d: DailyParentInput) => number | null | undefined,
    sMin: number,
    metricName: "steps" | "sleep" | "restingHr",
  ): MetricEvaluation | undefined {
    const rawSeries = calendarDays.map((d) => (d ? extractor(d) : null));
    const hasAnyValue = rawSeries.some((v) => typeof v === "number" && !Number.isNaN(v));
    if (!hasAnyValue) return undefined;

    const cleaned = hampel(rawSeries);
    const baselines = personalBaseline(cleaned.values, { sMin });
    const deviations = baselines.map((b) => (b && b.kind === "value" ? b.d : null));
    const a9Marked = outsideUsualRange(deviations);

    const targetVal = rawSeries[calendarTargetIndex] ?? null;
    const targetBase = baselines[calendarTargetIndex];

    let deviation: number | null = null;
    let baselineMedian: number | null = null;
    let band: RangeBand | "collecting-baseline" = "collecting-baseline";
    let outsideRange = false;

    if (targetBase && targetBase.kind === "value") {
      deviation = targetBase.d;
      baselineMedian = targetBase.median;
      band = targetBase.band;
      outsideRange = Math.abs(targetBase.d) > 2 || a9Marked[calendarTargetIndex];
    }

    // Count consecutive outside days ending at targetIndex
    let consecutiveOutsideDays = 0;
    for (let i = calendarTargetIndex; i >= 0; i -= 1) {
      const b = baselines[i];
      if (b && b.kind === "value" && (Math.abs(b.d) > 2 || a9Marked[i])) {
        consecutiveOutsideDays += 1;
      } else {
        break;
      }
    }

    return {
      metric: metricName,
      value: targetVal,
      deviation,
      baselineMedian,
      band,
      outsideRange,
      consecutiveOutsideDays,
    };
  }

  const stepsEval = analyzeMetricSeries((d) => d.steps, S_MIN.steps, "steps");
  const sleepEval = analyzeMetricSeries((d) => d.sleepMinutes, S_MIN.sleepMinutes, "sleep");
  const restingHrEval = analyzeMetricSeries((d) => d.restingHr, S_MIN.nocturnalHr, "restingHr");

  // Check-in responses
  const todayComfort = asScore(targetDay.bellyComfort);
  const todayEnergy = asScore(targetDay.energy);

  let consecutiveDiscomfortDays = 0;
  for (let i = targetIndex; i >= 0; i -= 1) {
    const c = asScore(sortedDays[i].bellyComfort);
    if (c === 1 || c === 2) {
      consecutiveDiscomfortDays += 1;
    } else {
      break;
    }
  }

  let consecutiveLowEnergyDays = 0;
  for (let i = targetIndex; i >= 0; i -= 1) {
    const e = asScore(sortedDays[i].energy);
    if (e === 1 || e === 2) {
      consecutiveLowEnergyDays += 1;
    } else {
      break;
    }
  }

  // Status: only the watch metrics against the child's own usual range.
  const evaluatedMetrics = [stepsEval, sleepEval, restingHrEval].filter(
    (m): m is MetricEvaluation => m !== undefined,
  );
  const hasBaseline = evaluatedMetrics.some((m) => m.band !== "collecting-baseline");
  const hasDifference = evaluatedMetrics.some((m) => m.outsideRange);

  let status: ParentStatusBand = "usualRange";
  let label = "Usual range";
  let headline = "Within the usual range";

  if (!hasBaseline) {
    status = "collectingBaseline";
    label = "Collecting baseline";
    headline = "Collecting the usual range";
  } else if (hasDifference) {
    status = "differentFromUsual";
    label = "Different from usual";
    headline = "Different from the usual range";
  }

  // Plain-language, neutral descriptions
  const descriptions: string[] = [];

  if (sleepEval && sleepEval.value !== null) {
    if (sleepEval.band === "below") {
      descriptions.push("Last night's sleep was below the usual range.");
    } else if (sleepEval.band === "above") {
      descriptions.push("Last night's sleep was above the usual range.");
    } else if (sleepEval.band === "within") {
      descriptions.push("Last night's sleep was within the usual range.");
    } else {
      const hours = (sleepEval.value / 60).toFixed(1);
      descriptions.push(
        `Sleep logged last night was ${hours} hours (still collecting a baseline).`,
      );
    }
  }

  if (stepsEval && stepsEval.value !== null) {
    if (stepsEval.band === "below") {
      descriptions.push("Steps were below the usual range.");
    } else if (stepsEval.band === "above") {
      descriptions.push("Steps were above the usual range.");
    } else if (stepsEval.band === "within") {
      descriptions.push("Steps were within the usual range.");
    }
  }

  if (restingHrEval && restingHrEval.value !== null) {
    if (restingHrEval.band === "above") {
      descriptions.push("Night-time resting heart rate was above the usual range.");
    } else if (restingHrEval.band === "below") {
      descriptions.push("Night-time resting heart rate was below the usual range.");
    } else if (restingHrEval.band === "within") {
      descriptions.push("Night-time resting heart rate was within the usual range.");
    }
  }

  // Child check-in descriptions (what the child marked, nothing more)
  if (consecutiveDiscomfortDays >= 3) {
    descriptions.push(
      `The child marked belly discomfort on the last ${consecutiveDiscomfortDays} days.`,
    );
  } else if (todayComfort === 1) {
    descriptions.push("The child marked a little belly discomfort today.");
  } else if (todayComfort === 2) {
    descriptions.push("The child marked a lot of belly discomfort today.");
  } else if (todayComfort === 0) {
    descriptions.push("The child marked a comfortable belly today.");
  }

  if (consecutiveLowEnergyDays >= 3) {
    descriptions.push(
      `The child marked feeling tired on the last ${consecutiveLowEnergyDays} days.`,
    );
  } else if (todayEnergy === 1) {
    descriptions.push("The child marked feeling a little tired today.");
  } else if (todayEnergy === 2) {
    descriptions.push("The child marked feeling very tired today.");
  } else if (todayEnergy === 0) {
    descriptions.push("The child marked a good amount of energy today.");
  }

  if (targetDay.bellyComfort === "notToday") {
    descriptions.push("The child chose not to complete the check-in today.");
  }

  return {
    status,
    label,
    watchCoverage,
    headline,
    descriptions,
    targetDate,
    metrics: {
      steps: stepsEval,
      sleep: sleepEval,
      restingHr: restingHrEval,
    },
    checkInSummary: {
      todayComfort,
      todayEnergy,
      consecutiveDiscomfortDays,
      consecutiveLowEnergyDays,
    },
  };
}
