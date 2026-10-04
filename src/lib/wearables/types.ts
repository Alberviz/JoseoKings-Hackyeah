export type WearableMetric =
  | "steps"
  | "heart_rate"
  | "active_minutes"
  | "calories"
  | "distance"
  | "spo2"
  | "sleep_session"
  | "sleep_segment";

export type SleepStage = "awake" | "sleep" | "out_of_bed" | "light" | "deep" | "rem" | string;

export interface WatchSampleRow {
  id?: number;
  subject_id: string;
  metric: WearableMetric;
  start_at: string;
  end_at: string;
  value: number;
  value_max?: number | null;
  value_min?: number | null;
  stage?: SleepStage | null;
  source: string;
  ingested_at?: string;
}

export interface CollectorRunRow {
  id?: number;
  subject_id: string;
  started_at: string;
  window_start: string;
  window_end: string;
  rows_written: number;
  counts: Record<string, number>;
  errors: Record<string, string>;
}

export interface CheckinRow {
  id?: number;
  subject_id: string;
  local_date: string;
  belly_comfort: number | null;
  energy: number | null;
  play_pace: number | null;
  skipped: boolean;
  answered_at: string;
}

export interface ParentLogRow {
  id?: number;
  subject_id: string;
  local_date: string;
  sleep_hours?: number | null;
  school?: "attended" | "left-early" | "missed" | "no-school" | null;
  medication_taken?: "yes" | "partly" | "no" | "not-applicable" | null;
  note?: string | null;
  created_at?: string;
}

export interface ParentObservationRow {
  id?: number;
  subject_id: string;
  observed_at: string;
  local_date: string;
  kind: string;
  value_num?: number | null;
  value_text?: string | null;
  created_at?: string;
}

export interface MissionDoneRow {
  id?: number;
  subject_id: string;
  done_at: string;
  local_date: string;
  mission_id: string;
  company: "alone" | "someone" | "family";
  stopped_early: boolean;
}

export interface FoodEntryRow {
  id?: number;
  subject_id: string;
  local_date: string;
  tags: string[];
  text?: string | null;
  created_at?: string;
}

export interface ConsultationRow {
  id?: number;
  subject_id: string;
  local_date: string;
}

export interface DailyMetricRow {
  subject_id: string;
  local_date: string;
  steps: number | null;
  hr_waking_hours_covered: number | null;
  resting_hr: number | null;
  sleep_minutes: number | null;
  sleep_onset_at: string | null;
  sleep_offset_at: string | null;
  valid_activity: boolean;
  valid_sleep: boolean;
  computed_at?: string;
  algorithm_version: string;
}

export interface AnalysisRunRow {
  id?: number;
  subject_id: string;
  run_at?: string;
  period_start: string;
  period_end: string;
  algorithm_version: string;
  seed: number;
  params: Record<string, unknown>;
  results: Record<string, unknown>;
}

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
