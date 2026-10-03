import type { ActivityLevel, DateKey, MedicationTaken, SchoolDay } from "@/types";

export type CheckInStatus = "answered" | "not-today" | "none";

export type DaySummaryMissions = {
  completed: number;
  rest: number;
  byCompany: {
    alone: number;
    family: number;
    other: number;
  };
};

export type DaySummary = {
  date: DateKey;
  checkInStatus: CheckInStatus;
  bellyComfort: number | null;
  energy: number | null;
  playPace: number | null;
  dayLevel: number | null;
  hasDiscomfort: boolean;
  sleepHours: number | null;
  activity: ActivityLevel | null;
  school: SchoolDay | null;
  medicationTaken: MedicationTaken | null;
  missions: DaySummaryMissions;
};

export type WeekSummary = {
  weekStart: DateKey;
  answeredDays: number;
  bellyComfort: number | null;
  energy: number | null;
  playPace: number | null;
  sleepHours: number | null;
};

export type DateRange = {
  from: DateKey;
  to: DateKey;
};

export type FoodCooccurrenceEntry = {
  date: DateKey;
  text: string;
};

export type FoodTermCount = {
  term: string;
  days: number;
  count: number;
};

export type FoodCooccurrence = {
  entries: FoodCooccurrenceEntry[];
  termCounts: FoodTermCount[];
};

export type EnoughDataResult = {
  enough: boolean;
  answeredDays: number;
};

export type ActiveDays = {
  alone: number;
  family: number;
  other: number;
};
