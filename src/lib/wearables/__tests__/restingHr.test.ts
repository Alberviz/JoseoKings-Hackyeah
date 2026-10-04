import { describe, expect, it } from "vitest";
import { nocturnalRestingHr } from "../restingHr";

describe("restingHr (A3 Nocturnal resting heart rate)", () => {
  it("finds the lowest 30-min window mean inside sleep session and ignores artifacts", () => {
    const start = 0;
    const end = 240 * 60_000;
    const samples = [];
    for (let minute = 0; minute < 240; minute += 1) {
      // Trough at minutes 100..129
      const bpm = minute >= 100 && minute < 130 ? 40 : 80;
      samples.push({ timestamp: minute * 60_000 + 1000, bpm });
    }
    // Artifact spike during first 20 minutes
    for (let minute = 0; minute < 20; minute += 1) {
      samples[minute].bpm = 200;
    }

    const night = nocturnalRestingHr(samples, { start, end });
    expect(night.kind).toBe("value");
    if (night.kind === "value") {
      expect(night.nRhr).toBe(40);
      expect(night.coveredMinutes).toBe(240);
      expect(night.qualifyingWindows).toBeGreaterThan(0);
    }
  });

  it("returns insufficient-data when sample coverage is below required thresholds", () => {
    const few = Array.from({ length: 10 }, (_, i) => ({
      timestamp: i * 60_000,
      bpm: 60,
    }));
    const rejected = nocturnalRestingHr(few, { start: 0, end: 8 * 60 * 60_000 });
    expect(rejected.kind).toBe("insufficient-data");
    expect(rejected.nRhr).toBeNull();

    // Sparse coverage: every 2 minutes for 300 minutes -> 150 covered, but windows only have 15 points (< 20 needed)
    const sparse = [];
    for (let minute = 0; minute < 300; minute += 2) {
      sparse.push({ timestamp: minute * 60_000, bpm: 55 });
    }
    const thin = nocturnalRestingHr(sparse, { start: 0, end: 300 * 60_000 });
    expect(thin.kind).toBe("insufficient-data");
    expect(thin.nRhr).toBeNull();
  });

  it("handles null, undefined or invalid sessions safely", () => {
    const res1 = nocturnalRestingHr([], null);
    expect(res1.kind).toBe("insufficient-data");

    const res2 = nocturnalRestingHr([], { start: 1000, end: 500 });
    expect(res2.kind).toBe("insufficient-data");
  });
});
