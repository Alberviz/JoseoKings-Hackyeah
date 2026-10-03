import { z } from "zod";
import { isDateKey } from "@/lib/dates";
import type {
  ActivityLevel,
  AppState,
  CheckIn,
  CheckInAnswer,
  ChildProfile,
  CompanionState,
  Consultation,
  DateKey,
  FoodEntry,
  MedicationTaken,
  MissionCompany,
  MissionConfirmation,
  MissionLog,
  MissionStatus,
  ParentLog,
  ParentSettings,
  SchoolDay,
} from "@/types";

export const childProfileSchema: z.ZodType<ChildProfile> = z.object({
  nickname: z.string(),
});

export const parentSettingsSchema: z.ZodType<ParentSettings> = z.object({
  pinHash: z.string(),
  pinSalt: z.string(),
  allowedMissionIds: z.array(z.string()),
});

export const companionStateSchema: z.ZodType<CompanionState> = z.object({
  name: z.string(),
  points: z.number().int().nonnegative(),
  teamStars: z.number().int().nonnegative(),
  ownedItemIds: z.array(z.string()),
  equippedItemIds: z.array(z.string()),
  badgeIds: z.array(z.string()),
});

export const checkInAnswerSchema: z.ZodType<CheckInAnswer> = z.union([
  z.number(),
  z.literal("skipped"),
]);

export const dateKeySchema: z.ZodType<DateKey> = z.string().refine(isDateKey, {
  message: "Invalid date format (must be YYYY-MM-DD calendar date)",
});

export const checkInSchema: z.ZodType<CheckIn> = z.object({
  id: z.string(),
  date: dateKeySchema,
  answers: z.record(z.string(), checkInAnswerSchema),
  notToday: z.boolean(),
  childNote: z.string().optional(),
  createdAt: z.string(),
});

export const missionStatusSchema: z.ZodType<MissionStatus> = z.enum(["completed", "rest"]);

export const missionCompanySchema: z.ZodType<MissionCompany> = z.enum(["alone", "family", "other"]);

export const missionConfirmationSchema: z.ZodType<MissionConfirmation> = z.enum([
  "child",
  "parent-pin",
  "other-tap",
]);

export const missionLogSchema: z.ZodType<MissionLog> = z.object({
  id: z.string(),
  date: dateKeySchema,
  missionId: z.string(),
  status: missionStatusSchema,
  company: missionCompanySchema,
  confirmedBy: missionConfirmationSchema,
  createdAt: z.string(),
});

export const activityLevelSchema: z.ZodType<ActivityLevel> = z.enum([
  "none",
  "light",
  "moderate",
  "high",
]);

export const schoolDaySchema: z.ZodType<SchoolDay> = z.enum([
  "attended",
  "left-early",
  "missed",
  "no-school",
]);

export const medicationTakenSchema: z.ZodType<MedicationTaken> = z.enum([
  "yes",
  "partly",
  "no",
  "not-applicable",
]);

export const parentLogSchema: z.ZodType<ParentLog> = z.object({
  date: dateKeySchema,
  sleepHours: z.number().min(0).max(24).optional(),
  activity: activityLevelSchema.optional(),
  school: schoolDaySchema.optional(),
  medicationTaken: medicationTakenSchema.optional(),
  note: z.string().optional(),
});

export const foodEntrySchema: z.ZodType<FoodEntry> = z.object({
  id: z.string(),
  date: dateKeySchema,
  text: z.string(),
  relatedCheckInId: z.string().optional(),
  createdAt: z.string(),
});

export const consultationSchema: z.ZodType<Consultation> = z.object({
  id: z.string(),
  date: dateKeySchema,
});

export const appStateSchema: z.ZodType<AppState> = z.object({
  schemaVersion: z.literal(1),
  isDemo: z.boolean(),
  child: childProfileSchema.nullable(),
  settings: parentSettingsSchema.nullable(),
  companion: companionStateSchema,
  checkIns: z.array(checkInSchema),
  missionLogs: z.array(missionLogSchema),
  parentLogs: z.array(parentLogSchema),
  foodEntries: z.array(foodEntrySchema),
  consultations: z.array(consultationSchema),
});
