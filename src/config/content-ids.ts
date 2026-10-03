// Stable ids shared by the content files (src/content), the demo data and the screens.
// If task T4 changes a question or a mission, update the ids here in the same PR so the demo data keeps working.

// The three core check-in questions, proposed by the biomedical team (Álvaro) and adopted on 2026-10-03.
// Every core question uses the same scale and the same direction: 0 is the easiest day, 2 the hardest.
// So "higher is harder" holds for all of them, and code can treat them alike.
export const QUESTION_IDS = {
  bellyComfort: "belly-comfort",
  energy: "energy",
  playPace: "play-pace",
} as const;

export const CORE_QUESTION_SCALE = { min: 0, max: 2 } as const;

/** A day counts as a day with discomfort when the belly comfort answer is at least this value. */
export const DISCOMFORT_THRESHOLD = 1;

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
