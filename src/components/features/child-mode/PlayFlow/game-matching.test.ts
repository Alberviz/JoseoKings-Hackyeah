import { describe, expect, it } from "vitest";
import { getCoinsForPlay, getMatchingPlayGames, toMoveKey } from "./game-matching";
import type { PlayGame } from "@/content/games";

describe("game-matching", () => {
  it("returns exact matches when available", () => {
    const games = getMatchingPlayGames("alone", 1);
    expect(games.length).toBeGreaterThan(0);
    expect(games.every((g) => g.mode === "alone" && g.level === 1)).toBe(true);
  });

  it("falls back to nearest lower level if current level has no games", () => {
    const mockGames: PlayGame[] = [
      {
        id: "game-1",
        title: "Level 1 Game",
        kind: "breathing",
        mode: "alone",
        level: 1,
        parentNote: "note",
        steps: [],
      },
    ];
    const games = getMatchingPlayGames("alone", 3, mockGames);
    expect(games).toHaveLength(1);
    expect(games[0]?.id).toBe("game-1");
  });

  it("falls back to any game of the same mode if lower levels have no games", () => {
    const mockGames: PlayGame[] = [
      {
        id: "game-3",
        title: "Level 3 Game",
        kind: "breathing",
        mode: "alone",
        level: 3,
        parentNote: "note",
        steps: [],
      },
    ];
    const games = getMatchingPlayGames("alone", 1, mockGames);
    expect(games).toHaveLength(1);
    expect(games[0]?.id).toBe("game-3");
  });

  it("toMoveKey correctly maps reach-up and twist and valid moves", () => {
    expect(toMoveKey("reach-up")).toBe("stretch-side");
    expect(toMoveKey("twist")).toBe("stretch-side");
    expect(toMoveKey("march")).toBe("march");
    expect(toMoveKey("walk")).toBe("walk");
    expect(toMoveKey("non-existent-pose")).toBe("hold-pose");
  });

  it("getCoinsForPlay returns 12 for completed and 6 for rest", () => {
    expect(getCoinsForPlay("completed")).toBe(12);
    expect(getCoinsForPlay("rest")).toBe(6);
  });
});
