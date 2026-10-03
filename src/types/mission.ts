import type { DateKey } from "./check-in";

export type MissionKind = "breathing" | "stretch" | "balance" | "strength";

/** Who the play game is for in the v2 Play flow. "Family" and "Someone else" both pick "family" games. */
export type PlayMode = "alone" | "family";

/** Chosen by the feeling chip before playing (1, 2 or 3 dots). Never changes a reward. */
export type PlayLevel = 1 | 2 | 3;

/** Moves the exercise stick figure can show. Play game steps use one as their `poseKey`. */
export type MoveKey =
  | "breathe-arms"
  | "hold-pose"
  | "tap-seated"
  | "cat-cow"
  | "stretch-neck"
  | "stretch-side"
  | "reach-up"
  | "twist"
  | "march"
  | "walk"
  | "tiptoe"
  | "one-leg"
  | "dance"
  | "clap"
  | "carry";

export type MissionStep = {
  /** Child-facing instruction, one short sentence. */
  text: string;
  durationSeconds: number;
  /** Companion pose for the gentle missions, or a MoveKey for the play games. */
  poseKey: string;
  /** Big icon for a choice step (roll the dice, pick a colour). */
  iconKey?: string;
};

/** Static definition. Lives in src/content/missions.ts. Gentle, no impact, no jumping in v1. */
export type Mission = {
  id: string;
  title: string;
  kind: MissionKind;
  steps: MissionStep[];
  /** Short note for parents. General information only, never advice. */
  parentNote: string;
  /** Set on the play games only. */
  mode?: PlayMode;
  /** Set on the play games only. */
  level?: PlayLevel;
};

/** Who was with the child. Decides the confidence label and the team reward. */
export type MissionCompany = "alone" | "family" | "other";

/** How the mission was confirmed. */
export type MissionConfirmation = "child" | "parent-pin" | "other-tap";

export type MissionStatus =
  /** The child reached the end of the guided routine. */
  | "completed"
  /** The child pressed "stop" early. Logged as rest, never as a failure. */
  | "rest";

export type MissionLog = {
  id: string;
  date: DateKey;
  missionId: string;
  status: MissionStatus;
  company: MissionCompany;
  confirmedBy: MissionConfirmation;
  createdAt: string;
};
