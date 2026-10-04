import type { DateKey, MissionCompany } from "@/types";

export type DayStripEntry = {
  date: DateKey;
  hasCheckIn: boolean;
  notToday: boolean;
  bellyComfort: number | null;
  energy: number | null;
  playPace: number | null;
  hadMissions: boolean;
  hadDiscomfort: boolean;
  hasParentLog: boolean;
  sleepHours?: number;
  /** Set only on days with a parent log. */
  schoolImpacted?: boolean;
  daytimeBathroomCount?: number;
  nighttimeBathroomCount?: number;
  looserStools?: boolean;
  bloodVisible?: boolean;
};

/** One day of valid wearable values; null when the wearable has no trusted value. */
export type WearableDailyPoint = {
  date: DateKey;
  steps: number | null;
  restingHr: number | null;
  sleepHours: number | null;
};

export type CrossComparisonRow = {
  /** Who entered the signal. */
  source: "Child" | "Family";
  signal: string;
  metric: string;
  /** Days with both values. */
  n: number;
  /** Spearman rank correlation. */
  rho: number;
  /** 95% bootstrap interval of rho. */
  low: number;
  high: number;
};

export type FoodCooccurrence = {
  text: string;
  count: number;
};

export type ActivityConfidenceCount = {
  company: MissionCompany;
  label: string;
  count: number;
};

export type CorroborationMethod = "wearable" | "motion" | "none";

export type MissionCorroborationCount = {
  method: CorroborationMethod;
  label: string;
  count: number;
};

export type WearableMetricSummary = {
  /** Valid days that fed this metric. */
  n: number;
  median: number | null;
  q1: number | null;
  q3: number | null;
};

export type WearableReportSection = {
  /** Always says the numbers were measured by the wearable, for example "From the wearable (Google Health)". */
  source: string;
  /** Labels of the devices the numbers came from, for example "Wearable · Fitbit Charge 6". */
  deviceLabels: string[];
  /** Where the resting heart rate came from: our night readings, the wearable's own daily value, or both. */
  restingHrSource: "night-samples" | "wearable-daily" | "mixed" | null;
  /** Nights with a night-time heart-rate figure, by the method that made it (wearable-reported days are not counted). */
  restingHrNights: { dense: number; sparse: number };
  /** Median minutes between the wearable's heart-rate readings during sleep on the sparse-method nights; null when there are none. */
  sparseGapMin: number | null;
  /** Short text for the figure itself, for example "lowest average of 3 readings in a row (wearable recorded about every 30 min)"; null without a night-time figure. */
  restingHrMethodText: string | null;
  /** The "How the wearable figures are made" note, one paragraph per entry. */
  methodNote: string[];
  isDemo: boolean;
  /** Days in the period with at least one valid wearable value. */
  validDays: number;
  steps: WearableMetricSummary;
  /** Resting heart rate, beats per minute (see restingHrSource). */
  restingHr: WearableMetricSummary;
  sleepHours: WearableMetricSummary;
  /** One point per day of the period, for the charts. */
  series: WearableDailyPoint[];
};

export type BathroomObservedSummary = {
  totalDaytime: number;
  totalNighttime: number;
  totalVisits: number;
  avgDaytimePerDay: number | null;
  avgNighttimePerDay: number | null;
  avgVisitsPerDay: number | null;
  daysWithLooserStools: number;
  daysWithBloodVisible: number;
  daysLogged: number;
};

/** Day counts from the parent log. Never scores, never causes. */
export type ObservedSection = {
  loggedDays: number;
  school: { attended: number; leftEarly: number; missed: number; noSchool: number };
  medication: { yes: number; partly: number; no: number; notApplicable: number };
  bathroom: BathroomObservedSummary;
};

export type DoctorReportData = {
  childNickname: string;
  isDemo: boolean;
  generatedDate: DateKey;
  period: {
    startDate: DateKey;
    endDate: DateKey;
    totalDays: number;
    previousConsultationDate: DateKey | null;
    nextAppointmentDate?: DateKey | null;
  };
  metrics: {
    checkInDaysCount: number;
    checkInCompletionRate: number;
    careDaysCount: number;
    discomfortDaysCount: number;
    avgSleepHours: number | null;
    sleepRecordedDaysCount: number;
    schoolImpactedDaysCount: number;
  };
  activity: {
    totalMissionsCompleted: number;
    byConfidence: ActivityConfidenceCount[];
    byCorroboration: MissionCorroborationCount[];
    corroborationTotals: {
      wearable: number;
      motion: number;
      none: number;
    };
  };
  foodsOnDiscomfortDays: FoodCooccurrence[];
  /** Spearman rows for the clinician: only pairs with enough days. */
  crossComparison: CrossComparisonRow[];
  wearable: WearableReportSection;
  observed: ObservedSection;
  dayStrip: DayStripEntry[];
  disclaimer: string;
};
