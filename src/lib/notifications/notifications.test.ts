import { describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/config/app";
import type { ParentSettings } from "@/types/app-state";
import type { EconomyState } from "@/types/economy";
import type { ParentLog } from "@/types/parent-log";
import { getActiveNotifications, triggerSystemNotification } from "./notifications";
import type { LocalNotification } from "./types";

const FORBIDDEN_WORDS = [
  "treat",
  "treats",
  "prevent",
  "prevents",
  "protect",
  "protects",
  "clinical",
  "therapy",
  "prescription",
  "diagnosis",
  "risk score",
  "optimal",
  "trigger",
  "verified",
  "unverified",
  "proves",
  "first-ever",
  "fully functional",
  "jump",
  "hop",
  "leap",
  "run",
] as const;

describe("Local Notifications System (on-device)", () => {
  const baseSettings: ParentSettings = {
    pinHash: "mock-hash",
    pinSalt: "mock-salt",
    allowedMissionIds: ["dragon-breathing"],
    reminderEnabled: true,
    reminderTime: "20:00",
  };

  describe("Care reminder (Parent audience)", () => {
    it("generates care reminder when enabled, due, and unrecorded", () => {
      const now = new Date("2026-10-04T20:30:00");
      const notifs = getActiveNotifications({
        now,
        settings: baseSettings,
        todayLog: undefined,
        childNickname: "Lucas",
      });

      const careNotif = notifs.find((n) => n.type === "care_reminder");
      expect(careNotif).toBeDefined();
      expect(careNotif?.audience).toBe("parent");
      expect(careNotif?.priority).toBe("high");
      expect(careNotif?.body).toContain("Lucas");
      expect(careNotif?.actionUrl).toBe(ROUTES.parentLog);
      expect(careNotif?.actionLabel).toBe("Go to daily log");
    });

    it("does not generate care reminder if disabled or before scheduled time", () => {
      const beforeTime = new Date("2026-10-04T19:00:00");
      const notifsBefore = getActiveNotifications({
        now: beforeTime,
        settings: baseSettings,
      });
      expect(notifsBefore.find((n) => n.type === "care_reminder")).toBeUndefined();

      const afterTime = new Date("2026-10-04T20:30:00");
      const notifsDisabled = getActiveNotifications({
        now: afterTime,
        settings: { ...baseSettings, reminderEnabled: false },
      });
      expect(notifsDisabled.find((n) => n.type === "care_reminder")).toBeUndefined();
    });

    it("does not generate care reminder if medication/care was already recorded today", () => {
      const now = new Date("2026-10-04T20:30:00");
      const recordedLogs: ParentLog["medicationTaken"][] = [
        "yes",
        "partly",
        "no",
        "not-applicable",
      ];

      for (const status of recordedLogs) {
        const notifs = getActiveNotifications({
          now,
          settings: baseSettings,
          todayLog: {
            date: "2026-10-04",
            medicationTaken: status,
          },
        });
        expect(notifs.find((n) => n.type === "care_reminder")).toBeUndefined();
      }
    });
  });

  describe("Doctor appointment reminder (Parent audience)", () => {
    it("generates 'Doctor appointment today' when consultation date is today", () => {
      const now = new Date("2026-10-04T10:00:00");
      const notifs = getActiveNotifications({
        now,
        consultations: [{ id: "c1", date: "2026-10-04" }],
      });

      const apptNotif = notifs.find((n) => n.type === "appointment_reminder");
      expect(apptNotif).toBeDefined();
      expect(apptNotif?.title).toBe("Doctor appointment today");
      expect(apptNotif?.priority).toBe("high");
      expect(apptNotif?.actionUrl).toBe(ROUTES.parentReport);
      expect(apptNotif?.actionLabel).toBe("View doctor report");
    });

    it("generates 'Doctor appointment tomorrow' when consultation date is tomorrow", () => {
      const now = new Date("2026-10-04T10:00:00");
      const notifs = getActiveNotifications({
        now,
        consultations: [{ id: "c1", date: "2026-10-05" }],
      });

      const apptNotif = notifs.find((n) => n.type === "appointment_reminder");
      expect(apptNotif).toBeDefined();
      expect(apptNotif?.title).toBe("Doctor appointment tomorrow");
      expect(apptNotif?.priority).toBe("medium");
      expect(apptNotif?.actionUrl).toBe(ROUTES.parentReport);
      expect(apptNotif?.actionLabel).toBe("View doctor report");
    });

    it("does not generate reminder if appointment is further in future (>1 day) or in the past", () => {
      const now = new Date("2026-10-04T10:00:00");
      const notifsFuture = getActiveNotifications({
        now,
        consultations: [{ id: "c1", date: "2026-10-10" }],
      });
      expect(notifsFuture.find((n) => n.type === "appointment_reminder")).toBeUndefined();

      const notifsPast = getActiveNotifications({
        now,
        consultations: [{ id: "c2", date: "2026-10-03" }],
      });
      expect(notifsPast.find((n) => n.type === "appointment_reminder")).toBeUndefined();
    });
  });

  describe("Family reward claim (Parent audience)", () => {
    const baseEconomy: EconomyState = {
      fire: 80,
      coinsSpent: 0,
      inventory: { food: 5 },
      ownedItemIds: [],
      equippedItemIds: [],
      specialRewards: [{ id: "rew-1", name: "Movie night", fireCost: 30 }],
      rewardClaims: [
        {
          id: "claim-1",
          rewardId: "rew-1",
          date: "2026-10-04",
          createdAt: "2026-10-04T18:00:00Z",
          status: "requested",
        },
      ],
    };

    it("generates notification when a home reward claim is requested", () => {
      const notifs = getActiveNotifications({
        economy: baseEconomy,
        childNickname: "Lucas",
      });

      const claimNotif = notifs.find((n) => n.type === "reward_claim");
      expect(claimNotif).toBeDefined();
      expect(claimNotif?.title).toBe("Family reward requested");
      expect(claimNotif?.body).toContain("Movie night");
      expect(claimNotif?.body).toContain("Lucas");
      expect(claimNotif?.actionUrl).toBe(ROUTES.parent);
      expect(claimNotif?.actionLabel).toBe("Review rewards");
    });

    it("does not generate notification when claims are already done", () => {
      const doneEconomy: EconomyState = {
        ...baseEconomy,
        rewardClaims: [
          {
            ...baseEconomy.rewardClaims[0]!,
            status: "done",
            doneAt: "2026-10-04",
          },
        ],
      };

      const notifs = getActiveNotifications({
        economy: doneEconomy,
      });
      expect(notifs.find((n) => n.type === "reward_claim")).toBeUndefined();
    });
  });

  describe("Play invitation (Child audience)", () => {
    it("generates play invitation in afternoon if child hasn't checked in", () => {
      const afternoon = new Date("2026-10-04T17:30:00");
      const notifs = getActiveNotifications({
        now: afternoon,
        hasChildCheckedInToday: false,
      });

      const playNotif = notifs.find((n) => n.type === "play_invitation");
      expect(playNotif).toBeDefined();
      expect(playNotif?.audience).toBe("child");
      expect(playNotif?.actionUrl).toBe(ROUTES.play);
      expect(playNotif?.actionLabel).toBe("Play with dragon");
    });

    it("does not generate play invitation if child already checked in today", () => {
      const afternoon = new Date("2026-10-04T17:30:00");
      const notifs = getActiveNotifications({
        now: afternoon,
        hasChildCheckedInToday: true,
      });

      expect(notifs.find((n) => n.type === "play_invitation")).toBeUndefined();
    });

    it("does not generate play invitation outside afternoon hours (e.g. morning or late night)", () => {
      const morning = new Date("2026-10-04T10:00:00");
      const notifsMorning = getActiveNotifications({
        now: morning,
        hasChildCheckedInToday: false,
      });
      expect(notifsMorning.find((n) => n.type === "play_invitation")).toBeUndefined();

      const lateNight = new Date("2026-10-04T22:30:00");
      const notifsLate = getActiveNotifications({
        now: lateNight,
        hasChildCheckedInToday: false,
      });
      expect(notifsLate.find((n) => n.type === "play_invitation")).toBeUndefined();
    });
  });

  describe("Content safety & clinical word compliance (PRODUCT.md §6)", () => {
    it("contains no forbidden words in any notification titles or bodies", () => {
      const now = new Date("2026-10-04T20:30:00");
      const notifs = getActiveNotifications({
        now,
        settings: baseSettings,
        consultations: [{ id: "c1", date: "2026-10-04" }],
        economy: {
          fire: 50,
          coinsSpent: 0,
          inventory: { food: 0 },
          ownedItemIds: [],
          equippedItemIds: [],
          specialRewards: [{ id: "r1", name: "Board game", fireCost: 20 }],
          rewardClaims: [
            {
              id: "cl1",
              rewardId: "r1",
              date: "2026-10-04",
              createdAt: "2026-10-04T10:00:00Z",
              status: "requested",
            },
          ],
        },
        hasChildCheckedInToday: false,
        childNickname: "Lucas",
      });

      expect(notifs.length).toBeGreaterThanOrEqual(3);

      for (const notif of notifs) {
        const fullText = `${notif.title} ${notif.body}`;
        for (const word of FORBIDDEN_WORDS) {
          const regex = new RegExp(`\\b${word}\\b`, "i");
          expect(fullText).not.toMatch(regex);
        }
      }
    });
  });

  describe("triggerSystemNotification", () => {
    it("safely returns false when Notification API is unsupported or not granted", () => {
      const mockNotif: LocalNotification = {
        id: "test",
        type: "care_reminder",
        audience: "parent",
        title: "Test",
        body: "Test body",
        tag: "test-tag",
        priority: "medium",
      };

      expect(triggerSystemNotification(mockNotif)).toBe(false);
    });

    it("triggers Notification constructor when permission is granted", () => {
      const notificationSpy = vi.fn();
      vi.stubGlobal(
        "Notification",
        Object.assign(notificationSpy, {
          permission: "granted" as NotificationPermission,
        }),
      );

      const mockNotif: LocalNotification = {
        id: "test-granted",
        type: "care_reminder",
        audience: "parent",
        title: "Care reminder",
        body: "Time for daily care.",
        tag: "care-tag",
        priority: "high",
      };

      const result = triggerSystemNotification(mockNotif);
      expect(result).toBe(true);
      expect(notificationSpy).toHaveBeenCalledWith("Care reminder", {
        body: "Time for daily care.",
        icon: "/apple-icon.png",
        tag: "care-tag",
      });

      vi.unstubAllGlobals();
    });
  });
});
