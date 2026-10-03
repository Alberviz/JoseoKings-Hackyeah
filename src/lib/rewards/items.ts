import { BADGE_IDS, ITEM_IDS } from "@/config/content-ids";
import type { CompanionItem } from "@/types";

/** Starter catalog. Items on the main track cost points; items on the team track cost team stars. */
export const COMPANION_ITEMS: readonly CompanionItem[] = [
  { id: ITEM_IDS.hatExplorer, slot: "hat", name: "Explorer hat", cost: 20, track: "main" },
  { id: ITEM_IDS.colorTeal, slot: "color", name: "Teal color", cost: 40, track: "main" },
  { id: ITEM_IDS.gadgetGoggles, slot: "gadget", name: "Star goggles", cost: 80, track: "main" },
  { id: ITEM_IDS.capeStar, slot: "cape", name: "Team cape", cost: 3, track: "team" },
];

export type BadgeDefinition = {
  id: string;
  name: string;
  description: string;
};

export const BADGES: readonly BadgeDefinition[] = [
  {
    id: BADGE_IDS.firstCheckIn,
    name: "First check-in",
    description: "You told us how you feel for the first time.",
  },
  {
    id: BADGE_IDS.careDays30,
    name: "30 care days",
    description: "30 days with a check-in or a mission.",
  },
  {
    id: BADGE_IDS.teamUp,
    name: "Team up",
    description: "You finished a mission with someone.",
  },
];
