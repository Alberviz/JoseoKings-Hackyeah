import { z } from "zod";
import {
  FIRE_MAX,
  SPECIAL_REWARD_COST_MAX,
  SPECIAL_REWARD_COST_MIN,
  SPECIAL_REWARD_NAME_MAX_LENGTH,
} from "@/config/economy";
import { isDateKey } from "@/lib/dates";
import { createDefaultEconomy } from "@/lib/economy";
import type {
  ActivityLevel,
  AppState,
  CheckIn,
  CheckInAnswer,
  ChildProfile,
  CompanionState,
  Consultation,
  DateKey,
  EconomyState,
  FoodEntry,
  MedicationTaken,
  MissionCompany,
  MissionConfirmation,
  MissionLog,
  MissionMoodAfter,
  MissionMoodBefore,
  MissionStatus,
  ParentLog,
  ParentSettings,
  SchoolDay,
  RewardClaim,
  SpecialReward,
} from "@/types";

export const childProfileSchema: z.ZodType<ChildProfile> = z.object({
  nickname: z.string(),
});

export const parentSettingsSchema: z.ZodType<ParentSettings> = z.object({
  pinHash: z.string(),
  pinSalt: z.string(),
  allowedMissionIds: z.array(z.string()),
  deviceRole: z.enum(["child", "parent", "both"]).optional(),
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

export const missionMoodBeforeSchema: z.ZodType<MissionMoodBefore> = z.enum([
  "calm",
  "strong",
  "amazing",
]);

export const missionMoodAfterSchema: z.ZodType<MissionMoodAfter> = z.enum([
  "exhausted",
  "chill",
  "great",
]);

export const missionLogSchema: z.ZodType<MissionLog> = z.object({
  id: z.string(),
  date: dateKeySchema,
  missionId: z.string(),
  status: missionStatusSchema,
  company: missionCompanySchema,
  confirmedBy: missionConfirmationSchema,
  createdAt: z.string(),
  moodBefore: missionMoodBeforeSchema.optional(),
  moodAfter: missionMoodAfterSchema.optional(),
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

export const shopItemIdSchema = z.enum(["food", "glasses", "t-shirt", "hat"]);

export const specialRewardSchema: z.ZodType<SpecialReward> = z.object({
  id: z.string(),
  name: z.string().min(1).max(SPECIAL_REWARD_NAME_MAX_LENGTH),
  fireCost: z.number().int().min(SPECIAL_REWARD_COST_MIN).max(SPECIAL_REWARD_COST_MAX),
});

export const rewardClaimSchema: z.ZodType<RewardClaim> = z.object({
  id: z.string(),
  rewardId: z.string(),
  date: dateKeySchema,
  createdAt: z.string(),
  status: z.enum(["requested", "done"]),
  doneAt: dateKeySchema.optional(),
});

/** Old saves have no economy, and corrupt economy data resets to defaults without touching the rest. */
export const economyStateSchema: z.ZodType<EconomyState> = z
  .object({
    fire: z.number().int().min(0).max(FIRE_MAX),
    highestFire: z.number().int().min(0).max(FIRE_MAX).optional(),
    coinsSpent: z.number().int().nonnegative(),
    inventory: z.object({ food: z.number().int().nonnegative() }),
    ownedItemIds: z.array(shopItemIdSchema),
    equippedItemIds: z.array(shopItemIdSchema),
    specialRewards: z.array(specialRewardSchema),
    rewardClaims: z.array(rewardClaimSchema),
  })
  .catch(() => createDefaultEconomy());

export const appStateSchema: z.ZodType<AppState> = z.object({
  schemaVersion: z.literal(1),
  isDemo: z.boolean(),
  child: childProfileSchema.nullable(),
  settings: parentSettingsSchema.nullable(),
  companion: companionStateSchema,
  economy: economyStateSchema,
  checkIns: z.array(checkInSchema),
  missionLogs: z.array(missionLogSchema),
  parentLogs: z.array(parentLogSchema),
  foodEntries: z.array(foodEntrySchema),
  consultations: z.array(consultationSchema),
});
