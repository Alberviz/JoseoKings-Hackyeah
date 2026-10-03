import { describe, expect, it } from "vitest";
import { formatMissionTitle } from "./missionLabels";

describe("formatMissionTitle", () => {
  it("formats kebab-case mission ids into capitalized readable titles", () => {
    expect(formatMissionTitle("dragon-breathing")).toBe("Dragon breathing");
    expect(formatMissionTitle("bed-stretch")).toBe("Bed stretch");
    expect(formatMissionTitle("flamingo-balance")).toBe("Flamingo balance");
    expect(formatMissionTitle("wall-sit")).toBe("Wall sit");
    expect(formatMissionTitle("rolling-wave")).toBe("Rolling wave");
  });

  it("handles single-word or empty ids gracefully", () => {
    expect(formatMissionTitle("breathing")).toBe("Breathing");
    expect(formatMissionTitle("")).toBe("");
  });
});
