"use client";

import { useCallback, useEffect, useState } from "react";
import { WATCH_STATUS_COPY } from "@/content/watch-summary";
import type { ParentAlert } from "@/lib/patterns";

const NOTIFIED_KEY = "crohncare_parent_alert_synced_at";

type Permission = "default" | "granted" | "denied";

function readPermission(): Permission {
  return typeof Notification === "undefined" ? "denied" : Notification.permission;
}

/**
 * Local Notification for the parent alert. Nothing leaves the device.
 * Fires at most once per watch sync, only when permission was granted by the parent.
 */
export function useParentAlert(alert: ParentAlert, lastSyncAt: string | null) {
  const available = typeof Notification !== "undefined";
  const [permission, setPermission] = useState<Permission>(readPermission);

  const requestPermission = useCallback(() => {
    if (typeof Notification === "undefined") return;
    void Notification.requestPermission().then((result) => setPermission(result));
  }, []);

  useEffect(() => {
    if (!alert.alert || !lastSyncAt || permission !== "granted") return;
    try {
      if (window.localStorage.getItem(NOTIFIED_KEY) === lastSyncAt) return;
      window.localStorage.setItem(NOTIFIED_KEY, lastSyncAt);
    } catch {
      // storage blocked: notify anyway
    }
    new Notification(WATCH_STATUS_COPY.notificationTitle, {
      body: WATCH_STATUS_COPY.notificationBody,
    });
  }, [alert.alert, lastSyncAt, permission]);

  return { available, permission, requestPermission };
}
