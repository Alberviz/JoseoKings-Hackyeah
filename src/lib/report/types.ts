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

export type WatchMetricSummary = {
  /** Valid days that fed this metric. */
  n: number;
  median: number | null;
  q1: number | null;
  q3: number | null;
};

export type WatchReportSection = {
  source: "Watch";
  isDemo: boolean;
  /** Days in the period with at least one valid watch value. */
  validDays: number;
  steps: WatchMetricSummary;
  /** Nocturnal resting heart rate, beats per minute. */
  restingHr: WatchMetricSummary;
  sleepHours: WatchMetricSummary;
};

/** Day counts from the parent log. Never scores, never causes. */
export type ObservedSection = {
  loggedDays: number;
  school: { attended: number; leftEarly: number; missed: number; noSchool: number };
  medication: { yes: number; partly: number; no: number; notApplicable: number };
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
  };
  foodsOnDiscomfortDays: FoodCooccurrence[];
  watch: WatchReportSection;
  observed: ObservedSection;
  dayStrip: DayStripEntry[];
  disclaimer: string;
};
