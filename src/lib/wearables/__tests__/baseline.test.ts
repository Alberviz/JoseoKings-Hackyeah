import { describe, expect, it } from "vitest";
import { outsideUsualRange, personalBaseline, rangeBand } from "../baseline";
import { median } from "../stats";

describe("baseline (A2 Personal baseline & A9 outside-range)", () => {
  it("never uses future days or day t in the trailing baseline calculation", () => {
    const series = Array.from({ length: 30 }, (_, i) => 20 + (i % 4));
    const at = 20;
    const original = personalBaseline(series, { sMin: 1 });

    const withFuture = series.slice();
    withFuture[21] = 10_000;
    withFuture[29] = -10_000;
    expect(personalBaseline(withFuture, { sMin: 1 })[at]).toEqual(original[at]);

    const withOwnValue = series.slice();
    withOwnValue[at] = 10_000;
    const shifted = personalBaseline(withOwnValue, { sMin: 1 });

    expect(shifted[at]?.kind).toBe("value");
    if (shifted[at]?.kind === "value" && original[at]?.kind === "value") {
      expect(shifted[at].median).toBe(original[at].median);
      expect(shifted[at].d).not.toBe(original[at].d);
      expect(original[at].median).toBe(median(series.slice(at - 14, at)));
    }

    expect(original[13]?.kind).toBe("insufficient-data");
    if (original[13]?.kind === "insufficient-data") {
      expect(original[13].have).toBe(13);
      expect(original[13].reason).toBe("collecting-baseline");
    }
  });

  it("restarts the 14-day baseline collection when a device break occurs", () => {
    const series = Array.from({ length: 40 }, () => 50);
    const reset = personalBaseline(series, { sMin: 1, breaks: [30] });

    expect(reset[29]?.kind).toBe("value");
    expect(reset[30]?.kind).toBe("insufficient-data");
    if (reset[39]?.kind === "insufficient-data") {
      expect(reset[39].have).toBe(9);
    }
  });

  it("classifies range bands strictly using +-2 thresholds", () => {
    expect(rangeBand(-2.5)).toBe("below");
    expect(rangeBand(-2.0)).toBe("within");
    expect(rangeBand(0)).toBe("within");
    expect(rangeBand(2.0)).toBe("within");
    expect(rangeBand(2.1)).toBe("above");
  });

  it("marks |D| > 3 and consecutive same-sign runs under A9, not runs broken by null", () => {
    const deviations = [2.9, 0, 0, 3.1, 0, 2.2, 2.2, 2.2, null, 2.2, null, 2.2];
    const marked = outsideUsualRange(deviations);

    expect(marked[0]).toBe(false); // 2.9 is <= 3 and isolated
    expect(marked[3]).toBe(true); // 3.1 is > 3 (Rule 1)
    expect(marked[5]).toBe(true); // run of 3 consecutive > 2 (Rule 2)
    expect(marked[6]).toBe(true);
    expect(marked[7]).toBe(true);
    expect(marked[9]).toBe(false); // broken by null at 8
    expect(marked[11]).toBe(false);
  });
});
