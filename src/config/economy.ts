import type { DragonEvolutionConfig, DragonStageId, ShopItem, SpecialReward } from "@/types";

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

/** Initial starter coins granted to the child so they can use the shop right away. */
export const INITIAL_COINS = 100;

/** Fire added by one portion of food. */
export const FOOD_FIRE = 10;

export const FIRE_MAX = 100;

/** Dragon Evolution thresholds within 0-100 fire */
export const DRAGON_EVOLUTION_THRESHOLDS = {
  stage2: 40,
  stage3: 80,
} as const;

export const DRAGON_EVOLUTION_STAGES: Record<DragonStageId, DragonEvolutionConfig> = {
  1: {
    stage: 1,
    title: "Baby Dragon",
    nextThreshold: DRAGON_EVOLUTION_THRESHOLDS.stage2,
    description: "Gentle pastel sky with drifting fluffy clouds",
  },
  2: {
    stage: 2,
    title: "Young Dragon",
    nextThreshold: DRAGON_EVOLUTION_THRESHOLDS.stage3,
    description: "Warm golden sky with adventurous glowing sparks",
  },
  3: {
    stage: 3,
    title: "Hero Dragon",
    nextThreshold: null,
    description: "Epic twilight sky with vibrant aurora and rising embers",
  },
} as const;

export const SPECIAL_REWARD_NAME_MAX_LENGTH = 40;
export const SPECIAL_REWARD_COST_MIN = 1;
export const SPECIAL_REWARD_COST_MAX = FIRE_MAX;

export const SHOP_ITEMS = [
  { id: "food", kind: "consumable", price: 5 },
  { id: "glasses", kind: "wearable", slot: "face", price: 7 },
  { id: "t-shirt", kind: "wearable", slot: "body", price: 10 },
  { id: "hat", kind: "wearable", slot: "head", price: 10 },
] as const satisfies readonly ShopItem[];

export const DEFAULT_SPECIAL_REWARDS = [
  { id: "choose-dinner", name: "Choose today's dinner", fireCost: 50 },
  { id: "kart-day", name: "Kart day", fireCost: 100 },
  { id: "phone-minutes", name: "30 more phone minutes", fireCost: 30 },
  { id: "board-games", name: "Board games marathon", fireCost: 60 },
] as const satisfies readonly SpecialReward[];

export type ShopItemConfig = (typeof SHOP_ITEMS)[number];
