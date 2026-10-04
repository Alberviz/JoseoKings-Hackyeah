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

/** One day of valid watch values; null when the watch has no trusted value. */
export type WatchDailyPoint = {
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

export type CorroborationMethod = "watch" | "motion" | "none";

export type MissionCorroborationCount = {
  method: CorroborationMethod;
  label: string;
  count: number;
};

export type WatchMetricSummary = {
  /** Valid days that fed this metric. */
  n: number;
  median: number | null;
  q1: number | null;
  q3: number | null;
};

export type WatchReportSection = {
  /** Always says the numbers were measured by the watch, for example "From the watch (Google Health)". */
  source: string;
  /** Labels of the devices the numbers came from, for example "Watch · Fitbit Charge 6". */
  deviceLabels: string[];
  /** Where the resting heart rate came from: our night readings, the watch's own daily value, or both. */
  restingHrSource: "night-samples" | "watch-daily" | "mixed" | null;
  isDemo: boolean;
  /** Days in the period with at least one valid watch value. */
  validDays: number;
  steps: WatchMetricSummary;
  /** Resting heart rate, beats per minute (see restingHrSource). */
  restingHr: WatchMetricSummary;
  sleepHours: WatchMetricSummary;
  /** One point per day of the period, for the charts. */
  series: WatchDailyPoint[];
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
      watch: number;
      motion: number;
      none: number;
    };
  };
  foodsOnDiscomfortDays: FoodCooccurrence[];
  /** Spearman rows for the clinician: only pairs with enough days. */
  crossComparison: CrossComparisonRow[];
  watch: WatchReportSection;
  observed: ObservedSection;
  dayStrip: DayStripEntry[];
  disclaimer: string;
};
