import { daysBetween, todayKey } from "@/lib/dates";
import type { Consultation, DateKey } from "@/types";

/**
 * Returns human-readable countdown text for an upcoming doctor appointment:
 * - "Today" if today
 * - "Tomorrow" if in 1 day
 * - "In X days" if > 1 day
 * - "Past" if in the past
 */
export function formatAppointmentCountdown(today: DateKey, targetDate: DateKey): string {
  const diff = daysBetween(today, targetDate);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `In ${diff} days`;
  return "Past";
}

/**
 * Returns human-readable elapsed time for a past consultation:
 * - "Today" if today
 * - "Yesterday" if 1 day ago
 * - "X days ago" if > 1 day ago
 * - "Upcoming" if in the future
 */
export function formatConsultationDaysAgo(today: DateKey, consultationDate: DateKey): string {
  const diff = daysBetween(consultationDate, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff > 1) return `${diff} days ago`;
  return "Upcoming";
}

export type ConsultationSplit = {
  upcoming: Consultation[];
  past: Consultation[];
  nextAppointment: Consultation | null;
  lastConsultation: Consultation | null;
};

/**
 * Splits consultations into upcoming appointments (date >= today)
 * and past consultations (date < today), providing nearest upcoming and most recent past.
 */
export function getConsultationSummary(
  consultations: Consultation[],
  today: DateKey = todayKey(),
): ConsultationSplit {
  const upcoming = [...consultations]
    .filter((c) => c.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const past = [...consultations]
    .filter((c) => c.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    upcoming,
    past,
    nextAppointment: upcoming[0] ?? null,
    lastConsultation: past[0] ?? null,
  };
}
