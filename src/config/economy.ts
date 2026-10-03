import type { ShopItem, Treat } from "@/types";

/*
 * Coins reward the act, never the answer. Amounts never depend on what the child
 * answered, on the mission kind or on who was with them.
 */
/** A full check-in. */
export const CHECKIN_COINS = 5;
/** The "I don't feel like it today" check-in. Valid, slightly smaller. */
export const CHECKIN_SKIP_COINS = 3;
/** A completed mission, any company or kind. */
export const CHEST_COINS = 12;
/** A mission stopped early, logged as rest. */
export const REST_COINS = 6;

/** Fire added by one portion of food. */
export const FOOD_FIRE = 10;

export const FIRE_MAX = 100;

export const TREAT_LABEL_MAX_LENGTH = 40;
export const TREAT_COST_MIN = 1;
export const TREAT_COST_MAX = FIRE_MAX;

export const SHOP_ITEMS = [
  { id: "food", kind: "consumable", price: 5 },
  { id: "glasses", kind: "wearable", slot: "face", price: 7 },
  { id: "t-shirt", kind: "wearable", slot: "body", price: 10 },
  { id: "hat", kind: "wearable", slot: "head", price: 10 },
] as const satisfies readonly ShopItem[];

export const DEFAULT_TREATS = [
  { id: "choose-dinner", label: "Choose dinner", fireCost: 50 },
] as const satisfies readonly Treat[];

export type ShopItemConfig = (typeof SHOP_ITEMS)[number];
