import type { DateKey } from "./check-in";

export type MissionKind = "breathing" | "stretch" | "balance" | "strength";

export type MissionStep = {
  /** Child-facing instruction, one short sentence. */
  text: string;
  durationSeconds: number;
  /** Key of the companion pose or animation for this step. */
  poseKey: string;
};

/** Static definition. Lives in src/content/missions.ts. Gentle, no impact, no jumping in v1. */
export type Mission = {
  id: string;
  title: string;
  kind: MissionKind;
  steps: MissionStep[];
  /** Short note for parents. General information only, never advice. */
  parentNote: string;
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

export type MissionMoodBefore = "calm" | "strong" | "amazing";
export type MissionMoodAfter = "exhausted" | "chill" | "great";

export type MissionLog = {
  id: string;
  date: DateKey;
  missionId: string;
  status: MissionStatus;
  company: MissionCompany;
  confirmedBy: MissionConfirmation;
  createdAt: string;
  moodBefore?: MissionMoodBefore;
  moodAfter?: MissionMoodAfter;
};
