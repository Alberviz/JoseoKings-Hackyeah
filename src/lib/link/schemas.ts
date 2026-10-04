// Validation of everything that arrives through a camera or a paste box. Reuses the storage schemas
// for the records so the two apps never disagree about a shape.

import { z } from "zod";
import { checkInSchema, dateKeySchema, missionLogSchema } from "@/lib/storage/schemas";
import { FAMILY_KEY_BYTES } from "./crypto";
import { fromBase64Url } from "./bytes";
import {
  LINK_VERSION,
  type LinkRewardClaim,
  type PairingPayload,
  type SharePayload,
} from "./types";
import type { LinkSpecialReward } from "./types";

/** Reward names are short on purpose: they travel in a QR and show on a child's screen. */
export const SPECIAL_REWARD_NAME_MAX = 40;
export const SPECIAL_REWARD_FIRE_MIN = 1;
export const SPECIAL_REWARD_FIRE_MAX = 100;
export const SPECIAL_REWARDS_MAX = 8;

/** Pairing payload size limits so the code usually fits in one QR scan. */
export const PAIRING_NICKNAME_MAX = 32;
export const PAIRING_FAMILY_ID_MAX = 16;
export const PAIRING_MISSION_ID_MAX = 64;
export const PAIRING_MISSIONS_MAX = 32;

const familyKeyB64Schema = z
  .string()
  .min(1)
  .superRefine((value, ctx) => {
    try {
      if (fromBase64Url(value).length !== FAMILY_KEY_BYTES) {
        ctx.addIssue({ code: "custom", message: "Family key must decode to 16 bytes." });
      }
    } catch {
      ctx.addIssue({ code: "custom", message: "Family key is not valid base64url." });
    }
  });

export const linkSpecialRewardSchema: z.ZodType<LinkSpecialReward> = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(SPECIAL_REWARD_NAME_MAX),
  fireCost: z.number().int().min(SPECIAL_REWARD_FIRE_MIN).max(SPECIAL_REWARD_FIRE_MAX),
});

export const linkRewardClaimSchema: z.ZodType<LinkRewardClaim> = z.object({
  id: z.string().min(1),
  rewardId: z.string().min(1),
  date: dateKeySchema,
  createdAt: z.string(),
  status: z.enum(["requested", "done"]),
  doneAt: dateKeySchema.optional(),
});

export const pairingPayloadSchema: z.ZodType<PairingPayload> = z.strictObject({
  v: z.literal(LINK_VERSION),
  familyId: z.string().min(1).max(PAIRING_FAMILY_ID_MAX),
  keyB64: familyKeyB64Schema,
  nickname: z.string().max(PAIRING_NICKNAME_MAX),
  allowedMissionIds: z.array(z.string().max(PAIRING_MISSION_ID_MAX)).max(PAIRING_MISSIONS_MAX),
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
