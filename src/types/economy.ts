import type { DateKey } from "./check-in";

export type ShopItemId =
  "food" | "glasses" | "sunglasses" | "t-shirt" | "sport-shirt" | "hat" | "cap";

export type ShopSlot = "face" | "body" | "head";

export type ShopItem =
  | { id: ShopItemId; kind: "consumable"; price: number }
  | { id: ShopItemId; kind: "wearable"; slot: ShopSlot; price: number };

/** A special reward the family agrees on. The child spends fire to claim it. */
export type SpecialReward = {
  id: string;
  /** Short name, 1 to 40 characters. */
  name: string;
  /** Fire the child spends to claim it, an integer from 1 to 100. */
  fireCost: number;
};

export type RewardClaimStatus = "requested" | "done";

export type RewardClaim = {
  /** Unique across devices (random UUID), so claims can travel between devices without clashing. */
  id: string;
  rewardId: string;
  /** Local calendar day of the claim. */
  date: DateKey;
  /** ISO timestamp of the claim. */
  createdAt: string;
  /** "requested" when the child claims it, "done" when a parent confirms it was given. */
  status: RewardClaimStatus;
  /** Local calendar day a parent marked it done. */
  doneAt?: DateKey;
};

/**
 * Coins are earned from completed missions (derived, never stored) and spent in the shop.
 * Fire only goes down when the child claims a special reward. It never decays.
 */
export type EconomyState = {
  fire: number;
  /** Highest fire ever reached by the child. The evolution stage never drops below this. */
  highestFire?: number;
  coinsSpent: number;
  inventory: { food: number };
  ownedItemIds: ShopItemId[];
  equippedItemIds: ShopItemId[];
  specialRewards: SpecialReward[];
  rewardClaims: RewardClaim[];
};

export type DragonStageId = 1 | 2 | 3;

export type DragonEvolutionConfig = {
  stage: DragonStageId;
  title: string;
  nextThreshold: number | null;
  description: string;
  background?: string;
};

export type DragonEvolutionInfo = DragonEvolutionConfig & {
  fireNeededForNext: number;
  highestFire: number;
};
