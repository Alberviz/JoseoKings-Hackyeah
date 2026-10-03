import type { ShopItem, SpecialReward } from "@/types";

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

export const FIRE_MAX = 200;

export const DRAGON_EVOLUTION_THRESHOLDS = {
  baby: 0,
  young: 100,
  heroic: 200,
} as const;

export type DragonStageKey = "baby" | "young" | "heroic";
export type DragonStageNumber = 1 | 2 | 3;

export type DragonEvolutionInfo = {
  stage: DragonStageNumber;
  key: DragonStageKey;
  title: string;
  subtitle: string;
  description: string;
  artwork: string;
  offwhiteArtwork: string;
  background: string;
  minFire: number;
  nextThreshold: number | null;
};

export const DRAGON_EVOLUTION_STAGES: Record<DragonStageKey, DragonEvolutionInfo> = {
  baby: {
    stage: 1,
    key: "baby",
    title: "Bebé Dragón",
    subtitle: "Etapa 1 • Tierno y juguetón",
    description: "Pequeño dragón de Cracovia en una pradera suave de tonos pastel.",
    artwork: "/dragon.png",
    offwhiteArtwork: "/dragon_offwhite.png",
    background: "/bg_stage1_pastel.jpg",
    minFire: 0,
    nextThreshold: 100,
  },
  young: {
    stage: 2,
    key: "young",
    title: "Dragón Joven",
    subtitle: "Etapa 2 • Guerrero intrépido",
    description: "Joven aventurero entrenando en una fortaleza de montaña al atardecer.",
    artwork: "/dragon_stage2_teen.png",
    offwhiteArtwork: "/dragon_stage2_offwhite.png",
    background: "/bg_stage2_warrior.jpg",
    minFire: 100,
    nextThreshold: 200,
  },
  heroic: {
    stage: 3,
    key: "heroic",
    title: "Dragón Heroico",
    subtitle: "Etapa 3 • Full guerrero legendario",
    description:
      "Majestuoso guardián en la cúspide del castillo Wawel con auroras y ascuas épicas.",
    artwork: "/dragon_stage3_heroic.png",
    offwhiteArtwork: "/dragon_stage3_offwhite.png",
    background: "/bg_stage3_heroic.jpg",
    minFire: 200,
    nextThreshold: null,
  },
};

export function getDragonEvolution(fire: number): DragonEvolutionInfo {
  if (fire >= DRAGON_EVOLUTION_THRESHOLDS.heroic) {
    return DRAGON_EVOLUTION_STAGES.heroic;
  }
  if (fire >= DRAGON_EVOLUTION_THRESHOLDS.young) {
    return DRAGON_EVOLUTION_STAGES.young;
  }
  return DRAGON_EVOLUTION_STAGES.baby;
}

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
