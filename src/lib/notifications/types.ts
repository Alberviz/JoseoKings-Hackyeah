import type { EconomyState } from "@/types/economy";
import type { ParentSettings } from "@/types/app-state";
import type { Consultation, ParentLog } from "@/types/parent-log";

export type NotificationType =
  "care_reminder" | "appointment_reminder" | "reward_claim" | "play_invitation";

export type NotificationAudience = "parent" | "child";

export type NotificationPriority = "low" | "medium" | "high";

export interface LocalNotification {
  id: string;
  type: NotificationType;
  audience: NotificationAudience;
  title: string;
  body: string;
  icon?: string;
  tag: string;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
}

export interface GetActiveNotificationsParams {
  now?: Date;
  settings?: ParentSettings | null;
  todayLog?: ParentLog | null;
  consultations?: Consultation[];
  economy?: EconomyState | null;
  hasChildCheckedInToday?: boolean;
  childNickname?: string;
}
