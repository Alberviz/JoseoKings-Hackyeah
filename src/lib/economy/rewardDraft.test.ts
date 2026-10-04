import { describe, expect, it } from "vitest";
import { generateRewardId, parseRewardDraft } from "./rewardDraft";

describe("parseRewardDraft", () => {
  it("accepts a trimmed name and a whole-number price", () => {
    expect(parseRewardDraft("  Movie   night ", " 40 ")).toEqual({
      ok: true,
      name: "Movie night",
      fireCost: 40,
    });
  });

  it("rejects an empty or too long name", () => {
    expect(parseRewardDraft("   ", "10")).toMatchObject({ ok: false, field: "name" });
    expect(parseRewardDraft("x".repeat(41), "10")).toMatchObject({ ok: false, field: "name" });
    expect(parseRewardDraft("x".repeat(40), "10").ok).toBe(true);
  });

  it("rejects prices that are not whole numbers from 1 to 100", () => {
    for (const bad of ["", "0", "101", "-5", "2.5", "1e1", "abc"]) {
      expect(parseRewardDraft("Kart day", bad)).toMatchObject({ ok: false, field: "cost" });
    }
    expect(parseRewardDraft("Kart day", "1").ok).toBe(true);
    expect(parseRewardDraft("Kart day", "100").ok).toBe(true);
  });
});

describe("generateRewardId", () => {
  it("returns unique ids", () => {
    expect(generateRewardId()).not.toBe(generateRewardId());
    expect(generateRewardId().startsWith("reward-")).toBe(true);
  });
});
