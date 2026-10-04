import type { MedicationTaken, ParentSettings } from "@/types";

export const DEFAULT_REMINDER_TIME = "20:00";

/** Checks if the Web Notification API is available in the current environment. */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/** Returns the current notification permission state or "unsupported". */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

/** Requests permission from the user for local browser notifications. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/**
 * Triggers a local browser notification.
 * Strict clinical rule (PRODUCT.md 6): No drug names, no doses.
 */
export function triggerLocalReminder(childNickname: string): boolean {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return false;
  }

  const name = childNickname.trim() || "your child";
  try {
    new Notification("Daily care reminder", {
      body: `Time for ${name}'s daily routine.`,
      icon: "/apple-icon.png",
      tag: "daily-care-reminder",
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines whether the current local time has reached or passed the reminder time.
 */
export function isDueForReminder(
  reminderTime: string = DEFAULT_REMINDER_TIME,
  now = new Date(),
): boolean {
  const parts = reminderTime.split(":");
  if (parts.length !== 2) return false;
  const targetHour = Number(parts[0]);
  const targetMinute = Number(parts[1]);
  if (!Number.isFinite(targetHour) || !Number.isFinite(targetMinute)) return false;

  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  if (currentHour > targetHour) return true;
  if (currentHour === targetHour && currentMinute >= targetMinute) return true;
  return false;
}

/**
 * Determines whether the in-app reminder banner should be shown.
 * Shows when:
 * 1. Reminder is enabled.
 * 2. Current time is at or past reminderTime.
 * 3. Today's medication / daily care has not been recorded yet.
 */
export function shouldShowInAppReminder(
  settings: ParentSettings | null | undefined,
  todayMedication: MedicationTaken | undefined,
  now = new Date(),
): boolean {
  if (!settings?.reminderEnabled) return false;
  // If medication/care was already recorded today (yes, partly, no, or not-applicable), no need to remind
  if (todayMedication !== undefined) return false;

  const time = settings.reminderTime || DEFAULT_REMINDER_TIME;
  return isDueForReminder(time, now);
}
