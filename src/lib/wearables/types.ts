export type WearableMetric =
  | "steps"
  | "heartRate"
  | "activeMinutes"
  | "calories"
  | "distance"
  | "spo2"
  | "sleepSession"
  | "sleepSegment";

export type SleepStage = "awake" | "sleep" | "outOfBed" | "light" | "deep" | "rem" | string;

/** One raw reading from the watch, kept in memory on the device. */
export type WatchSample = {
  metric: WearableMetric;
  startAt: string;
  endAt: string;
  value: number;
  valueMax?: number | null;
  valueMin?: number | null;
  stage?: SleepStage | null;
  source: string;
};

/** Per-day figures computed on the device from the raw watch samples. */
export type DailyMetric = {
  localDate: string;
  steps: number | null;
  hrWakingHoursCovered: number | null;
  restingHr: number | null;
  sleepMinutes: number | null;
  sleepOnsetAt: string | null;
  sleepOffsetAt: string | null;
  validActivity: boolean;
  validSleep: boolean;
  computedAt?: string;
  algorithmVersion: string;
};

// Algorithm types
export type CheckInScore = 0 | 1 | 2 | "notToday" | null;

export interface HeartRateSample {
  timestamp: number;
  bpm: number;
}

export interface SleepSession {
  start: number;
  end: number;
  segments?: unknown[];
}

export interface SleepSessionInput {
  start: number;
  end: number;
}

export interface CheckInAnswers {
  bellyComfort?: unknown;
  energy?: unknown;
  playPace?: unknown;
}

export interface MainSleepSummary {
  start: number;
  end: number;
  durationMin: number;
  onsetOk: boolean;
  offsetOk: boolean;
  hrSamples: number;
  coveredMinutes: number;
  midpointTimestamp?: number;
  midpointClockMinutes?: number;
  midpointFormatted?: string;
}

export interface DayAssessment {
  day: string;
  timeZone: string;
  dayLengthHours: number;
  dstShift: boolean;
  daytimeHours: number;
  daytimeValid: boolean;
  nightValid: boolean;
  mainSleep: MainSleepSummary | null;
  checkInValid: boolean;
  notToday: boolean;
  items: {
    bellyComfort: CheckInScore;
    energy: CheckInScore;
    playPace: CheckInScore;
  };
}

export type RangeBand = "below" | "within" | "above";

export type BaselineResult =
  | {
      kind: "insufficient-data";
      reason: "collecting-baseline" | "zero-scale";
      have: number;
      need: number;
    }
  | {
      kind: "value";
      median: number;
      q1: number;
      q3: number;
      iqr: number;
      s: number;
      d: number;
      band: RangeBand;
    };

export type NocturnalRestingHrResult =
  | {
      kind: "insufficient-data";
      have: number;
      need: number;
      nRhr: null;
      qualifyingWindows?: number;
      coveredMinutes?: number;
    }
  | {
      kind: "value";
      nRhr: number;
      nHrMean: number | null;
      coveredMinutes: number;
      qualifyingWindows: number;
    };

export interface ItemCounts {
  0: number;
  1: number;
  2: number;
  notAnswered: number;
}

export interface PeriodCountsResult {
  calendarDays: number;
  answeredDays: number;
  notTodayDays: number;
  steadyDays: number;
  comfortDays: number;
  discomfortDays: number;
  longestSteadyRun: {
    length: number;
    startIndex: number | null;
    endIndex: number | null;
  };
  longestComfortRun: {
    length: number;
    startIndex: number | null;
    endIndex: number | null;
  };
  items: {
    bellyComfort: ItemCounts;
    energy: ItemCounts;
    playPace: ItemCounts;
  };
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

export interface EnergyTally {
  n: number;
  counts: { 0: number; 1: number; 2: number };
  median: number | null;
}

export interface MissionsVsEnergyResult {
  kind: "value" | "insufficient-data";
  have: number;
  need: number;
  mission: EnergyTally;
  none: EnergyTally;
  difference: number | null;
  ci: { low: number; high: number } | null;
  seed: number | null;
}

export interface ConsultationPeriodSummary {
  calendarDays: number;
  n: number;
  median: number | null;
  iqr: number | null;
}

export interface ConsultationComparisonResult {
  period1: ConsultationPeriodSummary;
  period0: ConsultationPeriodSummary | null;
  comparison:
    | {
        kind: "insufficient-data";
        reason: string;
        have: number;
        need: number;
        difference: null;
        ci: null;
      }
    | {
        kind: "value";
        difference: number;
        ci: { low: number; high: number };
        seed: number;
      };
}
