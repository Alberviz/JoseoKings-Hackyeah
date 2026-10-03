import { describe, expect, it } from "vitest";
import { MISSIONS } from "@/content/missions";
import type { Mission, MissionCompany } from "@/types";
import {
  canConfirm,
  confirmMission,
  getExpectedConfirmation,
  getProgressSummary,
  getTotalDuration,
  initMissionRun,
  selectCompany,
  stopMission,
  tickMission,
} from "./engine";

const mockMission: Mission = {
  id: "test-mission",
  title: "Test Breathing",
  kind: "breathing",
  parentNote: "Test note for parents.",
  steps: [
    {
      text: "Breathe in gently.",
      durationSeconds: 10,
      poseKey: "breathe",
    },
    {
      text: "Hold easy.",
      durationSeconds: 15,
      poseKey: "stretch",
    },
    {
      text: "Breathe out and cheer.",
      durationSeconds: 10,
      poseKey: "cheer",
    },
  ],
};

describe("mission engine (pure state machine)", () => {
  it("calculates total duration across all steps", () => {
    expect(getTotalDuration(mockMission)).toBe(35);
  });

  it("maps companies to expected confirmation modes accurately", () => {
    expect(getExpectedConfirmation("alone")).toBe("child");
    expect(getExpectedConfirmation("other")).toBe("other-tap");
    expect(getExpectedConfirmation("family")).toBe("parent-pin");
  });

  it("initialises in selecting_company state if company is omitted", () => {
    const state = initMissionRun(mockMission);
    expect(state.status).toBe("selecting_company");
    expect(state.company).toBeNull();
    expect(state.currentStepIndex).toBe(0);
    expect(state.currentStepElapsedSeconds).toBe(0);

    const withCompany = selectCompany(state, "family");
    expect(withCompany.status).toBe("in_progress");
    expect(withCompany.company).toBe("family");
  });

  it("initialises directly into in_progress if company is provided", () => {
    const state = initMissionRun(mockMission, "alone");
    expect(state.status).toBe("in_progress");
    expect(state.company).toBe("alone");
    expect(canConfirm(state)).toBe(false);
  });

  it("advances step countdown and overall timer accurately on ticks", () => {
    let state = initMissionRun(mockMission, "other");

    // Tick 5 seconds into step 0 (10s total)
    state = tickMission(state, 5);
    expect(state.currentStepIndex).toBe(0);
    expect(state.currentStepElapsedSeconds).toBe(5);
    expect(state.totalElapsedSeconds).toBe(5);

    let progress = getProgressSummary(state);
    expect(progress.currentStep?.remainingSeconds).toBe(5);
    expect(progress.currentStep?.progress).toBe(0.5);
    expect(progress.poseKey).toBe("breathe");

    // Tick 7 seconds (crosses into step 1, which has 15s)
    state = tickMission(state, 7);
    expect(state.currentStepIndex).toBe(1);
    expect(state.currentStepElapsedSeconds).toBe(2);
    expect(state.totalElapsedSeconds).toBe(12);

    progress = getProgressSummary(state);
    expect(progress.currentStep?.remainingSeconds).toBe(13);
    expect(progress.poseKey).toBe("stretch");
    expect(progress.currentStep?.isLastStep).toBe(false);
  });

  it("completes routine and enters finished state when all steps expire", () => {
    let state = initMissionRun(mockMission, "family");
    expect(canConfirm(state)).toBe(false);

    // Tick past total duration (35s)
    state = tickMission(state, 40);
    expect(state.status).toBe("finished");
    expect(state.currentStepIndex).toBe(2);
    expect(state.currentStepElapsedSeconds).toBe(10);
    expect(state.totalElapsedSeconds).toBe(35);
    expect(canConfirm(state)).toBe(true);

    const progress = getProgressSummary(state);
    expect(progress.overallProgress).toBe(1);
    expect(progress.totalRemainingSeconds).toBe(0);
    expect(progress.poseKey).toBe("cheer");
  });

  it("refuses confirmation before routine is finished", () => {
    const state = initMissionRun(mockMission, "alone");
    const runningState = tickMission(state, 10); // only 10s out of 35s

    expect(() =>
      confirmMission(runningState, {
        date: "2026-10-03",
      }),
    ).toThrowError(/Cannot confirm mission/);
  });

  it("confirms finished mission and produces a valid MissionLog with status completed", () => {
    const state = initMissionRun(mockMission, "family");
    const finishedState = tickMission(state, 35);

    const { state: confirmedState, log } = confirmMission(finishedState, {
      date: "2026-10-03",
      confirmedBy: "parent-pin",
      createdAt: "2026-10-03T18:00:00.000Z",
    });

    expect(confirmedState.status).toBe("confirmed");
    expect(confirmedState.log).toEqual(log);
    expect(log).toEqual({
      id: "mission-test-mission-2026-10-03",
      date: "2026-10-03",
      missionId: "test-mission",
      status: "completed",
      company: "family",
      confirmedBy: "parent-pin",
      createdAt: "2026-10-03T18:00:00.000Z",
    });
  });

  it("validates that confirmedBy strictly matches company requirements", () => {
    const state = initMissionRun(mockMission, "family");
    const finished = tickMission(state, 35);

    expect(() =>
      confirmMission(finished, {
        date: "2026-10-03",
        confirmedBy: "child",
      }),
    ).toThrowError(/Invalid confirmation "child" for company "family"/);
  });

  it("handles early voluntary stop and logs it as rest without penalties", () => {
    let state = initMissionRun(mockMission, "other");
    state = tickMission(state, 8); // stopped after 8s

    const { state: stoppedState, log } = stopMission(state, {
      date: "2026-10-03",
      createdAt: "2026-10-03T18:05:00.000Z",
    });

    expect(stoppedState.status).toBe("stopped");
    expect(log.status).toBe("rest");
    expect(log.company).toBe("other");
    expect(log.confirmedBy).toBe("child");
    expect(log.missionId).toBe("test-mission");

    const progress = getProgressSummary(stoppedState);
    expect(progress.poseKey).toBe("idle");
  });

  it("runs correctly with all real clinical content missions from src/content", () => {
    expect(MISSIONS.length).toBeGreaterThan(0);

    const companies: MissionCompany[] = ["alone", "family", "other"];

    for (const mission of MISSIONS) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const totalDuration = getTotalDuration(mission);
      expect(totalDuration).toBeGreaterThan(0);

      let state = initMissionRun(mission, company);
      state = tickMission(state, totalDuration);
      expect(state.status).toBe("finished");

      const { log } = confirmMission(state, {
        date: "2026-10-03",
      });
      expect(log.status).toBe("completed");
      expect(log.missionId).toBe(mission.id);
      expect(log.company).toBe(company);
    }
  });
});
