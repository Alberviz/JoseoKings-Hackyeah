import { describe, expect, it } from "vitest";
import { assessDay, assessNight, isDstShift, localDayDurationHours } from "../validity";

describe("validity (A0 wear-time rule)", () => {
  const day = "2026-06-01";

  function atHour(hour: number) {
    return {
      timestamp: Date.parse(`${day}T${String(hour).padStart(2, "0")}:30:00Z`),
      bpm: 70,
    };
  }

  it("marks a day invalid when daytime wear is below 10 hours and valid when >= 10 hours", () => {
    const nine = [];
    for (let hour = 7; hour < 16; hour += 1) nine.push(atHour(hour));
    const ten = nine.concat([atHour(16)]);

    const short = assessDay({ day, timeZone: "UTC", heartRateSamples: nine });
    const enough = assessDay({ day, timeZone: "UTC", heartRateSamples: ten });

    expect(short.daytimeHours).toBe(9);
    expect(short.daytimeValid).toBe(false);
    expect(enough.daytimeHours).toBe(10);
    expect(enough.daytimeValid).toBe(true);
  });

  it("enforces night length, sample counts, and coverage thresholds according to A0", () => {
    const onset = Date.parse("2026-06-01T22:00:00Z");
    const night = (durationMin: number, sampleCount: number) => {
      const end = onset + durationMin * 60_000;
      const heartRateSamples = [];
      for (let i = 0; i < sampleCount; i += 1) {
        heartRateSamples.push({
          timestamp: onset + i * 60_000 + 500,
          bpm: 58,
        });
      }
      return assessDay({
        day: "2026-06-02",
        timeZone: "UTC",
        heartRateSamples,
        sleepSessions: [{ start: onset, end }],
      });
    };

    expect(night(179, 150).nightValid).toBe(false);
    expect(night(181, 150).nightValid).toBe(true);
    expect(night(181, 10).nightValid).toBe(false);
  });

  it("handles check-in validity and notToday responses correctly", () => {
    const notToday = assessDay({
      day,
      timeZone: "UTC",
      heartRateSamples: [],
      checkIn: {
        bellyComfort: "notToday",
        energy: "notToday",
        playPace: "notToday",
      },
    });
    expect(notToday.checkInValid).toBe(false);
    expect(notToday.notToday).toBe(true);

    const oneAnswer = assessDay({
      day,
      timeZone: "UTC",
      heartRateSamples: [],
      checkIn: { bellyComfort: 0, energy: "notToday", playPace: null },
    });
    expect(oneAnswer.checkInValid).toBe(true);
    expect(oneAnswer.items.energy).toBe("notToday");
    expect(oneAnswer.items.bellyComfort).toBe(0);
    expect(oneAnswer.items.playPace).toBeNull();
  });

  it("detects DST shifts accurately by computing local day duration", () => {
    expect(localDayDurationHours("2026-10-25", "Europe/Warsaw")).toBe(25);
    expect(localDayDurationHours("2026-03-29", "Europe/Warsaw")).toBe(23);
    expect(isDstShift("2026-10-25", "Europe/Warsaw")).toBe(true);
    expect(isDstShift("2026-06-15", "Europe/Warsaw")).toBe(false);
  });

  it("selects the longest sleep session as main sleep deterministically", () => {
    const onset1 = Date.parse("2026-06-01T22:00:00Z");
    const end1 = onset1 + 120 * 60_000;
    const onset2 = Date.parse("2026-06-02T01:00:00Z");
    const end2 = onset2 + 300 * 60_000;

    const samples = [];
    for (let i = 0; i < 200; i += 1) {
      samples.push({ timestamp: onset2 + i * 60_000, bpm: 60 });
    }

    const res = assessNight(
      samples,
      [
        { start: onset1, end: end1 },
        { start: onset2, end: end2 },
      ],
      "2026-06-02",
      "UTC",
    );

    expect(res.nightValid).toBe(true);
    expect(res.mainSleep?.durationMin).toBe(300);
    expect(res.mainSleep?.start).toBe(onset2);
  });

  describe("sparse heart-rate sampling and the source's main-sleep flag", () => {
    const MIN = 60_000;
    const grid = (start: number, count: number, gapMin = 30) =>
      Array.from({ length: count }, (_, i) => ({
        timestamp: start + (1 + i * gapMin) * MIN,
        bpm: 58,
      }));

    it("accepts a 30-minute grid night with 16 readings", () => {
      const start = Date.parse("2026-06-01T22:00:00Z");
      const res = assessNight(
        grid(start, 16),
        [{ start, end: start + 500 * MIN }],
        "2026-06-02",
        "UTC",
      );
      expect(res.hrMethod).toBe("sparse-3-readings");
      expect(res.hrMedianGapMin).toBe(30);
      expect(res.nightValid).toBe(true);
    });

    it("rejects a sparse night with 5 readings or a short span", () => {
      const start = Date.parse("2026-06-01T22:00:00Z");
      const session = [{ start, end: start + 500 * MIN }];
      expect(assessNight(grid(start, 5), session, "2026-06-02", "UTC").nightValid).toBe(false);
      expect(assessNight(grid(start, 6, 29), session, "2026-06-02", "UTC").nightValid).toBe(false);
      expect(assessNight(grid(start, 6, 30), session, "2026-06-02", "UTC").nightValid).toBe(true);
    });

    it("keeps the dense thresholds when readings are about every minute", () => {
      const start = Date.parse("2026-06-01T22:00:00Z");
      const dense = Array.from({ length: 19 }, (_, i) => ({
        timestamp: start + i * MIN,
        bpm: 58,
      }));
      const res = assessNight(dense, [{ start, end: start + 500 * MIN }], "2026-06-02", "UTC");
      expect(res.hrMethod).toBe("dense-30min");
      expect(res.nightValid).toBe(false);
    });

    it("skips the onset and offset windows when the source flags the main sleep", () => {
      // Onset 05:00 (outside [18:00, 04:00)), offset 13:20
      const start = Date.parse("2026-06-02T05:00:00Z");
      const end = start + 500 * MIN;
      const samples = grid(start, 16);
      const flagged = assessNight(
        samples,
        [{ start, end, isMainSleep: true }],
        "2026-06-02",
        "UTC",
      );
      expect(flagged.nightValid).toBe(true);
      expect(flagged.mainSleep?.onsetOk).toBe(false);
      const unflagged = assessNight(samples, [{ start, end }], "2026-06-02", "UTC");
      expect(unflagged.nightValid).toBe(false);
    });

    it("still needs 180 minutes and heart-rate coverage for a flagged main sleep", () => {
      const start = Date.parse("2026-06-02T05:00:00Z");
      const short = assessNight(
        grid(start, 16),
        [{ start, end: start + 170 * MIN, isMainSleep: true }],
        "2026-06-02",
        "UTC",
      );
      expect(short.nightValid).toBe(false);
      const noHr = assessNight(
        [],
        [{ start, end: start + 500 * MIN, isMainSleep: true }],
        "2026-06-02",
        "UTC",
      );
      expect(noHr.nightValid).toBe(false);
    });

    it("prefers the flagged session over a longer unflagged one", () => {
      const nap = Date.parse("2026-06-02T01:00:00Z");
      const flaggedStart = Date.parse("2026-06-02T05:00:00Z");
      const res = assessNight(
        grid(flaggedStart, 16),
        [
          { start: nap, end: nap + 600 * MIN },
          { start: flaggedStart, end: flaggedStart + 300 * MIN, isMainSleep: true },
        ],
        "2026-06-02",
        "UTC",
      );
      expect(res.mainSleep?.start).toBe(flaggedStart);
    });
  });
});
