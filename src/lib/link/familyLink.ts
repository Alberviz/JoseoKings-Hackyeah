// The family link saved on each phone after pairing: who this phone is linked to and the key that
// protects the data codes. Kept in its own localStorage entry so the app state stays untouched.
// The key never leaves the phone except inside the pairing code the parents show once.

import { z } from "zod";
import type { LinkRewardClaim, LinkSpecialReward } from "./types";
import { linkRewardClaimSchema, linkSpecialRewardSchema } from "./schemas";

export const FAMILY_LINK_STORAGE_KEY = "crohncare_family_link";

export type FamilyLinkRole = "parent" | "child";

export type FamilyLink = {
  /** Which side of the link this phone is. A phone used by both keeps the parent role. */
  role: FamilyLinkRole;
  familyId: string;
  /** 16 random bytes, base64url. */
  keyB64: string;
  /** The child's nickname as the parents typed it when pairing. */
  nickname: string;
  /** Missions the parents enabled, copied to the child phone at pairing. */
  allowedMissionIds: string[];
  /** Rewards from home, copied to the child phone at pairing. */
  specialRewards: LinkSpecialReward[];
  /**
   * Requests for rewards from home. On the child phone, the ones the child created; on the parent
   * phone, the ones received. Temporary home until the economy state has a claims field.
   */
  rewardClaims?: LinkRewardClaim[];
  /** ISO timestamp of the pairing on this phone. */
  linkedAt: string;
  /** ISO timestamp of the last successful data code exchange, if any. */
  lastExchangeAt?: string;
};

export const familyLinkSchema: z.ZodType<FamilyLink> = z.object({
  role: z.enum(["parent", "child"]),
  familyId: z.string().min(1),
  keyB64: z.string().min(1),
  nickname: z.string(),
  allowedMissionIds: z.array(z.string()),
  specialRewards: z.array(linkSpecialRewardSchema),
  rewardClaims: z.array(linkRewardClaimSchema).optional(),
  linkedAt: z.string(),
  lastExchangeAt: z.string().optional(),
});

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Returns the saved link, or null when there is none or the saved value is unreadable. */
export function loadFamilyLink(): FamilyLink | null {
  const storage = getStorage();
  if (!storage) {
    return null;
  }
  const raw = storage.getItem(FAMILY_LINK_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = familyLinkSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveFamilyLink(link: FamilyLink): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.setItem(FAMILY_LINK_STORAGE_KEY, JSON.stringify(link));
}

export function clearFamilyLink(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(FAMILY_LINK_STORAGE_KEY);
}
