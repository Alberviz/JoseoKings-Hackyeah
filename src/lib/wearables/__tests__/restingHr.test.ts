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

  it("labels a per-minute night as the dense method", () => {
    const samples = [];
    for (let minute = 0; minute < 240; minute += 1) {
      samples.push({ timestamp: minute * 60_000 + 1000, bpm: 60 });
    }
    const night = nocturnalRestingHr(samples, { start: 0, end: 240 * 60_000 });
    expect(night.kind).toBe("value");
    if (night.kind === "value") {
      expect(night.method).toBe("dense-30min");
      expect(night.nRhr).toBe(60);
      expect(night.medianGapMin).toBe(1);
    }
  });

  it("handles null, undefined or invalid sessions safely", () => {
    const res1 = nocturnalRestingHr([], null);
    expect(res1.kind).toBe("insufficient-data");

    const res2 = nocturnalRestingHr([], { start: 1000, end: 500 });
    expect(res2.kind).toBe("insufficient-data");
  });

  describe("sparse mode (readings about every 30 minutes)", () => {
    const MIN = 60_000;
    // 500-minute night with a reading at :01 and :31 of each half hour, 17 readings at most.
    const session = { start: 0, end: 500 * MIN };
    const grid = (bpms: number[], gapMin = 30) =>
      bpms.map((bpm, i) => ({ timestamp: (1 + i * gapMin) * MIN, bpm }));

    it("returns the lowest mean of 3 readings in a row for a U-shaped night", () => {
      const bpms = [72, 68, 64, 60, 57, 55, 54, 55, 58, 62, 66, 70, 73, 75, 76, 77];
      const night = nocturnalRestingHr(grid(bpms), session);
      expect(night.kind).toBe("value");
      if (night.kind === "value") {
        expect(night.method).toBe("sparse-3-readings");
        expect(night.sampleCount).toBe(16);
        expect(night.medianGapMin).toBe(30);
        // trough: 55, 54, 55
        expect(night.nRhr).toBe(54.7);
      }
    });

    it("does not let a single low reading set the minimum", () => {
      const bpms = [70, 70, 70, 70, 40, 70, 70, 70, 70, 70];
      const night = nocturnalRestingHr(grid(bpms), session);
      expect(night.kind).toBe("value");
      if (night.kind === "value") {
        expect(night.nRhr).toBe(60);
        expect(night.nRhr).not.toBe(40);
      }
    });

    it("needs at least 6 readings", () => {
      const night = nocturnalRestingHr(grid([60, 58, 56, 57, 59]), session);
      expect(night.kind).toBe("insufficient-data");
      expect(night.nRhr).toBeNull();
      expect(night.method).toBe("sparse-3-readings");
      expect(night.sampleCount).toBe(5);
    });

    it("needs the readings to span at least 150 minutes", () => {
      // 6 readings every 29 minutes: span 145 minutes
      const night = nocturnalRestingHr(grid([60, 58, 56, 57, 59, 61], 29), session);
      expect(night.kind).toBe("insufficient-data");
      // 6 readings every 30 minutes: span 150 minutes
      const ok = nocturnalRestingHr(grid([60, 58, 56, 57, 59, 61], 30), session);
      expect(ok.kind).toBe("value");
    });

    it("keeps the dense method when the median gap is exactly 5 minutes", () => {
      const samples = [];
      for (let minute = 0; minute < 500; minute += 5) {
        samples.push({ timestamp: minute * MIN + 1000, bpm: 60 });
      }
      const night = nocturnalRestingHr(samples, session);
      // 5-minute gaps are dense mode; windows then hold only 6 minutes (< 20), so no value.
      expect(night.method).toBe("dense-30min");
      expect(night.kind).toBe("insufficient-data");
    });

    it("switches to sparse as soon as the median gap is above 5 minutes", () => {
      const night = nocturnalRestingHr(grid([60, 58, 56, 57, 59, 61, 62], 6 * 30), {
        start: 0,
        end: 1300 * MIN,
      });
      expect(night.method).toBe("sparse-3-readings");
    });

    it("counts several readings in one minute once", () => {
      const doubled = grid([60, 58, 56, 57, 59, 61]).flatMap((s) => [
        s,
        { timestamp: s.timestamp + 5000, bpm: s.bpm + 20 },
      ]);
      const night = nocturnalRestingHr(doubled, session);
      expect(night.sampleCount).toBe(6);
    });
  });
});
