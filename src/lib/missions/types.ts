import type {
  DateKey,
  Mission,
  MissionCompany,
  MissionConfirmation,
  MissionLog,
  MissionStep,
} from "@/types";

export type MissionRunStatus =
  "selecting_company" | "in_progress" | "stopped" | "finished" | "confirmed";

export type MissionRunState = {
  mission: Mission;
  status: MissionRunStatus;
  company: MissionCompany | null;
  currentStepIndex: number;
  currentStepElapsedSeconds: number;
  totalElapsedSeconds: number;
  log: MissionLog | null;
};

export type MissionStepView = {
  stepIndex: number;
  step: MissionStep;
  durationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  progress: number;
  isLastStep: boolean;
};

export type MissionProgressSummary = {
  totalDurationSeconds: number;
  totalElapsedSeconds: number;
  totalRemainingSeconds: number;
  overallProgress: number;
  currentStep: MissionStepView | null;
  poseKey: string;
};

export type StopMissionOptions = {
  date: DateKey;
  createdAt?: string;
  id?: string;
};

export type ConfirmMissionOptions = {
  date: DateKey;
  confirmedBy?: MissionConfirmation;
  createdAt?: string;
  id?: string;
};
