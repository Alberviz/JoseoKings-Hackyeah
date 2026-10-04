import { describe, expect, it } from "vitest";
import { createVarianceAccumulator, MOTION_MIN_SAMPLES } from "./motionVariance";

describe("createVarianceAccumulator", () => {
  it("returns null with too few readings", () => {
    const acc = createVarianceAccumulator();
    for (let i = 0; i < MOTION_MIN_SAMPLES - 1; i += 1) acc.add(i);
    expect(acc.result()).toBeNull();
  });

  it("computes the population variance", () => {
    const acc = createVarianceAccumulator();
    for (let i = 0; i < MOTION_MIN_SAMPLES; i += 1) acc.add(i % 2 === 0 ? 0 : 2);
    expect(acc.result()).toBeCloseTo(1, 6);
  });

  it("is zero for a still signal and ignores non-finite values", () => {
    const acc = createVarianceAccumulator();
    acc.add(Number.NaN);
    for (let i = 0; i < MOTION_MIN_SAMPLES; i += 1) acc.add(9.8);
    expect(acc.result()).toBeCloseTo(0, 6);
  });
});
