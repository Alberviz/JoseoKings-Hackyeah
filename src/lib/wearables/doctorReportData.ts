/**
 * Clinical data aggregation layer for the Doctor Report (DoctorReportView).
 * Consolidates smartwatch metrics, child check-in answers, parent observations,
 * consultation intervals comparison, and lagged co-occurrence into a single clinical contract.
 */

import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import { hampel } from "./clean";
import { nocturnalRestingHr } from "./restingHr";
import { median, mulberry32, percentileInterval, quartiles, resample, spearman } from "./stats";
import { assessNight, daytimeHourCount, localDateTime } from "./validity";
import type { SleepSessionInput } from "./types";

export const MIN_CONSULTATION_COMPARISON_DAYS = 28;
export const MIN_COOCCURRENCE_PAIRS = 21;
export const DEFAULT_BOOTSTRAP_REPLICATES = 2000;
export const DEFAULT_TIMEZONE = "Europe/Madrid";

// ---------------------------------------------------------------------------
// Report Contract Types
// ---------------------------------------------------------------------------

export type NumericSummary = {
  median: number | null;
  iqr: number | null;
  n: number;
};

export type SmartwatchMetrics = {
  steps: {
    median: number | null;
    iqr: number | null;
    validDaysCount: number;
  };
  nocturnalRestingHr: {
    median: number | null;
    iqr: number | null;
    nNights: number;
  };
  sleepDuration: {
    medianMinutes: number | null;
    iqrMinutes: number | null;
    medianHours: number | null;
    iqrHours: number | null;
    nNights: number;
    midpoint: {
      medianMinutesFromMidnight: number | null;
      formattedClockTime: string | null;
    };
  };
  validitySummary: string; // "Recorded on X of Y days (Z of Y nights)"
  coverage: {
    validDays: number;
    validNights: number;
    calendarDays: number;
  };
};

export type ItemScoreCounts = {
  0: number;
  1: number;
  2: number;
  notToday: number;
  notAnswered: number;
};

export type ChildCheckInReport = {
  bellyComfort: ItemScoreCounts;
  energy: ItemScoreCounts;
  playPace: ItemScoreCounts;
  answeredDays: number;
  notTodayDays: number;
  steadyDays: {
    totalSteadyDays: number;
    answeredDays: number;
    ratioString: string;
    longestRunDays: number;
    longestRunDates: {
      start: string | null;
      end: string | null;
    };
  };
};

export type BathroomVisitsObservation = {
  daytimeCount: number;
  nighttimeCount: number;
  looserStools: boolean;
  bloodVisible: boolean;
  looserStoolsDaysCount: number;
  bloodVisibleDaysCount: number;
};

export type MedicationAdherenceReport = {
  yes: number;
  partly: number;
  no: number;
  notApplicable: number;
};

export type FoodCooccurrenceItem = {
  tag: string;
  count: number;
};

export type ParentReportData = {
  bathroom: BathroomVisitsObservation;
  medicationAdherence: MedicationAdherenceReport;
  foodsOnDiscomfortDays: FoodCooccurrenceItem[];
  discomfortDaysCount: number;
  discomfortDaysWithFoodCount: number;
  notes: Array<{ date: string; text: string }>;
};

export type IntervalComparisonMetric = {
  period1Median: number | null;
  period0Median: number | null;
  period1N: number;
  period0N: number;
  difference: number | null;
  ci: { low: number; high: number } | null;
  status: "value" | "insufficient-data";
  reason?: "no-previous-period" | "need-valid-days" | "length-factor";
  have?: number;
  need?: number;
};

export type ConsultationIntervalsReport = {
  currentPeriod: {
    startDate: string;
    endDate: string;
    calendarDays: number;
  };
  previousPeriod: {
    startDate: string;
    endDate: string;
    calendarDays: number;
  } | null;
  metrics: {
    steps: IntervalComparisonMetric;
    nocturnalRestingHr: IntervalComparisonMetric;
    sleepDuration: IntervalComparisonMetric;
  };
};

export type CooccurrenceCell = {
  predictor: "sleepDuration" | "steps";
  target: "bellyComfort" | "energy";
  n: number;
  rho: number | null;
  ci: { low: number; high: number } | null;
  status: "value" | "insufficient-data";
  have?: number;
  need?: number;
};

export type CooccurrenceTableReport = {
  cells: CooccurrenceCell[];
  narrative: string | null;
};

export type FootnoteAndDisclaimers = {
  hampelSpikesFootnote: string;
  cleanedSpikesCount: number;
  spikesDetails: {
    stepsSpikes: number;
    restingHrSpikes: number;
  };
  demoDisclaimer: string;
  clinicalDisclaimer: string;
  isDemo: boolean;
};

export type DoctorReportPayload = {
  generatedDate: string;
  childNickname: string;
  period: {
    startDate: string;
    endDate: string;
    calendarDays: number;
    previousConsultationDate: string | null;
  };
  smartwatch: SmartwatchMetrics;
  childCheckIn: ChildCheckInReport;
  parentLogs: ParentReportData;
  consultationComparison: ConsultationIntervalsReport;
  cooccurrenceTable: CooccurrenceTableReport;
  footnotesAndDisclaimers: FootnoteAndDisclaimers;
};

// ---------------------------------------------------------------------------
// Inputs Type
// ---------------------------------------------------------------------------

export type CheckInAnswerInput = number | "skipped" | "notToday" | null;

export type CheckInInput = {
  date: string;
  answers?: Record<string, CheckInAnswerInput>;
  bellyComfort?: number | "notToday" | null;
  energy?: number | "notToday" | null;
  playPace?: number | "notToday" | null;
  notToday?: boolean;
  childNote?: string;
};

export type ParentLogInput = {
  date: string;
  sleepHours?: number;
  activity?: "none" | "light" | "moderate" | "high";
  school?: "attended" | "left-early" | "missed" | "no-school";
  medicationTaken?: "yes" | "partly" | "no" | "not-applicable";
  note?: string;
};

export type ParentObservationInput = {
  date: string;
  observedAt?: string | number;
  kind?: string;
  valueNum?: number;
  valueText?: string;
  daytimeVisits?: number;
  nighttimeVisits?: number;
  looserStools?: boolean;
  bloodVisible?: boolean;
};

export type FoodEntryInput = {
  date: string;
  text?: string;
  tags?: string[];
};

export type DailyMetricInput = {
  date: string;
  steps?: number | null;
  nocturnalRestingHr?: number | null;
  sleepMinutes?: number | null;
  sleepMidpointMinutes?: number | null;
  validActivity?: boolean;
  validSleep?: boolean;
};

export type HeartRateSampleInput = {
  timestamp: number;
  bpm: number;
};

export type ConsultationInput = {
  id?: string;
  date: string;
};

export type DoctorReportInputs = {
  startDate: string;
  endDate: string;
  today?: string;
  childNickname?: string;
  timeZone?: string;
  isDemo?: boolean;
  seed?: number;
  consultations?: ConsultationInput[];

  // Smartwatch inputs (raw samples or pre-aggregated metrics)
  dailyMetrics?: DailyMetricInput[];
  heartRateSamples?: HeartRateSampleInput[];
  sleepSessions?: SleepSessionInput[];
  stepsPerMinute?: Array<{ timestamp: number; steps: number }>;

  // Check-ins
  checkIns?: CheckInInput[];

  // Parent logs & observations
  parentLogs?: ParentLogInput[];
  parentObservations?: ParentObservationInput[];
  foodEntries?: FoodEntryInput[];

  // Optional explicit previous period data for comparisons
  previousPeriod?: {
    startDate: string;
    endDate: string;
    dailyMetrics?: DailyMetricInput[];
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDaysKey(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days, 12));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function enumerateDatesList(startDate: string, endDate: string): string[] {
  if (endDate < startDate) return [];
  const dates: string[] = [];
  let curr = startDate;
  while (curr <= endDate) {
    dates.push(curr);
    curr = addDaysKey(curr, 1);
  }
  return dates;
}

function parseScore(val: unknown): 0 | 1 | 2 | "notToday" | null {
  if (val === 0 || val === 1 || val === 2) return val;
  if (val === "notToday") return "notToday";
  return null;
}

function formatClockTime(minutesFromMidnight: number | null): string | null {
  if (minutesFromMidnight === null) return null;
  const normalized = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Aggregation Engine
// ---------------------------------------------------------------------------

export function buildDoctorReportPayload(inputs: DoctorReportInputs): DoctorReportPayload {
  const timeZone = inputs.timeZone ?? DEFAULT_TIMEZONE;
  const startDate = inputs.startDate;
  const endDate = inputs.endDate;
  const generatedDate = inputs.today ?? endDate;
  const childNickname = inputs.childNickname ?? "Lucas";
  const isDemo = inputs.isDemo ?? true;
  const seed = inputs.seed ?? 20260404;

  const calendarDates = enumerateDatesList(startDate, endDate);
  const calendarDays = calendarDates.length;

  // 1. Process Smartwatch metrics
  // Map raw samples or pre-aggregated metrics into day-by-day values
  const metricsByDate = new Map<string, DailyMetricInput>();
  for (const m of inputs.dailyMetrics ?? []) {
    metricsByDate.set(m.date, m);
  }

  // Precompute raw steps per day if stepsPerMinute provided
  const rawStepsByDate = new Map<string, number>();
  if (inputs.stepsPerMinute && inputs.stepsPerMinute.length > 0) {
    for (const s of inputs.stepsPerMinute) {
      const local = localDateTime(s.timestamp, timeZone);
      rawStepsByDate.set(local.date, (rawStepsByDate.get(local.date) ?? 0) + s.steps);
    }
  }

  // Build unified daily series for current period
  type DayWearable = {
    date: string;
    steps: number | null;
    validActivity: boolean;
    nocturnalHr: number | null;
    sleepMinutes: number | null;
    sleepMidpointMinutes: number | null;
    validSleep: boolean;
  };

  const wearableDays: DayWearable[] = calendarDates.map((date) => {
    const existing = metricsByDate.get(date);
    let steps: number | null = null;
    let validActivity = false;
    let nocturnalHr: number | null = null;
    let sleepMinutes: number | null = null;
    let sleepMidpointMinutes: number | null = null;
    let validSleep = false;

    if (existing) {
      steps = typeof existing.steps === "number" ? existing.steps : null;
      validActivity = existing.validActivity ?? (steps !== null && steps > 0);
      nocturnalHr =
        typeof existing.nocturnalRestingHr === "number" ? existing.nocturnalRestingHr : null;
      sleepMinutes = typeof existing.sleepMinutes === "number" ? existing.sleepMinutes : null;
      sleepMidpointMinutes =
        typeof existing.sleepMidpointMinutes === "number" ? existing.sleepMidpointMinutes : null;
      validSleep = existing.validSleep ?? (nocturnalHr !== null || sleepMinutes !== null);
    } else {
      // Calculate from raw samples if available
      if (rawStepsByDate.has(date)) {
        steps = rawStepsByDate.get(date)!;
      }

      if (inputs.heartRateSamples && inputs.heartRateSamples.length > 0) {
        const hoursCount = daytimeHourCount(inputs.heartRateSamples, date, timeZone);
        validActivity = hoursCount >= 10;

        if (inputs.sleepSessions && inputs.sleepSessions.length > 0) {
          const nightAssessment = assessNight(
            inputs.heartRateSamples,
            inputs.sleepSessions,
            date,
            timeZone,
          );
          if (nightAssessment.nightValid && nightAssessment.mainSleep) {
            validSleep = true;
            sleepMinutes = nightAssessment.mainSleep.durationMin;
            sleepMidpointMinutes = nightAssessment.mainSleep.midpointClockMinutes ?? null;
            const rhrResult = nocturnalRestingHr(
              inputs.heartRateSamples,
              nightAssessment.mainSleep,
            );
            if (rhrResult.kind === "value") {
              nocturnalHr = rhrResult.nRhr;
            }
          }
        }
      }
    }

    return {
      date,
      steps,
      validActivity,
      nocturnalHr,
      sleepMinutes,
      sleepMidpointMinutes,
      validSleep,
    };
  });

  // Hampel filtering (A1) on daily series to detect and replace single-day spikes
  const rawStepsSeries = wearableDays.map((d) => (d.validActivity ? d.steps : null));
  const rawHrSeries = wearableDays.map((d) => (d.validSleep ? d.nocturnalHr : null));

  const hampelSteps = hampel(rawStepsSeries);
  const hampelHr = hampel(rawHrSeries);

  const stepsSpikes = hampelSteps.replacedIndices.length;
  const restingHrSpikes = hampelHr.replacedIndices.length;
  const cleanedSpikesCount = stepsSpikes + restingHrSpikes;

  const cleanedSteps = hampelSteps.values;
  const cleanedHr = hampelHr.values;

  // Update wearableDays with cleaned values
  wearableDays.forEach((d, idx) => {
    if (d.validActivity && cleanedSteps[idx] !== null) {
      d.steps = cleanedSteps[idx];
    }
    if (d.validSleep && cleanedHr[idx] !== null) {
      d.nocturnalHr = cleanedHr[idx];
    }
  });

  // Calculate Smartwatch summary metrics
  const validStepValues = wearableDays
    .filter((d) => d.validActivity && d.steps !== null)
    .map((d) => d.steps as number);
  const validHrValues = wearableDays
    .filter((d) => d.validSleep && d.nocturnalHr !== null)
    .map((d) => d.nocturnalHr as number);
  const validSleepMinutesValues = wearableDays
    .filter((d) => d.validSleep && d.sleepMinutes !== null)
    .map((d) => d.sleepMinutes as number);
  const validMidpointValues = wearableDays
    .filter((d) => d.validSleep && d.sleepMidpointMinutes !== null)
    .map((d) => d.sleepMidpointMinutes as number);

  const stepsQuartiles = quartiles(validStepValues);
  const hrQuartiles = quartiles(validHrValues);
  const sleepMinQuartiles = quartiles(validSleepMinutesValues);

  const validDaysCount = validStepValues.length;
  const validNightsCount = Math.max(validHrValues.length, validSleepMinutesValues.length);

  const sleepMedianMin = median(validSleepMinutesValues);
  const sleepIqrMin = sleepMinQuartiles.iqr;
  const sleepMedianHours =
    sleepMedianMin !== null ? Math.round((sleepMedianMin / 60) * 10) / 10 : null;
  const sleepIqrHours = sleepIqrMin !== null ? Math.round((sleepIqrMin / 60) * 10) / 10 : null;

  const midpointMedianMin = median(validMidpointValues);
  const formattedMidpoint = formatClockTime(midpointMedianMin);

  const smartwatchMetrics: SmartwatchMetrics = {
    steps: {
      median: median(validStepValues),
      iqr: stepsQuartiles.iqr,
      validDaysCount,
    },
    nocturnalRestingHr: {
      median: median(validHrValues),
      iqr: hrQuartiles.iqr,
      nNights: validHrValues.length,
    },
    sleepDuration: {
      medianMinutes: sleepMedianMin,
      iqrMinutes: sleepIqrMin,
      medianHours: sleepMedianHours,
      iqrHours: sleepIqrHours,
      nNights: validSleepMinutesValues.length,
      midpoint: {
        medianMinutesFromMidnight: midpointMedianMin,
        formattedClockTime: formattedMidpoint,
      },
    },
    validitySummary: `Recorded on ${validDaysCount} of ${calendarDays} days (${validNightsCount} of ${calendarDays} nights)`,
    coverage: {
      validDays: validDaysCount,
      validNights: validNightsCount,
      calendarDays,
    },
  };

  // 2. Child emotional and physical check-in answers (A13)
  const checkInByDate = new Map<string, CheckInInput>();
  for (const c of inputs.checkIns ?? []) {
    checkInByDate.set(c.date, c);
  }

  const emptyCounts = (): ItemScoreCounts => ({
    0: 0,
    1: 0,
    2: 0,
    notToday: 0,
    notAnswered: 0,
  });

  const bellyCounts = emptyCounts();
  const energyCounts = emptyCounts();
  const playPaceCounts = emptyCounts();

  let answeredDaysCount = 0;
  let notTodayDaysCount = 0;

  type DailyCheckInStatus = {
    date: string;
    bellyComfort: 0 | 1 | 2 | "notToday" | null;
    energy: 0 | 1 | 2 | "notToday" | null;
    playPace: 0 | 1 | 2 | "notToday" | null;
    isSteady: boolean;
  };

  const dailyCheckIns: DailyCheckInStatus[] = calendarDates.map((date) => {
    const ci = checkInByDate.get(date);
    let belly: 0 | 1 | 2 | "notToday" | null = null;
    let energy: 0 | 1 | 2 | "notToday" | null = null;
    let pace: 0 | 1 | 2 | "notToday" | null = null;

    if (ci) {
      if (ci.notToday) {
        belly = "notToday";
        energy = "notToday";
        pace = "notToday";
      } else {
        belly = parseScore(
          ci.bellyComfort ?? ci.answers?.["belly-comfort"] ?? ci.answers?.bellyComfort,
        );
        energy = parseScore(ci.energy ?? ci.answers?.["energy"] ?? ci.answers?.energy);
        pace = parseScore(ci.playPace ?? ci.answers?.["play-pace"] ?? ci.answers?.playPace);
      }
    }

    const tally = (score: 0 | 1 | 2 | "notToday" | null, bucket: ItemScoreCounts) => {
      if (score === 0 || score === 1 || score === 2) bucket[score] += 1;
      else if (score === "notToday") bucket.notToday += 1;
      else bucket.notAnswered += 1;
    };

    tally(belly, bellyCounts);
    tally(energy, energyCounts);
    tally(pace, playPaceCounts);

    const hasNumeric =
      belly === 0 ||
      belly === 1 ||
      belly === 2 ||
      energy === 0 ||
      energy === 1 ||
      energy === 2 ||
      pace === 0 ||
      pace === 1 ||
      pace === 2;
    if (hasNumeric) answeredDaysCount += 1;

    const allNotToday = belly === "notToday" && energy === "notToday" && pace === "notToday";
    if (allNotToday) notTodayDaysCount += 1;

    // Steady day: all 3 items answered and each is 0
    const isSteady = belly === 0 && energy === 0 && pace === 0;

    return {
      date,
      bellyComfort: belly,
      energy,
      playPace: pace,
      isSteady,
    };
  });

  // Calculate longest steady run (must be consecutive calendar days)
  let longestRun = 0;
  let currentRun = 0;
  let runStartIdx = 0;
  let bestStartIdx: number | null = null;
  let bestEndIdx: number | null = null;

  dailyCheckIns.forEach((day, idx) => {
    if (day.isSteady) {
      if (currentRun === 0) runStartIdx = idx;
      currentRun += 1;
      if (currentRun > longestRun) {
        longestRun = currentRun;
        bestStartIdx = runStartIdx;
        bestEndIdx = idx;
      }
    } else {
      currentRun = 0;
    }
  });

  const totalSteadyDays = dailyCheckIns.filter((d) => d.isSteady).length;

  const childCheckInReport: ChildCheckInReport = {
    bellyComfort: bellyCounts,
    energy: energyCounts,
    playPace: playPaceCounts,
    answeredDays: answeredDaysCount,
    notTodayDays: notTodayDaysCount,
    steadyDays: {
      totalSteadyDays,
      answeredDays: answeredDaysCount,
      ratioString: `${totalSteadyDays} of ${answeredDaysCount} answered days`,
      longestRunDays: longestRun,
      longestRunDates: {
        start: bestStartIdx !== null ? dailyCheckIns[bestStartIdx].date : null,
        end: bestEndIdx !== null ? dailyCheckIns[bestEndIdx].date : null,
      },
    },
  };

  // 3. Parent physical logs and observations
  let daytimeBathroomCount = 0;
  let nighttimeBathroomCount = 0;
  const looserStoolsDays = new Set<string>();
  const bloodVisibleDays = new Set<string>();

  for (const obs of inputs.parentObservations ?? []) {
    if (obs.date < startDate || obs.date > endDate) continue;

    // Daytime visits
    if (typeof obs.daytimeVisits === "number") {
      daytimeBathroomCount += obs.daytimeVisits;
    } else if (
      obs.kind === "bathroom_day" ||
      obs.kind === "bathroom_daytime" ||
      (obs.kind === "bathroom_visits" && obs.valueText === "day")
    ) {
      daytimeBathroomCount += obs.valueNum ?? 1;
    }

    // Nighttime visits
    if (typeof obs.nighttimeVisits === "number") {
      nighttimeBathroomCount += obs.nighttimeVisits;
    } else if (
      obs.kind === "bathroom_night" ||
      obs.kind === "bathroom_nighttime" ||
      (obs.kind === "bathroom_visits" && obs.valueText === "night")
    ) {
      nighttimeBathroomCount += obs.valueNum ?? 1;
    }

    // Looser stools
    if (
      obs.looserStools === true ||
      obs.kind === "looser_stools" ||
      obs.kind === "stool_looser" ||
      (obs.kind === "bathroom_visits" && obs.valueText?.toLowerCase().includes("loose"))
    ) {
      looserStoolsDays.add(obs.date);
    }

    // Blood visible
    if (
      obs.bloodVisible === true ||
      obs.kind === "blood_visible" ||
      obs.kind === "blood_seen" ||
      (obs.kind === "bathroom_visits" && obs.valueText?.toLowerCase().includes("blood"))
    ) {
      bloodVisibleDays.add(obs.date);
    }
  }

  // Medication adherence
  const medicationCounts: MedicationAdherenceReport = {
    yes: 0,
    partly: 0,
    no: 0,
    notApplicable: 0,
  };
  const parentNotesList: Array<{ date: string; text: string }> = [];

  for (const log of inputs.parentLogs ?? []) {
    if (log.date < startDate || log.date > endDate) continue;
    if (log.medicationTaken === "yes") medicationCounts.yes += 1;
    else if (log.medicationTaken === "partly") medicationCounts.partly += 1;
    else if (log.medicationTaken === "no") medicationCounts.no += 1;
    else if (log.medicationTaken === "not-applicable") medicationCounts.notApplicable += 1;

    if (log.note && log.note.trim().length > 0) {
      parentNotesList.push({ date: log.date, text: log.note.trim() });
    }
  }

  // Food co-occurrence on discomfort days (A10a)
  // Discomfort days: bellyComfort 1 or 2
  const discomfortDatesSet = new Set<string>();
  dailyCheckIns.forEach((d) => {
    if (d.bellyComfort === 1 || d.bellyComfort === 2) {
      discomfortDatesSet.add(d.date);
    }
  });

  const foodTagCountsMap = new Map<string, number>();
  const discomfortDaysWithFoodSet = new Set<string>();

  for (const entry of inputs.foodEntries ?? []) {
    if (!discomfortDatesSet.has(entry.date)) continue;
    const tags = new Set<string>();

    if (Array.isArray(entry.tags)) {
      for (const t of entry.tags) {
        if (typeof t === "string" && t.trim().length > 0) tags.add(t.trim());
      }
    }
    if (typeof entry.text === "string" && entry.text.trim().length > 0) {
      tags.add(entry.text.trim());
    }

    if (tags.size > 0) {
      discomfortDaysWithFoodSet.add(entry.date);
      for (const tag of tags) {
        foodTagCountsMap.set(tag, (foodTagCountsMap.get(tag) ?? 0) + 1);
      }
    }
  }

  const foodsOnDiscomfortDays: FoodCooccurrenceItem[] = Array.from(foodTagCountsMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  const parentReportData: ParentReportData = {
    bathroom: {
      daytimeCount: daytimeBathroomCount,
      nighttimeCount: nighttimeBathroomCount,
      looserStools: looserStoolsDays.size > 0,
      bloodVisible: bloodVisibleDays.size > 0,
      looserStoolsDaysCount: looserStoolsDays.size,
      bloodVisibleDaysCount: bloodVisibleDays.size,
    },
    medicationAdherence: medicationCounts,
    foodsOnDiscomfortDays,
    discomfortDaysCount: discomfortDatesSet.size,
    discomfortDaysWithFoodCount: discomfortDaysWithFoodSet.size,
    notes: parentNotesList,
  };

  // 4. Consultation-to-consultation intervals (A14)
  const sortedConsultations = [...(inputs.consultations ?? [])].map((c) => c.date).sort();

  const lastConsultationDate = sortedConsultations.filter((d) => d <= endDate).pop() ?? null;
  const previousConsultations = sortedConsultations.filter((d) => d < (lastConsultationDate ?? ""));
  const previousConsultationDate = previousConsultations.pop() ?? null;

  // Determine periods P1 and P0
  const p1Dates: string[] = calendarDates;
  let p0Dates: string[] = [];
  let previousPeriodInfo: { startDate: string; endDate: string; calendarDays: number } | null =
    null;

  if (inputs.previousPeriod) {
    p0Dates = enumerateDatesList(inputs.previousPeriod.startDate, inputs.previousPeriod.endDate);
    previousPeriodInfo = {
      startDate: inputs.previousPeriod.startDate,
      endDate: inputs.previousPeriod.endDate,
      calendarDays: p0Dates.length,
    };
  } else if (lastConsultationDate && previousConsultationDate) {
    p0Dates = enumerateDatesList(addDaysKey(previousConsultationDate, 1), lastConsultationDate);
    previousPeriodInfo = {
      startDate: addDaysKey(previousConsultationDate, 1),
      endDate: lastConsultationDate,
      calendarDays: p0Dates.length,
    };
  }

  // Pre-index metric values for consultation comparison
  const allMetricsDateMap = new Map<string, DailyMetricInput>();
  for (const m of inputs.dailyMetrics ?? []) allMetricsDateMap.set(m.date, m);
  for (const m of inputs.previousPeriod?.dailyMetrics ?? []) allMetricsDateMap.set(m.date, m);

  function comparePeriodMetric(
    extractor: (date: string) => number | null,
    seedOffset: number,
  ): IntervalComparisonMetric {
    const p1Values: number[] = [];
    for (const d of p1Dates) {
      // Prefer cleaned/wearable value if available
      const wDay = wearableDays.find((w) => w.date === d);
      let v: number | null = null;
      if (wDay) {
        if (extractor === getSteps && wDay.validActivity) v = wDay.steps;
        else if (extractor === getHr && wDay.validSleep) v = wDay.nocturnalHr;
        else if (extractor === getSleep && wDay.validSleep) v = wDay.sleepMinutes;
      }
      if (v === null) v = extractor(d);
      if (v !== null) p1Values.push(v);
    }

    const p0Values: number[] = [];
    for (const d of p0Dates) {
      const v = extractor(d);
      if (v !== null) p0Values.push(v);
    }

    const p1Median = median(p1Values);
    const p0Median = median(p0Values);
    const p1N = p1Values.length;
    const p0N = p0Values.length;

    const baseResult: IntervalComparisonMetric = {
      period1Median: p1Median,
      period0Median: p0Median,
      period1N: p1N,
      period0N: p0N,
      difference: null,
      ci: null,
      status: "insufficient-data",
    };

    if (previousPeriodInfo === null || p0Dates.length === 0) {
      return { ...baseResult, reason: "no-previous-period" };
    }

    if (p0Dates.length === 0 || p1Dates.length === 0) {
      return {
        ...baseResult,
        reason: "need-valid-days",
        have: 0,
        need: MIN_CONSULTATION_COMPARISON_DAYS,
      };
    }

    // Constraint: length factor strictly less than 3
    const maxCal = Math.max(p0Dates.length, p1Dates.length);
    const minCal = Math.min(p0Dates.length, p1Dates.length);
    if (minCal === 0 || maxCal / minCal >= 3) {
      return {
        ...baseResult,
        reason: "length-factor",
        have: minCal,
        need: MIN_CONSULTATION_COMPARISON_DAYS,
      };
    }

    // Constraint: suppressing comparisons when n < 28 in either period
    if (p1N < MIN_CONSULTATION_COMPARISON_DAYS || p0N < MIN_CONSULTATION_COMPARISON_DAYS) {
      return {
        ...baseResult,
        reason: "need-valid-days",
        have: Math.min(p1N, p0N),
        need: MIN_CONSULTATION_COMPARISON_DAYS,
      };
    }

    // Compute difference and bootstrap 95% CI (2000 resamples)
    if (p1Median === null || p0Median === null) {
      return baseResult;
    }

    const diff = Math.round((p1Median - p0Median) * 10) / 10;
    const rng = mulberry32(seed + seedOffset);
    const diffs = new Array<number>(DEFAULT_BOOTSTRAP_REPLICATES);

    for (let i = 0; i < DEFAULT_BOOTSTRAP_REPLICATES; i += 1) {
      const resP1 = resample(p1Values, rng);
      const resP0 = resample(p0Values, rng);
      const m1 = median(resP1)!;
      const m0 = median(resP0)!;
      diffs[i] = m1 - m0;
    }

    const ci = percentileInterval(diffs);
    const roundedCi = ci
      ? {
          low: Math.round(ci.low * 10) / 10,
          high: Math.round(ci.high * 10) / 10,
        }
      : null;

    return {
      period1Median: p1Median,
      period0Median: p0Median,
      period1N: p1N,
      period0N: p0N,
      difference: diff,
      ci: roundedCi,
      status: "value",
    };
  }

  const getSteps = (date: string) => {
    const row = allMetricsDateMap.get(date);
    return row && typeof row.steps === "number" && (row.validActivity ?? true) ? row.steps : null;
  };
  const getHr = (date: string) => {
    const row = allMetricsDateMap.get(date);
    return row && typeof row.nocturnalRestingHr === "number" && (row.validSleep ?? true)
      ? row.nocturnalRestingHr
      : null;
  };
  const getSleep = (date: string) => {
    const row = allMetricsDateMap.get(date);
    return row && typeof row.sleepMinutes === "number" && (row.validSleep ?? true)
      ? row.sleepMinutes
      : null;
  };

  const consultationComparison: ConsultationIntervalsReport = {
    currentPeriod: {
      startDate: p1Dates[0] ?? startDate,
      endDate: p1Dates[p1Dates.length - 1] ?? endDate,
      calendarDays: p1Dates.length,
    },
    previousPeriod: previousPeriodInfo,
    metrics: {
      steps: comparePeriodMetric(getSteps, 1),
      nocturnalRestingHr: comparePeriodMetric(getHr, 2),
      sleepDuration: comparePeriodMetric(getSleep, 3),
    },
  };

  // 5. Co-occurrence table (A7)
  // Cross-table of previous-night sleep duration and steps (lag 1) vs next-day discomfort/energy (lag 0)
  type CooccPairDef = {
    predictorKey: "sleepDuration" | "steps";
    targetKey: "bellyComfort" | "energy";
  };

  const pairsToCompute: CooccPairDef[] = [
    { predictorKey: "sleepDuration", targetKey: "bellyComfort" },
    { predictorKey: "sleepDuration", targetKey: "energy" },
    { predictorKey: "steps", targetKey: "bellyComfort" },
    { predictorKey: "steps", targetKey: "energy" },
  ];

  const cooccurrenceCells: CooccurrenceCell[] = pairsToCompute.map((pDef, cellIdx) => {
    const xs: number[] = [];
    const ys: number[] = [];

    // Pair day t-1 predictor with day t target
    for (let t = 1; t < calendarDates.length; t += 1) {
      const prevDate = calendarDates[t - 1];
      const currDate = calendarDates[t];

      const prevWearable = wearableDays.find((w) => w.date === prevDate);
      const currCheckIn = dailyCheckIns.find((c) => c.date === currDate);

      let xVal: number | null = null;
      if (pDef.predictorKey === "sleepDuration" && prevWearable?.validSleep) {
        xVal = prevWearable.sleepMinutes;
      } else if (pDef.predictorKey === "steps" && prevWearable?.validActivity) {
        xVal = prevWearable.steps;
      }

      let yVal: number | null = null;
      if (currCheckIn) {
        const rawY = currCheckIn[pDef.targetKey];
        if (rawY === 0 || rawY === 1 || rawY === 2) {
          yVal = rawY;
        }
      }

      if (xVal !== null && yVal !== null) {
        xs.push(xVal);
        ys.push(yVal);
      }
    }

    const n = xs.length;
    if (n < MIN_COOCCURRENCE_PAIRS) {
      return {
        predictor: pDef.predictorKey,
        target: pDef.targetKey,
        n,
        rho: null,
        ci: null,
        status: "insufficient-data",
        have: n,
        need: MIN_COOCCURRENCE_PAIRS,
      };
    }

    const rho = spearman(xs, ys);
    if (rho === null) {
      return {
        predictor: pDef.predictorKey,
        target: pDef.targetKey,
        n,
        rho: null,
        ci: null,
        status: "insufficient-data",
        have: n,
        need: MIN_COOCCURRENCE_PAIRS,
      };
    }

    // Bootstrap 95% CI on pairs
    const rng = mulberry32(seed + 100 + cellIdx);
    const resampledRhos = new Array<number>(DEFAULT_BOOTSTRAP_REPLICATES);
    const indices = Array.from({ length: n }, (_, i) => i);

    for (let r = 0; r < DEFAULT_BOOTSTRAP_REPLICATES; r += 1) {
      const idxs = resample(indices, rng);
      const resX = idxs.map((i) => xs[i]);
      const resY = idxs.map((i) => ys[i]);
      resampledRhos[r] = spearman(resX, resY) ?? 0;
    }

    const ci = percentileInterval(resampledRhos);
    const roundedCi = ci
      ? {
          low: Math.round(ci.low * 100) / 100,
          high: Math.round(ci.high * 100) / 100,
        }
      : null;

    return {
      predictor: pDef.predictorKey,
      target: pDef.targetKey,
      n,
      rho: Math.round(rho * 100) / 100,
      ci: roundedCi,
      status: "value",
    };
  });

  // Check for any noteworthy co-occurrence for narrative summary
  const significantCell = cooccurrenceCells.find(
    (c) => c.status === "value" && c.rho !== null && Math.abs(c.rho) >= 0.4,
  );
  let cooccurrenceNarrative: string | null = null;
  if (significantCell) {
    const predLabel =
      significantCell.predictor === "sleepDuration" ? "sleep duration" : "daily steps";
    const targetLabel =
      significantCell.target === "bellyComfort" ? "tummy discomfort" : "energy level";
    cooccurrenceNarrative = `Previous-night ${predLabel} co-occurred with next-day ${targetLabel}: Spearman ρ = ${significantCell.rho} (95% CI ${significantCell.ci?.low} to ${significantCell.ci?.high}, n = ${significantCell.n} paired days). Descriptive co-occurrence only; direction of influence is not established.`;
  }

  const cooccurrenceTable: CooccurrenceTableReport = {
    cells: cooccurrenceCells,
    narrative: cooccurrenceNarrative,
  };

  // 6. Footnotes & Disclaimers
  const hampelSpikesFootnote =
    cleanedSpikesCount > 0
      ? `Hampel filter replaced ${cleanedSpikesCount} single-day reading${
          cleanedSpikesCount === 1 ? "" : "s"
        } by the surrounding median because they were far outside the rest of the week (${stepsSpikes} steps, ${restingHrSpikes} heart rate).`
      : "No single-day sensor spikes required Hampel filtering.";

  const demoDisclaimer =
    "Demo data — fictional patient data for demonstration only. Not for clinical decision-making.";

  const footnotesAndDisclaimers: FootnoteAndDisclaimers = {
    hampelSpikesFootnote,
    cleanedSpikesCount,
    spikesDetails: {
      stepsSpikes,
      restingHrSpikes,
    },
    demoDisclaimer,
    clinicalDisclaimer: REPORT_DISCLAIMER,
    isDemo,
  };

  return {
    generatedDate,
    childNickname,
    period: {
      startDate,
      endDate,
      calendarDays,
      previousConsultationDate,
    },
    smartwatch: smartwatchMetrics,
    childCheckIn: childCheckInReport,
    parentLogs: parentReportData,
    consultationComparison,
    cooccurrenceTable,
    footnotesAndDisclaimers,
  };
}
