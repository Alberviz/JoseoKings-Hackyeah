import type { DateKey, Mission, MissionCompany, MissionConfirmation, MissionLog } from "@/types";
import type { MissionRun } from "./types";

export function calculateTotalDurationMs(mission: Mission): number {
  return mission.steps.reduce((sum, step) => sum + step.durationSeconds * 1000, 0);
}

export function allowedConfirmationForCompany(company: MissionCompany): MissionConfirmation {
  switch (company) {
    case "alone":
      return "child";
    case "other":
      return "other-tap";
    case "family":
      return "parent-pin";
  }
}

export function createRun(mission: Mission): MissionRun {
  const totalDurationMs = calculateTotalDurationMs(mission);
  const firstStep = mission.steps[0] ?? null;

  return {
    mission,
    phase: "choosing-company",
    company: "alone",
    startedAtMs: null,
    lastTickMs: null,
    elapsedMs: 0,
    totalDurationMs,
    currentStepIndex: 0,
    currentStep: firstStep,
    stepElapsedMs: 0,
    stepRemainingSeconds: firstStep ? firstStep.durationSeconds : 0,
    totalRemainingSeconds: Math.ceil(totalDurationMs / 1000),
    confirmedBy: null,
    confirmedAtMs: null,
  };
}

export function chooseCompany(run: MissionRun, company: MissionCompany): MissionRun {
  if (run.phase !== "choosing-company") {
    throw new Error(`Cannot choose company in phase "${run.phase}".`);
  }
  return {
    ...run,
    company,
  };
}

export function start(run: MissionRun, nowMs: number): MissionRun {
  if (run.phase !== "choosing-company") {
    throw new Error(`Cannot start a mission in phase "${run.phase}".`);
  }

  if (run.totalDurationMs === 0) {
    const lastIndex = Math.max(0, run.mission.steps.length - 1);
    return {
      ...run,
      phase: "finished",
      startedAtMs: nowMs,
      lastTickMs: nowMs,
      elapsedMs: 0,
      currentStepIndex: lastIndex,
      currentStep: run.mission.steps[lastIndex] ?? null,
      stepElapsedMs: 0,
      stepRemainingSeconds: 0,
      totalRemainingSeconds: 0,
    };
  }

  const firstStep = run.mission.steps[0] ?? null;
  return {
    ...run,
    phase: "running",
    startedAtMs: nowMs,
    lastTickMs: nowMs,
    elapsedMs: 0,
    currentStepIndex: 0,
    currentStep: firstStep,
    stepElapsedMs: 0,
    stepRemainingSeconds: firstStep ? firstStep.durationSeconds : 0,
    totalRemainingSeconds: Math.ceil(run.totalDurationMs / 1000),
  };
}

export function tick(run: MissionRun, nowMs: number): MissionRun {
  if (run.phase !== "running" || run.startedAtMs === null) {
    return run;
  }

  // A run never goes backwards in time
  const safeNowMs = run.lastTickMs !== null ? Math.max(nowMs, run.lastTickMs) : nowMs;
  // A run never exceeds total duration
  const elapsedMs = Math.min(safeNowMs - run.startedAtMs, run.totalDurationMs);

  if (elapsedMs >= run.totalDurationMs) {
    const lastIndex = Math.max(0, run.mission.steps.length - 1);
    const lastStep = run.mission.steps[lastIndex] ?? null;
    return {
      ...run,
      phase: "finished",
      lastTickMs: safeNowMs,
      elapsedMs: run.totalDurationMs,
      currentStepIndex: lastIndex,
      currentStep: lastStep,
      stepElapsedMs: lastStep ? lastStep.durationSeconds * 1000 : 0,
      stepRemainingSeconds: 0,
      totalRemainingSeconds: 0,
    };
  }

  let accumulatedMs = 0;
  let stepIndex = 0;
  for (let i = 0; i < run.mission.steps.length; i += 1) {
    const stepDurationMs = run.mission.steps[i].durationSeconds * 1000;
    if (elapsedMs < accumulatedMs + stepDurationMs || i === run.mission.steps.length - 1) {
      stepIndex = i;
      break;
    }
    accumulatedMs += stepDurationMs;
  }

  const currentStep = run.mission.steps[stepIndex] ?? null;
  const stepDurationMs = currentStep ? currentStep.durationSeconds * 1000 : 0;
  const stepElapsedMs = Math.max(0, elapsedMs - accumulatedMs);
  const stepRemainingMs = Math.max(0, stepDurationMs - stepElapsedMs);
  const stepRemainingSeconds = Math.max(0, Math.ceil(stepRemainingMs / 1000));
  const totalRemainingMs = Math.max(0, run.totalDurationMs - elapsedMs);
  const totalRemainingSeconds = Math.max(0, Math.ceil(totalRemainingMs / 1000));

  return {
    ...run,
    lastTickMs: safeNowMs,
    elapsedMs,
    currentStepIndex: stepIndex,
    currentStep,
    stepElapsedMs,
    stepRemainingSeconds,
    totalRemainingSeconds,
  };
}

export function stop(run: MissionRun): MissionRun {
  if (run.phase === "confirmed") {
    throw new Error("Cannot stop a mission run that is already confirmed.");
  }
  if (run.phase === "stopped") {
    return run;
  }
  return {
    ...run,
    phase: "stopped",
    confirmedBy: "child",
  };
}

export function confirm(run: MissionRun, how: MissionConfirmation, nowMs: number): MissionRun {
  if (run.phase !== "finished") {
    throw new Error(
      `Cannot confirm mission run: run is in phase "${run.phase}", expected "finished".`,
    );
  }
  const allowed = allowedConfirmationForCompany(run.company);
  if (how !== allowed) {
    throw new Error(
      `Confirmation "${how}" is not allowed for company "${run.company}". Expected "${allowed}".`,
    );
  }
  return {
    ...run,
    phase: "confirmed",
    confirmedBy: how,
    confirmedAtMs: nowMs,
  };
}

export function toMissionLog(
  run: MissionRun,
  meta: { id: string; date: DateKey; createdAt: string },
): MissionLog {
  if (run.phase === "confirmed") {
    return {
      id: meta.id,
      date: meta.date,
      missionId: run.mission.id,
      status: "completed",
      company: run.company,
      confirmedBy: run.confirmedBy ?? allowedConfirmationForCompany(run.company),
      createdAt: meta.createdAt,
    };
  }

  if (run.phase === "stopped") {
    return {
      id: meta.id,
      date: meta.date,
      missionId: run.mission.id,
      status: "rest",
      company: run.company,
      confirmedBy: "child",
      createdAt: meta.createdAt,
    };
  }

  throw new Error(
    `Cannot create mission log from run in phase "${run.phase}". Run must be "confirmed" or "stopped".`,
  );
}

export function currentPoseKey(run: MissionRun): string {
  if (run.phase === "finished" || run.phase === "confirmed") {
    return "cheer";
  }
  return run.currentStep?.poseKey ?? "idle";
}

export function currentStepText(run: MissionRun): string {
  return run.currentStep?.text ?? "";
}

export function progressPercent(run: MissionRun): number {
  if (run.totalDurationMs <= 0) return 100;
  return Math.min(100, Math.round((run.elapsedMs / run.totalDurationMs) * 100));
}
