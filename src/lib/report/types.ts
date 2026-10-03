import type { DateKey, MissionCompany } from "@/types";

export type DayStripEntry = {
  date: DateKey;
  hasCheckIn: boolean;
  notToday: boolean;
  bellyPain: number | null;
  bathroom: number | null;
  energy: number | null;
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
  dayStrip: DayStripEntry[];
  disclaimer: string;
};
