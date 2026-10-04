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
});
