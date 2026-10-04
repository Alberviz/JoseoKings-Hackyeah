import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import type { WearableDay } from "@/types/wearable";
import { getDayStatus, getDayStatuses } from "./wearableStatus";

const START = "2026-09-01";

function day(
  i: number,
  sleepMinutes: number,
  restingHr: number,
  steps = 6000,
  complete = true,
): WearableDay {
  return {
    date: addDays(START, i),
    steps,
    restingHr,
    sleepMinutes,
    nightComplete: complete,
    dayComplete: complete,
  };
}

/** 21 usual days with a little natural variation. */
function usualDays(): WearableDay[] {
  return Array.from({ length: 21 }, (_, i) =>
    day(i, 480 + (i % 3) * 10, 60 + (i % 2), 6000 + (i % 4) * 100),
  );
}

function withDifferentTail(count: number): WearableDay[] {
  const days = usualDays();
  for (let i = 0; i < count; i += 1) {
    days.push(day(21 + i, 300, 80, 6000));
  }
  return days;
}

describe("getDayStatus", () => {
  it("is unknown without enough data", () => {
    expect(getDayStatus([], "2026-09-02").tone).toBe("unknown");
    expect(getDayStatus([day(0, 480, 60)], START).tone).toBe("unknown");
  });

  it("is unknown for a day with only partial data", () => {
    const days = [...usualDays(), day(21, 300, 80, 100, false)];
    expect(getDayStatus(days, addDays(START, 21)).tone).toBe("unknown");
  });

  it("is usual on a usual day", () => {
    const status = getDayStatus(usualDays(), addDays(START, 20));
    expect(status.tone).toBe("usual");
    expect(status.outsideCount).toBe(0);
  });

  it("explains a different day in one plain sentence", () => {
    const status = getDayStatus(withDifferentTail(1), addDays(START, 21));
    expect(status.tone).not.toBe("usual");
    expect(status.sentence).toMatch(/slept less than usual/i);
    expect(status.sentence).toMatch(/resting heart rate higher/i);
    expect(status.tone).toBe("clearlyDifferent");
  });
});

describe("getDayStatuses", () => {
  it("returns one status per day in range", () => {
    const list = getDayStatuses(usualDays(), { from: addDays(START, 14), to: addDays(START, 20) });
    expect(list).toHaveLength(7);
  });
});
