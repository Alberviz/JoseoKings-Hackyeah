import { describe, expect, it } from "vitest";
import { MISSION_IDS, QUESTION_IDS } from "@/config/content-ids";
import {
  CHECK_IN_QUESTIONS,
  CHILD_VISIBILITY_NOTE,
  MISSION_STOP_MESSAGE,
  MISSIONS,
  PATTERNS_DISCLAIMER,
  REPORT_DISCLAIMER,
} from "./index";

const ALLOWED_POSE_KEYS = ["idle", "breathe", "stretch", "balance", "strength", "cheer"] as const;

const FORBIDDEN_WORDS = [
  "treat",
  "treats",
  "prevent",
  "prevents",
  "protect",
  "protects",
  "clinical",
  "therapy",
  "prescription",
  "diagnosis",
  "risk score",
  "optimal",
  "trigger",
  "verified",
  "unverified",
  "proves",
  "first-ever",
  "fully functional",
  "jump",
  "hop",
  "leap",
  "run",
] as const;

describe("Check-in questions", () => {
  it("defines exactly the three core questions matching QUESTION_IDS", () => {
    const expectedIds = Object.values(QUESTION_IDS);
    expect(CHECK_IN_QUESTIONS).toHaveLength(expectedIds.length);

    const questionIds = CHECK_IN_QUESTIONS.map((q) => q.id);
    expect(questionIds).toEqual(expectedIds);

    for (const question of CHECK_IN_QUESTIONS) {
      expect(expectedIds).toContain(question.id);
    }
  });

  it("uses the required kind values for each core question", () => {
    const belly = CHECK_IN_QUESTIONS.find((q) => q.id === QUESTION_IDS.bellyComfort);
    const energy = CHECK_IN_QUESTIONS.find((q) => q.id === QUESTION_IDS.energy);
    const play = CHECK_IN_QUESTIONS.find((q) => q.id === QUESTION_IDS.playPace);

    expect(belly?.kind).toBe("faces");
    expect(energy?.kind).toBe("battery");
    expect(play?.kind).toBe("counter");
  });

  it("has exactly three options (values 0, 1, 2) per question with unique labels and iconKeys", () => {
    for (const question of CHECK_IN_QUESTIONS) {
      expect(question.options).toHaveLength(3);

      const values = question.options.map((o) => o.value);
      expect(values).toEqual([0, 1, 2]);

      const labels = question.options.map((o) => o.label.trim());
      expect(new Set(labels).size).toBe(3);
      for (const label of labels) {
        expect(label.length).toBeGreaterThan(0);
      }

      const iconKeys = question.options.map((o) => o.iconKey.trim());
      expect(new Set(iconKeys).size).toBe(3);
      for (const iconKey of iconKeys) {
        expect(iconKey).toMatch(/^[a-z]+(-[a-z]+)*$/);
      }
    }
  });
});

describe("Missions", () => {
  it("defines exactly one mission for each id in MISSION_IDS", () => {
    const expectedMissionIds = Object.values(MISSION_IDS);
    expect(MISSIONS).toHaveLength(expectedMissionIds.length);

    const missionIds = MISSIONS.map((m) => m.id);
    expect(new Set(missionIds).size).toBe(expectedMissionIds.length);

    for (const expectedId of expectedMissionIds) {
      const match = MISSIONS.filter((m) => m.id === expectedId);
      expect(match).toHaveLength(1);
    }
  });

  it("has step counts and durations within allowed ranges", () => {
    for (const mission of MISSIONS) {
      expect(mission.steps.length).toBeGreaterThanOrEqual(3);
      expect(mission.steps.length).toBeLessThanOrEqual(5);

      let totalDuration = 0;
      for (const step of mission.steps) {
        expect(step.text.trim().length).toBeGreaterThan(0);
        expect(step.durationSeconds).toBeGreaterThanOrEqual(8);
        expect(step.durationSeconds).toBeLessThanOrEqual(20);
        totalDuration += step.durationSeconds;
      }

      expect(totalDuration).toBeGreaterThanOrEqual(60);
      expect(totalDuration).toBeLessThanOrEqual(120);
    }
  });

  it("only uses poseKeys from the allowed list", () => {
    for (const mission of MISSIONS) {
      for (const step of mission.steps) {
        expect(ALLOWED_POSE_KEYS).toContain(step.poseKey);
      }
    }
  });

  it("has a non-empty neutral parentNote for each mission", () => {
    for (const mission of MISSIONS) {
      expect(mission.parentNote.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("Disclaimers", () => {
  it("exports REPORT_DISCLAIMER matching docs/PRODUCT.md section 6.3 verbatim", () => {
    const expected =
      "Summary written by the family from what the child and carers entered. It is not a medical assessment, it makes no diagnosis and it gives no advice. It is meant to help the family talk with the care team.";
    expect(REPORT_DISCLAIMER).toBe(expected);
  });

  it("exports PATTERNS_DISCLAIMER describing entries rather than medical assessments", () => {
    expect(PATTERNS_DISCLAIMER.trim().length).toBeGreaterThan(0);
    expect(PATTERNS_DISCLAIMER).toMatch(/counts and colours/i);
    expect(PATTERNS_DISCLAIMER).toMatch(/medical assessment/i);
  });

  it("exports CHILD_VISIBILITY_NOTE reassuring the child about parent visibility", () => {
    expect(CHILD_VISIBILITY_NOTE.trim().length).toBeGreaterThan(0);
    expect(CHILD_VISIBILITY_NOTE).toMatch(/parents/i);
  });

  it("exports MISSION_STOP_MESSAGE reassuring about stopping early and resting", () => {
    expect(MISSION_STOP_MESSAGE.trim().length).toBeGreaterThan(0);
    expect(MISSION_STOP_MESSAGE).toMatch(/body|rest/i);
  });
});

describe("Content safety and guidelines", () => {
  const allAuthoredTexts: string[] = [
    // Question prompts and labels
    ...CHECK_IN_QUESTIONS.flatMap((q) => [q.prompt, ...q.options.map((o) => o.label)]),
    // Mission titles, steps, and parent notes
    ...MISSIONS.flatMap((m) => [m.title, m.parentNote, ...m.steps.map((s) => s.text)]),
    // Authored disclaimers
    PATTERNS_DISCLAIMER,
    CHILD_VISIBILITY_NOTE,
    MISSION_STOP_MESSAGE,
  ];

  it("contains no percent signs anywhere in content", () => {
    const allTexts = [...allAuthoredTexts, REPORT_DISCLAIMER];
    for (const text of allTexts) {
      expect(text).not.toContain("%");
    }
  });

  it("contains no forbidden words in authored content", () => {
    for (const text of allAuthoredTexts) {
      for (const word of FORBIDDEN_WORDS) {
        const regex = new RegExp(`\\b${word}\\b`, "i");
        expect(text).not.toMatch(regex);
      }
    }
  });

  it("REPORT_DISCLAIMER contains no forbidden words except approved negation in PRODUCT.md 6.3", () => {
    // REPORT_DISCLAIMER is the mandatory exact quote from docs/PRODUCT.md section 6.3:
    // "it makes no diagnosis and it gives no advice."
    for (const word of FORBIDDEN_WORDS.filter((w) => w !== "diagnosis")) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      expect(REPORT_DISCLAIMER).not.toMatch(regex);
    }
    expect(REPORT_DISCLAIMER).toMatch(/\bmakes no diagnosis\b/i);
  });
});
