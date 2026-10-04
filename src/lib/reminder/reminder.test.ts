import { describe, expect, it, vi } from "vitest";
import type { ParentSettings } from "@/types";
import { isDueForReminder, shouldShowInAppReminder, triggerLocalReminder } from "./reminder";

describe("reminder utility", () => {
  const baseSettings: ParentSettings = {
    pinHash: "hash",
    pinSalt: "salt",
    allowedMissionIds: ["m1"],
    reminderEnabled: true,
    reminderTime: "20:00",
  };

  it("checks if current time is due for reminder correctly", () => {
    // 19:30 is before 20:00
    const before = new Date(2026, 9, 4, 19, 30);
    expect(isDueForReminder("20:00", before)).toBe(false);

    // 20:00 is exact
    const exact = new Date(2026, 9, 4, 20, 0);
    expect(isDueForReminder("20:00", exact)).toBe(true);

    // 21:15 is after 20:00
    const after = new Date(2026, 9, 4, 21, 15);
    expect(isDueForReminder("20:00", after)).toBe(true);

    // Invalid time returns false
    expect(isDueForReminder("invalid", after)).toBe(false);
  });

  it("shouldShowInAppReminder returns true only when enabled, due, and unrecorded", () => {
    const afterTime = new Date(2026, 9, 4, 20, 30);
    const beforeTime = new Date(2026, 9, 4, 19, 0);

    // When disabled
    expect(
      shouldShowInAppReminder({ ...baseSettings, reminderEnabled: false }, undefined, afterTime),
    ).toBe(false);

    // When enabled, after time, and unrecorded -> TRUE
    expect(shouldShowInAppReminder(baseSettings, undefined, afterTime)).toBe(true);

    // When enabled, before time -> FALSE
    expect(shouldShowInAppReminder(baseSettings, undefined, beforeTime)).toBe(false);

    // When already recorded (yes, partly, no, not-applicable) -> FALSE
    expect(shouldShowInAppReminder(baseSettings, "yes", afterTime)).toBe(false);
    expect(shouldShowInAppReminder(baseSettings, "partly", afterTime)).toBe(false);
    expect(shouldShowInAppReminder(baseSettings, "no", afterTime)).toBe(false);
    expect(shouldShowInAppReminder(baseSettings, "not-applicable", afterTime)).toBe(false);
  });

  it("triggerLocalReminder never mentions drug names or doses", () => {
    const mockNotification = vi.fn();
    vi.stubGlobal("Notification", mockNotification);
    Object.defineProperty(Notification, "permission", {
      value: "granted",
      configurable: true,
    });

    const triggered = triggerLocalReminder("Lucas");
    expect(triggered).toBe(true);
    expect(mockNotification).toHaveBeenCalledWith("Daily care reminder", {
      body: "Time for Lucas's daily routine.",
      icon: "/apple-icon.png",
      tag: "daily-care-reminder",
    });

    vi.unstubAllGlobals();
  });
});
