export const COMPANION_POSES = [
  "idle",
  "breathe",
  "stretch",
  "balance",
  "strength",
  "cheer",
] as const;

export const companionPoses = COMPANION_POSES;

export type CompanionPose = (typeof COMPANION_POSES)[number];
