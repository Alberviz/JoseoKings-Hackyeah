import { describe, expect, it } from "vitest";
import { hampel } from "../clean";

describe("clean (A1 Hampel outlier filter)", () => {
  it("replaces a planted spike and leaves a genuine step change untouched", () => {
    const series: number[] = [];
    for (let i = 0; i < 20; i += 1) series.push(100 + (i % 3));
    for (let i = 0; i < 10; i += 1) series.push(106 + (i % 3));

    const spikeAt = 8;
    series[spikeAt] = 1000;

    const cleaned = hampel(series);
    expect(cleaned.replacedIndices).toEqual([spikeAt]);
    expect(cleaned.values[spikeAt]).toBe(101);

    // Step change from index 20 to 30 is preserved
    for (let i = 20; i < 30; i += 1) {
      expect(cleaned.values[i]).toBe(series[i]);
    }
  });

  it("leaves null days as null and does not replace when window has fewer than 5 points", () => {
    const series = [100, 101, 102, 100, 1000, 101, 102];
    const gapped = series.map((val, idx) => (idx === 1 || idx === 2 || idx === 3 ? null : val));
    const res = hampel(gapped);
    expect(res.values[1]).toBeNull();
    // With only 4 points present, minPoints=5 is not met so spike is kept
    expect(res.replacedIndices.length).toBe(0);
  });

  it("does not alter a flat series where MAD is zero", () => {
    const flat = [50, 50, 50, 50, 50, 50, 50];
    const res = hampel(flat);
    expect(res.replacedIndices).toEqual([]);
    expect(res.values).toEqual(flat);
  });
});
