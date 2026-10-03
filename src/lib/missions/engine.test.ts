import { describe, expect, it } from "vitest";
import type { Mission } from "@/types";
import {
  allowedConfirmationForCompany,
  calculateTotalDurationMs,
  chooseCompany,
  confirm,
  createRun,
  currentPoseKey,
  currentStepText,
  progressPercent,
  start,
  stop,
  tick,
  toMissionLog,
} from "./engine";

const TEST_MISSION: Mission = {
  id: "test-mission",
  title: "Test Routine",
  kind: "breathing",
  parentNote: "Gentle breathing for testing.",
  steps: [
    { text: "Breathe in deeply", durationSeconds: 10, poseKey: "breathe" },
    { text: "Hold and balance", durationSeconds: 15, poseKey: "balance" },
    { text: "Stretch arms high", durationSeconds: 20, poseKey: "stretch" },
    { text: "Cheer and smile", durationSeconds: 5, poseKey: "cheer" },
  ],
};

describe("Mission Engine (pure logic)", () => {
  it("calculates total duration in ms", () => {
    // 10 + 15 + 20 + 5 = 50 seconds = 50,000 ms
    expect(calculateTotalDurationMs(TEST_MISSION)).toBe(50000);
  });

  it("initializes a run in choosing-company phase with alone company", () => {
    const run = createRun(TEST_MISSION);
    expect(run.phase).toBe("choosing-company");
    expect(run.company).toBe("alone");
    expect(run.elapsedMs).toBe(0);
    expect(run.totalDurationMs).toBe(50000);
    expect(run.currentStepIndex).toBe(0);
    expect(run.currentStep?.text).toBe("Breathe in deeply");
    expect(run.currentStep?.poseKey).toBe("breathe");
    expect(run.stepRemainingSeconds).toBe(10);
    expect(run.totalRemainingSeconds).toBe(50);
    expect(run.startedAtMs).toBeNull();
    expect(currentPoseKey(run)).toBe("breathe");
    expect(currentStepText(run)).toBe("Breathe in deeply");
    expect(progressPercent(run)).toBe(0);
  });

  it("allows choosing company while in choosing-company phase", () => {
    let run = createRun(TEST_MISSION);
    run = chooseCompany(run, "family");
    expect(run.company).toBe("family");

    run = chooseCompany(run, "other");
    expect(run.company).toBe("other");
  });

  it("refuses choosing company once running", () => {
    const run = createRun(TEST_MISSION);
    const started = start(run, 1000);
    expect(() => chooseCompany(started, "family")).toThrow(
      'Cannot choose company in phase "running".',
    );
  });

  it("starts the run and transitions to running phase", () => {
    const run = createRun(TEST_MISSION);
    const started = start(run, 5000);
    expect(started.phase).toBe("running");
    expect(started.startedAtMs).toBe(5000);
    expect(started.lastTickMs).toBe(5000);
    expect(started.elapsedMs).toBe(0);
    expect(started.totalRemainingSeconds).toBe(50);
  });

  it("refuses starting a run that is not in choosing-company phase", () => {
    const run = createRun(TEST_MISSION);
    const started = start(run, 1000);
    expect(() => start(started, 2000)).toThrow('Cannot start a mission in phase "running".');
  });

  it("handles a zero-duration mission safely by finishing immediately on start", () => {
    const emptyMission: Mission = {
      id: "empty",
      title: "Empty",
      kind: "stretch",
      parentNote: "None",
      steps: [],
    };
    const run = createRun(emptyMission);
    const started = start(run, 1000);
    expect(started.phase).toBe("finished");
    expect(started.totalRemainingSeconds).toBe(0);
  });

  it("advances step by step through time ticks", () => {
    const run = createRun(TEST_MISSION);
    let current = start(run, 0);

    // After 3 seconds (3,000 ms) in step 0 (10s)
    current = tick(current, 3000);
    expect(current.phase).toBe("running");
    expect(current.elapsedMs).toBe(3000);
    expect(current.currentStepIndex).toBe(0);
    expect(current.currentStep?.poseKey).toBe("breathe");
    expect(current.stepElapsedMs).toBe(3000);
    expect(current.stepRemainingSeconds).toBe(7); // 10 - 3
    expect(current.totalRemainingSeconds).toBe(47); // 50 - 3
    expect(progressPercent(current)).toBe(6); // 3000 / 50000 = 6%

    // Exactly at 10 seconds: transitions to step 1 (15s)
    current = tick(current, 10000);
    expect(current.currentStepIndex).toBe(1);
    expect(current.currentStep?.poseKey).toBe("balance");
    expect(current.stepElapsedMs).toBe(0);
    expect(current.stepRemainingSeconds).toBe(15);
    expect(current.totalRemainingSeconds).toBe(40);

    // At 20 seconds: 10s step0 + 10s into step1
    current = tick(current, 20000);
    expect(current.currentStepIndex).toBe(1);
    expect(current.stepElapsedMs).toBe(10000);
    expect(current.stepRemainingSeconds).toBe(5);
    expect(current.totalRemainingSeconds).toBe(30);

    // At 25 seconds: transitions to step 2 (20s)
    current = tick(current, 25000);
    expect(current.currentStepIndex).toBe(2);
    expect(current.currentStep?.poseKey).toBe("stretch");
    expect(current.stepRemainingSeconds).toBe(20);

    // At 45 seconds: transitions to step 3 (5s)
    current = tick(current, 45000);
    expect(current.currentStepIndex).toBe(3);
    expect(current.currentStep?.poseKey).toBe("cheer");
    expect(current.stepRemainingSeconds).toBe(5);
    expect(current.totalRemainingSeconds).toBe(5);

    // At 50 seconds: finishes!
    current = tick(current, 50000);
    expect(current.phase).toBe("finished");
    expect(current.elapsedMs).toBe(50000);
    expect(current.stepRemainingSeconds).toBe(0);
    expect(current.totalRemainingSeconds).toBe(0);
    expect(currentPoseKey(current)).toBe("cheer");
    expect(progressPercent(current)).toBe(100);
  });

  it("handles big time jumps (paused tab) gracefully without exceeding duration", () => {
    const run = createRun(TEST_MISSION);
    const started = start(run, 0);

    // Sudden jump to 1,000,000 ms
    const jumped = tick(started, 1000000);
    expect(jumped.phase).toBe("finished");
    expect(jumped.elapsedMs).toBe(50000);
    expect(jumped.currentStepIndex).toBe(3);
    expect(jumped.totalRemainingSeconds).toBe(0);
  });

  it("does not move backwards in time", () => {
    const run = createRun(TEST_MISSION);
    let current = start(run, 10000);

    current = tick(current, 15000); // 5s elapsed
    expect(current.elapsedMs).toBe(5000);

    // Clock goes backwards to 12000
    current = tick(current, 12000);
    expect(current.elapsedMs).toBe(5000);
  });

  it("ignores ticks when not in running phase", () => {
    const run = createRun(TEST_MISSION);
    const unticked = tick(run, 1000);
    expect(unticked).toBe(run);
  });

  describe("Confirmation rules per company", () => {
    it("maps allowed confirmation to each company", () => {
      expect(allowedConfirmationForCompany("alone")).toBe("child");
      expect(allowedConfirmationForCompany("other")).toBe("other-tap");
      expect(allowedConfirmationForCompany("family")).toBe("parent-pin");
    });

    it("refuses confirmation before the run is finished", () => {
      const run = createRun(TEST_MISSION);
      expect(() => confirm(run, "child", 1000)).toThrow('run is in phase "choosing-company"');

      const running = start(run, 1000);
      expect(() => confirm(running, "child", 2000)).toThrow('run is in phase "running"');
    });

    it("alone company accepts child confirmation and rejects others", () => {
      let run = createRun(TEST_MISSION);
      run = start(run, 0);
      run = tick(run, 50000); // finished

      expect(() => confirm(run, "parent-pin", 51000)).toThrow("not allowed for company");
      expect(() => confirm(run, "other-tap", 51000)).toThrow("not allowed for company");

      const confirmed = confirm(run, "child", 51000);
      expect(confirmed.phase).toBe("confirmed");
      expect(confirmed.confirmedBy).toBe("child");
      expect(confirmed.confirmedAtMs).toBe(51000);
      expect(currentPoseKey(confirmed)).toBe("cheer");

      const log = toMissionLog(confirmed, {
        id: "log-1",
        date: "2026-10-03",
        createdAt: "2026-10-03T10:00:00Z",
      });
      expect(log).toEqual({
        id: "log-1",
        date: "2026-10-03",
        missionId: "test-mission",
        status: "completed",
        company: "alone",
        confirmedBy: "child",
        createdAt: "2026-10-03T10:00:00Z",
      });
    });

    it("other company accepts other-tap confirmation and rejects others", () => {
      let run = createRun(TEST_MISSION);
      run = chooseCompany(run, "other");
      run = start(run, 0);
      run = tick(run, 50000);

      expect(() => confirm(run, "child", 51000)).toThrow("not allowed for company");
      expect(() => confirm(run, "parent-pin", 51000)).toThrow("not allowed for company");

      const confirmed = confirm(run, "other-tap", 51000);
      expect(confirmed.phase).toBe("confirmed");
      expect(confirmed.confirmedBy).toBe("other-tap");

      const log = toMissionLog(confirmed, {
        id: "log-2",
        date: "2026-10-03",
        createdAt: "2026-10-03T10:00:00Z",
      });
      expect(log.status).toBe("completed");
      expect(log.company).toBe("other");
      expect(log.confirmedBy).toBe("other-tap");
    });

    it("family company accepts parent-pin confirmation and rejects others", () => {
      let run = createRun(TEST_MISSION);
      run = chooseCompany(run, "family");
      run = start(run, 0);
      run = tick(run, 50000);

      expect(() => confirm(run, "child", 51000)).toThrow("not allowed for company");
      expect(() => confirm(run, "other-tap", 51000)).toThrow("not allowed for company");

      const confirmed = confirm(run, "parent-pin", 51000);
      expect(confirmed.phase).toBe("confirmed");
      expect(confirmed.confirmedBy).toBe("parent-pin");

      const log = toMissionLog(confirmed, {
        id: "log-3",
        date: "2026-10-03",
        createdAt: "2026-10-03T10:00:00Z",
      });
      expect(log.status).toBe("completed");
      expect(log.company).toBe("family");
      expect(log.confirmedBy).toBe("parent-pin");
    });
  });

  describe("Stop / Rest functionality", () => {
    it("can stop while running and produces a rest log with confirmedBy child", () => {
      let run = createRun(TEST_MISSION);
      run = chooseCompany(run, "family");
      run = start(run, 0);
      run = tick(run, 15000); // stopped midway

      const stopped = stop(run);
      expect(stopped.phase).toBe("stopped");
      expect(stopped.confirmedBy).toBe("child");

      const log = toMissionLog(stopped, {
        id: "log-rest",
        date: "2026-10-03",
        createdAt: "2026-10-03T10:00:00Z",
      });
      expect(log).toEqual({
        id: "log-rest",
        date: "2026-10-03",
        missionId: "test-mission",
        status: "rest",
        company: "family",
        confirmedBy: "child",
        createdAt: "2026-10-03T10:00:00Z",
      });
    });

    it("defaults to alone company if stopped before company selection", () => {
      const run = createRun(TEST_MISSION);
      const stopped = stop(run);
      const log = toMissionLog(stopped, {
        id: "log-early",
        date: "2026-10-03",
        createdAt: "2026-10-03T10:00:00Z",
      });
      expect(log.status).toBe("rest");
      expect(log.company).toBe("alone");
      expect(log.confirmedBy).toBe("child");
    });

    it("refuses stop if run was already confirmed", () => {
      let run = createRun(TEST_MISSION);
      run = start(run, 0);
      run = tick(run, 50000);
      const confirmed = confirm(run, "child", 51000);

      expect(() => stop(confirmed)).toThrow("already confirmed");
    });

    it("is idempotent when stop is called multiple times", () => {
      const run = createRun(TEST_MISSION);
      const stopped = stop(run);
      expect(stop(stopped)).toBe(stopped);
    });

    it("refuses to generate log from unconfirmed/unstopped run", () => {
      const run = createRun(TEST_MISSION);
      expect(() =>
        toMissionLog(run, {
          id: "x",
          date: "2026-10-03",
          createdAt: "2026-10-03T10:00:00Z",
        }),
      ).toThrow('run in phase "choosing-company"');

      const running = start(run, 0);
      expect(() =>
        toMissionLog(running, {
          id: "x",
          date: "2026-10-03",
          createdAt: "2026-10-03T10:00:00Z",
        }),
      ).toThrow('run in phase "running"');
    });
  });
});
