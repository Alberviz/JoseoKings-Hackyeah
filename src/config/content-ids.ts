// Stable ids shared by the content files (src/content), the demo data and the screens.
// If task T4 changes a question or a mission, update the ids here in the same PR so the demo data keeps working.

export const QUESTION_IDS = {
  bellyPain: "belly-pain",
  bathroom: "bathroom",
  energy: "energy",
} as const;

/** Scale used by the three core questions. 0 is the lowest option, 4 the highest. */
export const CORE_QUESTION_SCALE = { min: 0, max: 4 } as const;

export const MISSION_IDS = {
  dragonBreathing: "dragon-breathing",
  bedStretch: "bed-stretch",
  flamingoBalance: "flamingo-balance",
  wallSit: "wall-sit",
  rollingWave: "rolling-wave",
} as const;

export const ITEM_IDS = {
  hatExplorer: "hat-explorer",
  colorTeal: "color-teal",
  capeStar: "cape-star",
  gadgetGoggles: "gadget-goggles",
} as const;

export const BADGE_IDS = {
  firstCheckIn: "first-check-in",
  careDays30: "care-days-30",
  teamUp: "team-up",
} as const;
