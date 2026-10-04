import { describe, expect, it } from "vitest";
import {
  BASELINE_MAX_LOOKBACK_DAYS,
  outsideUsualRange,
  personalBaseline,
  rangeBand,
} from "../baseline";
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

  it("looks back at most 28 calendar days and never pulls in older days across a gap", () => {
    expect(BASELINE_MAX_LOOKBACK_DAYS).toBe(28);
    // 14 old days at 50, then a 20-day gap, then a new day at 80 on index 34.
    const series: Array<number | null> = [
      ...Array.from({ length: 14 }, () => 50),
      ...Array.from({ length: 20 }, () => null),
      80,
    ];
    const result = personalBaseline(series, { sMin: 1 });
    // Old days sit 21 to 34 days before index 34; only those within 28 days count (indices 6 to 13).
    expect(result[34]?.kind).toBe("insufficient-data");
    if (result[34]?.kind === "insufficient-data") {
      expect(result[34].reason).toBe("collecting-baseline");
      expect(result[34].have).toBe(8);
      expect(result[34].need).toBe(14);
    }
  });

  it("keeps the 14 valid days minimum and still builds a baseline inside the 28 day window", () => {
    // 14 valid days spread over 28 calendar days (every other day), target on index 28.
    const series: Array<number | null> = Array.from({ length: 29 }, (_, i) =>
      i === 28 ? 60 : i % 2 === 0 ? 50 : null,
    );
    const result = personalBaseline(series, { sMin: 1 });
    expect(result[28]?.kind).toBe("value");
    if (result[28]?.kind === "value") expect(result[28].median).toBe(50);

    // One day further and the oldest valid day falls out of the window.
    const longer = [...series.slice(0, 28), null, 60];
    const later = personalBaseline(longer, { sMin: 1 });
    expect(later[29]?.kind).toBe("insufficient-data");
    if (later[29]?.kind === "insufficient-data") expect(later[29].have).toBe(13);
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
