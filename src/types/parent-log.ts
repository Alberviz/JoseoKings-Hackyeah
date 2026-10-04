import type { DateKey } from "./check-in";

export type ActivityLevel = "none" | "light" | "moderate" | "high";
export type SchoolDay = "attended" | "left-early" | "missed" | "no-school";
/** Yes/no only. Never store drug names or doses. */
export type MedicationTaken = "yes" | "partly" | "no" | "not-applicable";

/** Stool frequency observed or known by the parent. */
export type StoolFrequency = "typical" | "more" | "much-more" | "unknown";
/** Nighttime bowel movement (child woke up at night). */
export type StoolNight = "yes" | "no" | "unknown";
/** Stool consistency (simple descriptive, no Bristol scale). */
export type StoolConsistency = "formed" | "looser" | "watery" | "unknown";
/** Visible blood observed. */
export type StoolBlood = "none" | "visible" | "unknown";

/** One entry per day, written in parent mode. */
export type ParentLog = {
  date: DateKey;
  sleepHours?: number;
  activity?: ActivityLevel;
  school?: SchoolDay;
  medicationTaken?: MedicationTaken;
  stoolFrequency?: StoolFrequency;
  stoolNight?: StoolNight;
  stoolConsistency?: StoolConsistency;
  stoolBlood?: StoolBlood;
  daytimeBathroomCount?: number;
  nighttimeBathroomCount?: number;
  looserStools?: boolean;
  bloodVisible?: boolean;
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
