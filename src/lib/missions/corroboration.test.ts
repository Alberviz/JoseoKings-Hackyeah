import { describe, expect, it } from "vitest";
import { MISSION_IDS } from "@/config/content-ids";
import { syncCompanion, totalPoints, totalTeamStars } from "@/lib/rewards";
import type { CompanionState, MissionLog } from "@/types";
import { missionLogSchema } from "@/lib/storage/schemas";
import { corroborateMission, corroborationLabel } from "./corroboration";

const START = 1_000_000;
const END = START + 120_000;

describe("corroborateMission", () => {
  it("returns wearable when steps in the window are enough", () => {
    const result = corroborateMission({
      startMs: START,
      endMs: END,
      wearableSamples: [
        { at: START + 10_000, steps: 15 },
        { at: START + 60_000, steps: 15 },
        { at: END + 5_000, steps: 500 },
      ],
    });
    expect(result).toBe("wearable");
  });

  it("ignores wearable samples outside the window", () => {
    expect(
      corroborateMission({
        startMs: START,
        endMs: END,
        wearableSamples: [{ at: START - 1_000, steps: 400, heartRate: 150 }],
      }),
    ).toBeUndefined();
  });

  it("returns wearable when the heart rate rises enough", () => {
    expect(
      corroborateMission({
        startMs: START,
        endMs: END,
        wearableSamples: [
          { at: START + 5_000, heartRate: 80 },
          { at: START + 90_000, heartRate: 96 },
        ],
      }),
    ).toBe("wearable");
  });

  it("does not trust a single heart rate reading", () => {
    expect(
      corroborateMission({
        startMs: START,
        endMs: END,
        wearableSamples: [{ at: START + 5_000, heartRate: 140 }],
      }),
    ).toBeUndefined();
  });

  it("falls back to device motion", () => {
    expect(corroborateMission({ startMs: START, endMs: END, motionVariance: 2 })).toBe("motion");
    expect(
      corroborateMission({ startMs: START, endMs: END, motionVariance: 0.01 }),
    ).toBeUndefined();
  });

  it("prefers the wearable over the device", () => {
    expect(
      corroborateMission({
        startMs: START,
        endMs: END,
        motionVariance: 5,
        wearableSamples: [{ at: START + 1_000, steps: 100 }],
      }),
    ).toBe("wearable");
  });

  it("returns nothing without data or with a reversed window", () => {
    expect(corroborateMission({ startMs: START, endMs: END })).toBeUndefined();
    expect(corroborateMission({ startMs: END, endMs: START, motionVariance: 9 })).toBeUndefined();
  });

  it("has neutral labels", () => {
    expect(corroborationLabel("wearable")).toBe("Wearable recorded movement");
    expect(corroborationLabel("motion")).toBe("Device recorded movement");
  });
});

describe("corroboration never changes rewards", () => {
  const companion: CompanionState = {
    name: "Nova",
    points: 0,
    teamStars: 0,
    ownedItemIds: [],
    equippedItemIds: [],
    badgeIds: [],
  };
  const base = (id: string, over: Partial<MissionLog> = {}): MissionLog => ({
    id,
    date: "2026-10-01",
    missionId: MISSION_IDS.wallSit,
    status: "completed",
    company: "family",
    confirmedBy: "parent-pin",
    createdAt: "2026-10-01T18:00:00.000Z",
    ...over,
  });

  it("gives the same reward result with and without corroboration", () => {
    const plain = [base("a"), base("b", { status: "rest", company: "alone" })];
    const withLabels = [
      base("a", { corroboration: "wearable" }),
      base("b", { status: "rest", company: "alone", corroboration: "motion" }),
    ];
    expect(totalPoints([], withLabels)).toBe(totalPoints([], plain));
    expect(totalTeamStars(withLabels)).toBe(totalTeamStars(plain));
    expect(syncCompanion({ checkIns: [], missionLogs: withLabels, companion })).toEqual(
      syncCompanion({ checkIns: [], missionLogs: plain, companion }),
    );
  });

  it("keeps old logs without the field valid", () => {
    expect(missionLogSchema.safeParse(base("a")).success).toBe(true);
    expect(missionLogSchema.safeParse(base("a", { corroboration: "motion" })).success).toBe(true);
    expect(missionLogSchema.safeParse({ ...base("a"), corroboration: "magic" }).success).toBe(
      false,
    );
  });
});
