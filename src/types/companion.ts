export type CompanionItemSlot = "hat" | "cape" | "color" | "gadget";

export type CompanionItem = {
  id: string;
  slot: CompanionItemSlot;
  name: string;
  /** Points needed to unlock. Progress only goes up, never down. */
  cost: number;
  /** Items unlocked by team missions (with family or someone else) use the team track. */
  track: "main" | "team";
};

export type BadgeId = string;

export type CompanionState = {
  name: string;
  /** Main track points. Same for every answer and every mission kind. */
  points: number;
  /** Team track: counts missions done with someone. Separate from the main track. */
  teamStars: number;
  ownedItemIds: string[];
  equippedItemIds: string[];
  badgeIds: BadgeId[];
};
