import { ROUTES } from "@/config/app";
import { daysBetween, toDateKey } from "@/lib/dates";
import { getConsultationSummary } from "@/lib/consultation/consultation";
import { DEFAULT_REMINDER_TIME, isDueForReminder } from "@/lib/reminder/reminder";
import type { GetActiveNotificationsParams, LocalNotification } from "./types";

/**
 * Evaluates the current state and returns all active on-device local notifications.
 * Strict rules:
 * - 100% on-device (no cloud server needed).
 * - No forbidden clinical words (PRODUCT.md §6): no drug names, no doses, no diagnosis, no treatment claims.
 * - Respects pediatric and family boundaries.
 */
export function getActiveNotifications(
  params: GetActiveNotificationsParams = {},
): LocalNotification[] {
  const {
    now = new Date(),
    settings,
    todayLog,
    consultations = [],
    economy,
    hasChildCheckedInToday = false,
    childNickname,
  } = params;

  const notifications: LocalNotification[] = [];
  const todayKey = toDateKey(now);
  const name = childNickname?.trim() || "your child";

  // 1. Care reminder (Parent audience)
  // Shows when enabled, time is due, and medication/care hasn't been recorded today.
  if (settings?.reminderEnabled && todayLog?.medicationTaken === undefined) {
    const reminderTime = settings.reminderTime || DEFAULT_REMINDER_TIME;
    if (isDueForReminder(reminderTime, now)) {
      notifications.push({
        id: `care-reminder-${todayKey}`,
        type: "care_reminder",
        audience: "parent",
        title: "Daily care reminder",
        body: `Time for ${name}'s daily routine. Have you logged today's care?`,
        tag: "daily-care-reminder",
        priority: "high",
        actionUrl: ROUTES.parentLog,
        actionLabel: "Go to daily log",
      });
    }
  }

  // 2. Doctor appointment reminder (Parent audience)
  // Shows if an appointment is scheduled for Today or Tomorrow.
  const { nextAppointment } = getConsultationSummary(consultations, todayKey);
  if (nextAppointment) {
    const diff = daysBetween(todayKey, nextAppointment.date);
    if (diff === 0) {
      notifications.push({
        id: `appointment-today-${nextAppointment.date}`,
        type: "appointment_reminder",
        audience: "parent",
        title: "Doctor appointment today",
        body: "You have a pediatric consultation scheduled for today. You can review or export the doctor summary.",
        tag: `appointment-${nextAppointment.date}`,
        priority: "high",
        actionUrl: ROUTES.parentReport,
        actionLabel: "View doctor report",
      });
    } else if (diff === 1) {
      notifications.push({
        id: `appointment-tomorrow-${nextAppointment.date}`,
        type: "appointment_reminder",
        audience: "parent",
        title: "Doctor appointment tomorrow",
        body: "You have a pediatric consultation scheduled for tomorrow. Consider preparing the summary report.",
        tag: `appointment-${nextAppointment.date}`,
        priority: "medium",
        actionUrl: ROUTES.parentReport,
        actionLabel: "View doctor report",
      });
    }
  }

  // 3. Family reward claim (Parent audience)
  // Shows when there are active reward claims with status "requested".
  if (economy?.rewardClaims?.length) {
    const requestedClaims = economy.rewardClaims.filter((c) => c.status === "requested");
    for (const claim of requestedClaims) {
      const reward = economy.specialRewards?.find((r) => r.id === claim.rewardId);
      const rewardName = reward?.name ? `"${reward.name}"` : "a family reward";
      notifications.push({
        id: `claim-${claim.id}`,
        type: "reward_claim",
        audience: "parent",
        title: "Family reward requested",
        body: `${name} requested ${rewardName} with dragon fire. Tap to review.`,
        tag: `reward-claim-${claim.id}`,
        priority: "medium",
        actionUrl: ROUTES.parent,
        actionLabel: "Review rewards",
      });
    }
  }

  // 4. Play invitation (Child audience)
  // Gentle afternoon nudge if child hasn't checked in or played yet (between 16:30 and 21:00).
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isAfternoonWindow =
    (currentHour > 16 || (currentHour === 16 && currentMinute >= 30)) && currentHour < 21;

  if (isAfternoonWindow && !hasChildCheckedInToday) {
    notifications.push({
      id: `play-invite-${todayKey}`,
      type: "play_invitation",
      audience: "child",
      title: "MyCrohnie is ready to play",
      body: "Your dragon has some gentle moves ready for you today!",
      tag: "play-invitation",
      priority: "low",
      actionUrl: ROUTES.play,
      actionLabel: "Play with dragon",
    });
  }

  return notifications;
}

/**
 * Triggers a native/browser local notification via the Notification API.
 */
export function triggerSystemNotification(notification: LocalNotification): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission !== "granted") {
    return false;
  }

  try {
    new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || "/apple-icon.png",
      tag: notification.tag,
    });
    return true;
  } catch {
    return false;
  }
}
