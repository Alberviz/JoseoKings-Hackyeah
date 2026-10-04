import type { Mission, MissionCompany, MissionConfirmation, MissionStep } from "@/types";

export type MissionRunPhase = "choosing-company" | "running" | "finished" | "confirmed" | "stopped";

export type MissionRun = {
  readonly mission: Mission;
  readonly phase: MissionRunPhase;
  readonly company: MissionCompany;
  readonly startedAtMs: number | null;
  readonly lastTickMs: number | null;
  readonly elapsedMs: number;
  readonly totalDurationMs: number;
  readonly currentStepIndex: number;
  readonly currentStep: MissionStep | null;
  readonly stepElapsedMs: number;
  readonly stepRemainingSeconds: number;
  readonly totalRemainingSeconds: number;
  readonly confirmedBy: MissionConfirmation | null;
  readonly confirmedAtMs: number | null;
};
