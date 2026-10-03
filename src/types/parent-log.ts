import type { DateKey } from "./check-in";

export type ActivityLevel = "none" | "light" | "moderate" | "high";
export type SchoolDay = "attended" | "left-early" | "missed" | "no-school";
/** Yes/no only. Never store drug names or doses. */
export type MedicationTaken = "yes" | "partly" | "no" | "not-applicable";

/** One entry per day, written in parent mode. */
export type ParentLog = {
  date: DateKey;
  sleepHours?: number;
  activity?: ActivityLevel;
  school?: SchoolDay;
  medicationTaken?: MedicationTaken;
  note?: string;
};

/** Reactive food diary: written by a parent, usually after the child marked discomfort. */
export type FoodEntry = {
  id: string;
  date: DateKey;
  /** Free text as written by the parent. */
  text: string;
  /** Set when the entry was prompted by a check-in with discomfort. */
  relatedCheckInId?: string;
  createdAt: string;
};

export type Consultation = {
  id: string;
  date: DateKey;
};
