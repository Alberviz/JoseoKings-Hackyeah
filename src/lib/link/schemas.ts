// Validation of everything that arrives through a camera or a paste box. Reuses the storage schemas
// for the records so the two apps never disagree about a shape.

import { z } from "zod";
import { checkInSchema, dateKeySchema, missionLogSchema } from "@/lib/storage/schemas";
import {
  LINK_VERSION,
  type LinkRewardClaim,
  type PairingPayload,
  type SharePayload,
} from "./types";
import type { LinkSpecialReward } from "./types";

/** Reward labels are short on purpose: they travel in a QR and show on a child's screen. */
export const SPECIAL_REWARD_LABEL_MAX = 40;
export const SPECIAL_REWARD_FIRE_MIN = 1;
export const SPECIAL_REWARD_FIRE_MAX = 100;
export const SPECIAL_REWARDS_MAX = 8;

export const linkSpecialRewardSchema: z.ZodType<LinkSpecialReward> = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(SPECIAL_REWARD_LABEL_MAX),
  fireCost: z.number().int().min(SPECIAL_REWARD_FIRE_MIN).max(SPECIAL_REWARD_FIRE_MAX),
});

export const linkRewardClaimSchema: z.ZodType<LinkRewardClaim> = z.object({
  id: z.string().min(1),
  rewardId: z.string().min(1),
  date: dateKeySchema,
  status: z.enum(["requested", "done"]),
  doneDate: dateKeySchema.optional(),
});

export const pairingPayloadSchema: z.ZodType<PairingPayload> = z.object({
  v: z.literal(LINK_VERSION),
  familyId: z.string().min(1),
  keyB64: z.string().min(1),
  nickname: z.string(),
  allowedMissionIds: z.array(z.string()),
  specialRewards: z.array(linkSpecialRewardSchema).max(SPECIAL_REWARDS_MAX),
  createdAt: z.string(),
});

export const sharePayloadSchema: z.ZodType<SharePayload> = z.object({
  v: z.literal(LINK_VERSION),
  familyId: z.string().min(1),
  from: dateKeySchema,
  to: dateKeySchema,
  checkIns: z.array(checkInSchema),
  missionLogs: z.array(missionLogSchema),
  rewardClaims: z.array(linkRewardClaimSchema),
});
