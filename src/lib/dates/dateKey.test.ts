import { describe, expect, it } from "vitest";
import { addDays, daysBetween, isDateKey, isWeekend, toDateKey, weekdayIndex } from "./dateKey";

describe("dateKey", () => {
  it("formats a local date", () => {
    expect(toDateKey(new Date(2026, 9, 3, 23, 59))).toBe("2026-10-03");
  });

  it("adds days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });

  it("is not affected by daylight saving changes", () => {
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(daysBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(daysBetween("2026-10-24", "2026-10-26")).toBe(2);
  });

  it("counts days between two keys", () => {
    expect(daysBetween("2026-10-03", "2026-10-03")).toBe(0);
    expect(daysBetween("2026-10-03", "2026-10-10")).toBe(7);
    expect(daysBetween("2026-10-10", "2026-10-03")).toBe(-7);
  });

  it("knows the weekday, with Monday as 0", () => {
    expect(weekdayIndex("2026-10-03")).toBe(5);
    expect(isWeekend("2026-10-03")).toBe(true);
    expect(weekdayIndex("2026-10-05")).toBe(0);
    expect(isWeekend("2026-10-05")).toBe(false);
  });

  it("validates date keys", () => {
    expect(isDateKey("2026-10-03")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-1-3")).toBe(false);
    expect(isDateKey("not a date")).toBe(false);
  });
});
