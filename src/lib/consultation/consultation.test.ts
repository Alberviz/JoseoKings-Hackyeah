import { describe, expect, it } from "vitest";
import type { Consultation } from "@/types";
import {
  formatAppointmentCountdown,
  formatConsultationDaysAgo,
  getConsultationSummary,
} from "./consultation";

describe("consultation helpers", () => {
  const TODAY = "2026-10-04";

  describe("formatAppointmentCountdown", () => {
    it("formats 0 days as Today", () => {
      expect(formatAppointmentCountdown(TODAY, TODAY)).toBe("Today");
    });

    it("formats 1 day as Tomorrow", () => {
      expect(formatAppointmentCountdown(TODAY, "2026-10-05")).toBe("Tomorrow");
    });

    it("formats multiple days as In X days", () => {
      expect(formatAppointmentCountdown(TODAY, "2026-10-10")).toBe("In 6 days");
      expect(formatAppointmentCountdown(TODAY, "2026-10-25")).toBe("In 21 days");
    });

    it("formats past dates as Past", () => {
      expect(formatAppointmentCountdown(TODAY, "2026-10-03")).toBe("Past");
    });
  });

  describe("formatConsultationDaysAgo", () => {
    it("formats 0 days as Today", () => {
      expect(formatConsultationDaysAgo(TODAY, TODAY)).toBe("Today");
    });

    it("formats 1 day ago as Yesterday", () => {
      expect(formatConsultationDaysAgo(TODAY, "2026-10-03")).toBe("Yesterday");
    });

    it("formats multiple days ago as X days ago", () => {
      expect(formatConsultationDaysAgo(TODAY, "2026-09-20")).toBe("14 days ago");
      expect(formatConsultationDaysAgo(TODAY, "2026-09-04")).toBe("30 days ago");
    });

    it("formats future dates as Upcoming", () => {
      expect(formatConsultationDaysAgo(TODAY, "2026-10-05")).toBe("Upcoming");
    });
  });

  describe("getConsultationSummary", () => {
    it("returns nulls for empty consultations", () => {
      const summary = getConsultationSummary([], TODAY);
      expect(summary.upcoming).toHaveLength(0);
      expect(summary.past).toHaveLength(0);
      expect(summary.nextAppointment).toBeNull();
      expect(summary.lastConsultation).toBeNull();
    });

    it("correctly identifies and sorts upcoming and past consultations", () => {
      const consultations: Consultation[] = [
        { id: "c-old", date: "2026-08-01" },
        { id: "c-recent", date: "2026-09-20" },
        { id: "c-soon", date: "2026-10-12" },
        { id: "c-later", date: "2026-11-05" },
      ];

      const summary = getConsultationSummary(consultations, TODAY);

      expect(summary.upcoming).toHaveLength(2);
      expect(summary.upcoming[0].id).toBe("c-soon");
      expect(summary.upcoming[1].id).toBe("c-later");
      expect(summary.nextAppointment?.id).toBe("c-soon");

      expect(summary.past).toHaveLength(2);
      expect(summary.past[0].id).toBe("c-recent");
      expect(summary.past[1].id).toBe("c-old");
      expect(summary.lastConsultation?.id).toBe("c-recent");
    });

    it("treats today as upcoming appointment", () => {
      const consultations: Consultation[] = [
        { id: "c-today", date: TODAY },
        { id: "c-past", date: "2026-09-10" },
      ];

      const summary = getConsultationSummary(consultations, TODAY);
      expect(summary.nextAppointment?.id).toBe("c-today");
      expect(summary.lastConsultation?.id).toBe("c-past");
    });
  });
});
