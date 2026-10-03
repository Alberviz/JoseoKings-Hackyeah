import type { DateKey } from "./check-in";

export type ShopItemId = "food" | "glasses" | "t-shirt" | "hat";

export type ShopSlot = "face" | "body" | "head";

export type ShopItem =
  | { id: ShopItemId; kind: "consumable"; price: number }
  | { id: ShopItemId; kind: "wearable"; slot: ShopSlot; price: number };

/** A reward the family agrees on. The child spends fire to ask for it. */
export type Treat = {
  id: string;
  /** Short label, 1 to 40 characters. */
  label: string;
  /** Fire the child spends to redeem it, an integer from 1 to 100. */
  fireCost: number;
};

export type TreatRedemption = {
  id: string;
  treatId: string;
  /** Local calendar day of the redemption. */
  date: DateKey;
};

/**
 * Coins are earned from completed missions (derived, never stored) and spent in the shop.
 * Fire only goes down when the child redeems a treat. It never decays.
 */
export type EconomyState = {
  fire: number;
  coinsSpent: number;
  inventory: { food: number };
  ownedItemIds: ShopItemId[];
  equippedItemIds: ShopItemId[];
  treats: Treat[];
  redemptions: TreatRedemption[];
};
