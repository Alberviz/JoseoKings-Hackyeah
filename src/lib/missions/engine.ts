import type { Mission, MissionCompany, MissionConfirmation, MissionLog } from "@/types";
import type {
  ConfirmMissionOptions,
  MissionProgressSummary,
  MissionRunState,
  MissionStepView,
  StopMissionOptions,
} from "./types";

/**
 * Returns total planned duration of a mission across all steps in seconds.
 */
export function getTotalDuration(mission: Mission): number {
  return mission.steps.reduce((acc, step) => acc + step.durationSeconds, 0);
}

/**
 * Maps the companion choice to the required confirmation mode per ARCHITECTURE.md section 8.
 * - alone: child taps confirmation ("child")
 * - other: accompanying person taps confirmation ("other-tap")
 * - family: parent verifies with PIN ("parent-pin")
 */
export function getExpectedConfirmation(company: MissionCompany): MissionConfirmation {
  switch (company) {
    case "alone":
      return "child";
    case "other":
      return "other-tap";
    case "family":
      return "parent-pin";
  }
}

/**
 * Initialises a new mission run session.
 * If company is not provided upfront, starts in "selecting_company" mode.
 */
export function initMissionRun(mission: Mission, company?: MissionCompany): MissionRunState {
  return {
    mission,
    status: company ? "in_progress" : "selecting_company",
    company: company ?? null,
    currentStepIndex: 0,
    currentStepElapsedSeconds: 0,
    totalElapsedSeconds: 0,
    log: null,
  };
}

/**
 * Sets or changes company and transitions to "in_progress" if currently selecting company.
 */
export function selectCompany(state: MissionRunState, company: MissionCompany): MissionRunState {
  if (state.status === "stopped" || state.status === "confirmed") {
    return state;
  }

  return {
    ...state,
    company,
    status: state.status === "selecting_company" ? "in_progress" : state.status,
  };
}

/**
 * Advances the active routine by deltaSeconds.
 * Pure function: time delta must be passed in from outside (no internal Date/timer calls).
 */
export function tickMission(state: MissionRunState, deltaSeconds: number): MissionRunState {
  if (state.status !== "in_progress" || deltaSeconds <= 0) {
    return state;
  }

  const { steps } = state.mission;
  if (!steps || steps.length === 0) {
    return {
      ...state,
      status: "finished",
    };
  }

  let index = state.currentStepIndex;
  let stepElapsed = state.currentStepElapsedSeconds + deltaSeconds;
  const totalElapsed = state.totalElapsedSeconds + deltaSeconds;
  const totalDuration = getTotalDuration(state.mission);

  while (index < steps.length) {
    const stepDuration = steps[index].durationSeconds;

    if (stepElapsed >= stepDuration) {
      if (index === steps.length - 1) {
        // Last step finished -> complete routine and await confirmation
        return {
          ...state,
          currentStepIndex: index,
          currentStepElapsedSeconds: stepDuration,
          totalElapsedSeconds: Math.min(totalElapsed, totalDuration),
          status: "finished",
        };
      }

      // Move to next step with remaining fractional time
      stepElapsed -= stepDuration;
      index += 1;
    } else {
      break;
    }
  }

  return {
    ...state,
    currentStepIndex: index,
    currentStepElapsedSeconds: stepElapsed,
    totalElapsedSeconds: Math.min(totalElapsed, totalDuration),
  };
}

/**
 * True if all routine steps have finished and the mission is ready for confirmation.
 */
export function canConfirm(state: MissionRunState): boolean {
  return state.status === "finished";
}

/**
 * Early stop action. Always available per ARCHITECTURE.md section 8.
 * Creates a "rest" status MissionLog. Never penalises the child.
 */
export function stopMission(
  state: MissionRunState,
  options: StopMissionOptions,
): { state: MissionRunState; log: MissionLog } {
  if (state.log && state.status === "stopped") {
    return { state, log: state.log };
  }

  const company: MissionCompany = state.company ?? "alone";
  const id = options.id ?? `rest-${state.mission.id}-${options.date}-${state.totalElapsedSeconds}`;
  const createdAt = options.createdAt ?? `${options.date}T12:00:00.000Z`;

  const log: MissionLog = {
    id,
    date: options.date,
    missionId: state.mission.id,
    status: "rest",
    company,
    confirmedBy: "child",
    createdAt,
  };

  const nextState: MissionRunState = {
    ...state,
    status: "stopped",
    log,
  };

  return { state: nextState, log };
}

/**
 * Confirms a successfully finished mission.
 * Refuses if called before the routine has completely finished.
 */
export function confirmMission(
  state: MissionRunState,
  options: ConfirmMissionOptions,
): { state: MissionRunState; log: MissionLog } {
  if (state.status !== "finished") {
    throw new Error(
      `Cannot confirm mission "${state.mission.id}": status is "${state.status}", expected "finished".`,
    );
  }

  const company: MissionCompany = state.company ?? "alone";
  const expectedConfirmation = getExpectedConfirmation(company);
  const confirmedBy = options.confirmedBy ?? expectedConfirmation;

  if (options.confirmedBy && options.confirmedBy !== expectedConfirmation) {
    throw new Error(
      `Invalid confirmation "${options.confirmedBy}" for company "${company}". Expected "${expectedConfirmation}".`,
    );
  }

  const id = options.id ?? `mission-${state.mission.id}-${options.date}`;
  const createdAt = options.createdAt ?? `${options.date}T12:00:00.000Z`;

  const log: MissionLog = {
    id,
    date: options.date,
    missionId: state.mission.id,
    status: "completed",
    company,
    confirmedBy,
    createdAt,
  };

  const nextState: MissionRunState = {
    ...state,
    status: "confirmed",
    log,
  };

  return { state: nextState, log };
}

/**
 * Computes a formatted view of the current progress, countdowns, and pose key.
 */
export function getProgressSummary(state: MissionRunState): MissionProgressSummary {
  const totalDuration = getTotalDuration(state.mission);
  const totalElapsed = Math.min(state.totalElapsedSeconds, totalDuration);
  const totalRemaining = Math.max(0, totalDuration - totalElapsed);
  const overallProgress =
    totalDuration > 0 ? Math.min(1, Math.max(0, totalElapsed / totalDuration)) : 1;

  const currentStep = state.mission.steps[state.currentStepIndex];

  let currentStepView: MissionStepView | null = null;
  if (currentStep) {
    const stepDuration = currentStep.durationSeconds;
    const stepElapsed = Math.min(state.currentStepElapsedSeconds, stepDuration);
    const stepRemaining = Math.max(0, stepDuration - stepElapsed);
    const stepProgress =
      stepDuration > 0 ? Math.min(1, Math.max(0, stepElapsed / stepDuration)) : 1;
    const isLastStep = state.currentStepIndex === state.mission.steps.length - 1;

    currentStepView = {
      stepIndex: state.currentStepIndex,
      step: currentStep,
      durationSeconds: stepDuration,
      elapsedSeconds: stepElapsed,
      remainingSeconds: stepRemaining,
      progress: stepProgress,
      isLastStep,
    };
  }

  let poseKey = currentStep?.poseKey ?? "idle";
  if (state.status === "finished" || state.status === "confirmed") {
    poseKey = "cheer";
  } else if (state.status === "stopped") {
    poseKey = "idle";
  }

  return {
    totalDurationSeconds: totalDuration,
    totalElapsedSeconds: totalElapsed,
    totalRemainingSeconds: totalRemaining,
    overallProgress,
    currentStep: currentStepView,
    poseKey,
  };
}
