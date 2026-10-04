import { describe, expect, it } from "vitest";
import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import {
  buildDoctorReportPayload,
  MIN_CONSULTATION_COMPARISON_DAYS,
  MIN_COOCCURRENCE_PAIRS,
  type DailyMetricInput,
  type DoctorReportInputs,
} from "../doctorReportData";

describe("Doctor Report Clinical Data Aggregation (doctorReportData)", () => {
  // Helper to create synthetic daily metrics for testing
  function createDayMetrics(
    date: string,
    overrides: Partial<DailyMetricInput> = {},
  ): DailyMetricInput {
    return {
      date,
      steps: 8000,
      nocturnalRestingHr: 65,
      sleepMinutes: 480, // 8 hours
      sleepMidpointMinutes: 195, // 03:15
      validActivity: true,
      validSleep: true,
      ...overrides,
    };
  }

  it("produces the complete structured clinical report contract", () => {
    const inputs: DoctorReportInputs = {
      startDate: "2026-03-01",
      endDate: "2026-03-07",
      childNickname: "Lucas",
      isDemo: true,
      dailyMetrics: [
        createDayMetrics("2026-03-01", { steps: 7000, nocturnalRestingHr: 62 }),
        createDayMetrics("2026-03-02", { steps: 8500, nocturnalRestingHr: 64 }),
        createDayMetrics("2026-03-03", { steps: 6500, nocturnalRestingHr: 63 }),
        createDayMetrics("2026-03-04", { steps: 9000, nocturnalRestingHr: 66 }),
        createDayMetrics("2026-03-05", { steps: 7500, nocturnalRestingHr: 65 }),
        createDayMetrics("2026-03-06", { steps: 8000, nocturnalRestingHr: 64 }),
        createDayMetrics("2026-03-07", { steps: 7200, nocturnalRestingHr: 63 }),
      ],
      checkIns: [
        { date: "2026-03-01", bellyComfort: 0, energy: 0, playPace: 0 },
        { date: "2026-03-02", bellyComfort: 0, energy: 0, playPace: 0 },
        { date: "2026-03-03", bellyComfort: 1, energy: 1, playPace: 1 },
        { date: "2026-03-04", notToday: true },
        { date: "2026-03-05", bellyComfort: 0, energy: 0, playPace: 0 },
        { date: "2026-03-06", bellyComfort: 0, energy: 0, playPace: 0 },
        { date: "2026-03-07", bellyComfort: 0, energy: 0, playPace: 0 },
      ],
      parentLogs: [
        { date: "2026-03-01", medicationTaken: "yes", note: "Good energy today" },
        { date: "2026-03-02", medicationTaken: "yes" },
        { date: "2026-03-03", medicationTaken: "partly", note: "Felt slightly uneasy after lunch" },
        { date: "2026-03-04", medicationTaken: "no" },
      ],
      parentObservations: [
        { date: "2026-03-01", daytimeVisits: 2, nighttimeVisits: 0 },
        { date: "2026-03-03", daytimeVisits: 4, nighttimeVisits: 1, looserStools: true },
      ],
      foodEntries: [{ date: "2026-03-03", tags: ["dairy", "cheese"], text: "pizza slice" }],
    };

    const payload = buildDoctorReportPayload(inputs);

    // Validate root contract
    expect(payload.childNickname).toBe("Lucas");
    expect(payload.period.startDate).toBe("2026-03-01");
    expect(payload.period.endDate).toBe("2026-03-07");
    expect(payload.period.calendarDays).toBe(7);

    // Validate Smartwatch metrics
    expect(payload.smartwatch.steps.median).toBe(7500);
    expect(payload.smartwatch.steps.validDaysCount).toBe(7);
    expect(payload.smartwatch.nocturnalRestingHr.median).toBe(64);
    expect(payload.smartwatch.nocturnalRestingHr.nNights).toBe(7);
    expect(payload.smartwatch.sleepDuration.medianHours).toBe(8);
    expect(payload.smartwatch.sleepDuration.midpoint.formattedClockTime).toBe("03:15");
    expect(payload.smartwatch.validitySummary).toBe("Recorded on 7 of 7 days (7 of 7 nights)");

    // Validate Child check-in report
    expect(payload.childCheckIn.answeredDays).toBe(6);
    expect(payload.childCheckIn.notTodayDays).toBe(1);
    expect(payload.childCheckIn.bellyComfort[0]).toBe(5);
    expect(payload.childCheckIn.bellyComfort[1]).toBe(1);
    expect(payload.childCheckIn.bellyComfort.notToday).toBe(1);

    // Validate Parent report
    expect(payload.parentLogs.bathroom.daytimeCount).toBe(6);
    expect(payload.parentLogs.bathroom.nighttimeCount).toBe(1);
    expect(payload.parentLogs.bathroom.looserStools).toBe(true);
    expect(payload.parentLogs.bathroom.bloodVisible).toBe(false);
    expect(payload.parentLogs.medicationAdherence.yes).toBe(2);
    expect(payload.parentLogs.medicationAdherence.partly).toBe(1);
    expect(payload.parentLogs.medicationAdherence.no).toBe(1);
    expect(payload.parentLogs.notes.length).toBe(2);

    // Validate Food co-occurrence
    expect(payload.parentLogs.foodsOnDiscomfortDays.length).toBe(3);
    const tags = payload.parentLogs.foodsOnDiscomfortDays.map((f) => f.tag);
    expect(tags).toContain("dairy");
    expect(tags).toContain("cheese");
    expect(tags).toContain("pizza slice");

    // Validate Footnotes & Disclaimers
    expect(payload.footnotesAndDisclaimers.isDemo).toBe(true);
    expect(payload.footnotesAndDisclaimers.demoDisclaimer).toContain("Demo data");
    expect(payload.footnotesAndDisclaimers.clinicalDisclaimer).toBe(REPORT_DISCLAIMER);
  });

  describe("Smartwatch metrics & Validity summary (A0, A3)", () => {
    it("handles missing days and partial wear correctly", () => {
      const inputs: DoctorReportInputs = {
        startDate: "2026-03-01",
        endDate: "2026-03-05", // 5 days
        dailyMetrics: [
          createDayMetrics("2026-03-01", { steps: 5000, validActivity: true, validSleep: true }),
          createDayMetrics("2026-03-02", {
            steps: null,
            validActivity: false,
            validSleep: false,
            nocturnalRestingHr: null,
            sleepMinutes: null,
          }),
          // 2026-03-03 missing entirely
          createDayMetrics("2026-03-04", {
            steps: 7000,
            validActivity: true,
            validSleep: false,
            nocturnalRestingHr: null,
            sleepMinutes: null,
          }),
          createDayMetrics("2026-03-05", { steps: 9000, validActivity: true, validSleep: true }),
        ],
      };

      const payload = buildDoctorReportPayload(inputs);
      expect(payload.period.calendarDays).toBe(5);
      expect(payload.smartwatch.steps.validDaysCount).toBe(3);
      expect(payload.smartwatch.nocturnalRestingHr.nNights).toBe(2);
      expect(payload.smartwatch.validitySummary).toBe("Recorded on 3 of 5 days (2 of 5 nights)");
      expect(payload.smartwatch.steps.median).toBe(7000);
    });

    it("aggregates raw samples using A0 daytime and nighttime rules", () => {
      const timeZone = "Europe/Madrid";
      const march1 = "2026-03-01";

      // 10 distinct waking hours with HR samples (08:00 to 17:00) -> valid activity
      const hrSamples = [];
      for (let h = 8; h <= 17; h += 1) {
        // UTC 07:00 is local 08:00 in Europe/Madrid (UTC+1)
        const ts = Date.UTC(2026, 2, 1, h - 1, 30, 0);
        hrSamples.push({ timestamp: ts, bpm: 75 });
      }

      // Main sleep session: 22:00 Feb 28 to 07:00 Mar 1 (9 hours = 540 min)
      const sleepStart = Date.UTC(2026, 1, 28, 21, 0, 0); // 22:00 Madrid
      const sleepEnd = Date.UTC(2026, 2, 1, 6, 0, 0); // 07:00 Madrid
      const sleepSessions = [{ start: sleepStart, end: sleepEnd }];

      // Add night HR samples: 140 minutes covering [23:00, 05:00) with 60 bpm
      for (let m = 0; m < 140; m += 1) {
        const ts = sleepStart + (60 + m) * 60_000;
        hrSamples.push({ timestamp: ts, bpm: 60 });
      }

      // Steps per minute
      const stepsPerMinute = [
        { timestamp: Date.UTC(2026, 2, 1, 9, 0, 0), steps: 2500 },
        { timestamp: Date.UTC(2026, 2, 1, 14, 0, 0), steps: 3500 },
      ];

      const payload = buildDoctorReportPayload({
        startDate: march1,
        endDate: march1,
        timeZone,
        heartRateSamples: hrSamples,
        sleepSessions,
        stepsPerMinute,
      });

      expect(payload.smartwatch.steps.validDaysCount).toBe(1);
      expect(payload.smartwatch.steps.median).toBe(6000);
      expect(payload.smartwatch.sleepDuration.medianMinutes).toBe(540);
      expect(payload.smartwatch.sleepDuration.medianHours).toBe(9);
      expect(payload.smartwatch.nocturnalRestingHr.nNights).toBe(1);
      expect(payload.smartwatch.nocturnalRestingHr.median).toBe(60);
    });
  });

  describe("Hampel spike filter & footnote (A1)", () => {
    it("detects and cleans single-day sensor spikes and adds transparent footnote", () => {
      // 9 days with varying steps (5000 + (i%3)*100), day 4 has a massive spike (30,000)
      const days = [
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
        "2026-03-04",
        "2026-03-05", // spike day for steps
        "2026-03-06",
        "2026-03-07", // spike day for HR
        "2026-03-08",
        "2026-03-09",
      ];

      const dailyMetrics = days.map((date, idx) =>
        createDayMetrics(date, {
          steps: idx === 4 ? 30000 : 5000 + (idx % 3) * 100,
          nocturnalRestingHr: idx === 6 ? 160 : 64 + (idx % 3),
        }),
      );

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-09",
        dailyMetrics,
      });

      expect(payload.footnotesAndDisclaimers.cleanedSpikesCount).toBe(2);
      expect(payload.footnotesAndDisclaimers.spikesDetails.stepsSpikes).toBe(1);
      expect(payload.footnotesAndDisclaimers.spikesDetails.restingHrSpikes).toBe(1);
      expect(payload.footnotesAndDisclaimers.hampelSpikesFootnote).toContain(
        "Hampel filter replaced 2 single-day readings by the surrounding median",
      );
      // Cleaned step median should reflect replaced value
      expect(payload.smartwatch.steps.median).toBeLessThan(6000);
    });

    it("leaves clean series untouched and formats clean footnote", () => {
      const dailyMetrics = [
        createDayMetrics("2026-03-01", { steps: 6000, nocturnalRestingHr: 65 }),
        createDayMetrics("2026-03-02", { steps: 6200, nocturnalRestingHr: 66 }),
        createDayMetrics("2026-03-03", { steps: 5900, nocturnalRestingHr: 64 }),
        createDayMetrics("2026-03-04", { steps: 6100, nocturnalRestingHr: 65 }),
        createDayMetrics("2026-03-05", { steps: 6050, nocturnalRestingHr: 65 }),
      ];

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        dailyMetrics,
      });

      expect(payload.footnotesAndDisclaimers.cleanedSpikesCount).toBe(0);
      expect(payload.footnotesAndDisclaimers.hampelSpikesFootnote).toBe(
        "No single-day sensor spikes required Hampel filtering.",
      );
    });
  });

  describe("Child check-in & Steady-day counts (A13)", () => {
    it("identifies steady days only when all three items are 0", () => {
      const inputs: DoctorReportInputs = {
        startDate: "2026-03-01",
        endDate: "2026-03-04",
        checkIns: [
          // All 0 -> steady
          { date: "2026-03-01", bellyComfort: 0, energy: 0, playPace: 0 },
          // One item is 1 -> not steady
          { date: "2026-03-02", bellyComfort: 0, energy: 1, playPace: 0 },
          // notToday -> not steady
          { date: "2026-03-03", notToday: true },
          // All 0 -> steady
          { date: "2026-03-04", bellyComfort: 0, energy: 0, playPace: 0 },
        ],
      };

      const payload = buildDoctorReportPayload(inputs);
      expect(payload.childCheckIn.steadyDays.totalSteadyDays).toBe(2);
      expect(payload.childCheckIn.steadyDays.answeredDays).toBe(3);
      expect(payload.childCheckIn.steadyDays.ratioString).toBe("2 of 3 answered days");
    });

    it("verifies that a missing calendar day breaks a consecutive steady run", () => {
      const inputs: DoctorReportInputs = {
        startDate: "2026-03-01",
        endDate: "2026-03-05", // 5 days
        checkIns: [
          // 2026-03-01: steady
          { date: "2026-03-01", bellyComfort: 0, energy: 0, playPace: 0 },
          // 2026-03-02: steady
          { date: "2026-03-02", bellyComfort: 0, energy: 0, playPace: 0 },
          // 2026-03-03: MISSING! (breaks run)
          // 2026-03-04: steady
          { date: "2026-03-04", bellyComfort: 0, energy: 0, playPace: 0 },
          // 2026-03-05: steady
          { date: "2026-03-05", bellyComfort: 0, energy: 0, playPace: 0 },
        ],
      };

      const payload = buildDoctorReportPayload(inputs);
      // Even though there are 4 steady days in total, the longest consecutive run is 2 days due to missing 2026-03-03
      expect(payload.childCheckIn.steadyDays.totalSteadyDays).toBe(4);
      expect(payload.childCheckIn.steadyDays.longestRunDays).toBe(2);
    });
  });

  describe("Parent observations & Medication adherence", () => {
    it("aggregates bathroom visits, flags, and medication adherence counts exactly", () => {
      const inputs: DoctorReportInputs = {
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        parentObservations: [
          { date: "2026-03-01", daytimeVisits: 3, nighttimeVisits: 0 },
          { date: "2026-03-02", kind: "bathroom_visits", valueText: "day", valueNum: 2 },
          { date: "2026-03-02", kind: "bathroom_visits", valueText: "night", valueNum: 1 },
          { date: "2026-03-03", kind: "looser_stools" },
          { date: "2026-03-03", kind: "blood_visible" },
          { date: "2026-03-04", looserStools: true },
        ],
        parentLogs: [
          { date: "2026-03-01", medicationTaken: "yes", note: "Note 1" },
          { date: "2026-03-02", medicationTaken: "yes" },
          { date: "2026-03-03", medicationTaken: "partly" },
          { date: "2026-03-04", medicationTaken: "no" },
          { date: "2026-03-05", medicationTaken: "not-applicable", note: "Note 2" },
        ],
      };

      const payload = buildDoctorReportPayload(inputs);

      expect(payload.parentLogs.bathroom.daytimeCount).toBe(5); // 3 + 2
      expect(payload.parentLogs.bathroom.nighttimeCount).toBe(1);
      expect(payload.parentLogs.bathroom.looserStools).toBe(true);
      expect(payload.parentLogs.bathroom.looserStoolsDaysCount).toBe(2); // day 3 and day 4
      expect(payload.parentLogs.bathroom.bloodVisible).toBe(true);
      expect(payload.parentLogs.bathroom.bloodVisibleDaysCount).toBe(1);

      expect(payload.parentLogs.medicationAdherence).toEqual({
        yes: 2,
        partly: 1,
        no: 1,
        notApplicable: 1,
      });

      expect(payload.parentLogs.notes).toEqual([
        { date: "2026-03-01", text: "Note 1" },
        { date: "2026-03-05", text: "Note 2" },
      ]);
    });

    it("tallies food co-occurrence tags strictly as neutral counts on discomfort days", () => {
      const inputs: DoctorReportInputs = {
        startDate: "2026-03-01",
        endDate: "2026-03-04",
        checkIns: [
          { date: "2026-03-01", bellyComfort: 1 }, // discomfort day
          { date: "2026-03-02", bellyComfort: 0 }, // comfortable day
          { date: "2026-03-03", bellyComfort: 2 }, // discomfort day
          { date: "2026-03-04", bellyComfort: 1 }, // discomfort day
        ],
        foodEntries: [
          { date: "2026-03-01", tags: ["dairy", "pasta"] },
          { date: "2026-03-02", tags: ["dairy"] }, // should be ignored (no discomfort)
          { date: "2026-03-03", tags: ["dairy", "apples"] },
          { date: "2026-03-04", tags: ["pasta"] },
        ],
      };

      const payload = buildDoctorReportPayload(inputs);
      expect(payload.parentLogs.discomfortDaysCount).toBe(3);
      expect(payload.parentLogs.discomfortDaysWithFoodCount).toBe(3);

      // dairy logged on day 1 & day 3 = 2
      // pasta logged on day 1 & day 4 = 2
      // apples logged on day 3 = 1
      expect(payload.parentLogs.foodsOnDiscomfortDays).toEqual([
        { tag: "dairy", count: 2 },
        { tag: "pasta", count: 2 },
        { tag: "apples", count: 1 },
      ]);
    });
  });

  describe("Consultation intervals comparison (A14)", () => {
    it("suppresses comparison with 'need-valid-days' when either period has n < 28", () => {
      // 25 days in period 1 (< 28)
      const p1Days = Array.from({ length: 25 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-03-${d}`);
      });
      // 30 days in period 0 (>= 28)
      const p0Days = Array.from({ length: 30 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-02-${d}`);
      });

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-25",
        previousPeriod: {
          startDate: "2026-02-01",
          endDate: "2026-02-28", // 28 calendar days
          dailyMetrics: p0Days,
        },
        dailyMetrics: p1Days,
      });

      const stepsComp = payload.consultationComparison.metrics.steps;
      expect(stepsComp.status).toBe("insufficient-data");
      expect(stepsComp.reason).toBe("need-valid-days");
      expect(stepsComp.have).toBe(25);
      expect(stepsComp.need).toBe(MIN_CONSULTATION_COMPARISON_DAYS);
      expect(stepsComp.difference).toBeNull();
      expect(stepsComp.ci).toBeNull();
    });

    it("suppresses comparison with 'length-factor' when periods differ by a factor >= 3", () => {
      // 30 days in period 1
      const p1Days = Array.from({ length: 30 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-03-${d}`);
      });
      // 95 days in period 0 (ratio 95 / 30 = 3.16 >= 3)
      const p0Days = Array.from({ length: 30 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-01-${d}`);
      });

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-30", // 30 days
        previousPeriod: {
          startDate: "2025-10-01",
          endDate: "2026-01-05", // 97 calendar days
          dailyMetrics: p0Days,
        },
        dailyMetrics: p1Days,
      });

      const stepsComp = payload.consultationComparison.metrics.steps;
      expect(stepsComp.status).toBe("insufficient-data");
      expect(stepsComp.reason).toBe("length-factor");
    });

    it("computes difference in medians and bootstrap 95% CI when n >= 28 in both periods", () => {
      // 30 days in period 1: steps ~ 8000
      const p1Days = Array.from({ length: 30 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-03-${d}`, { steps: 8000 + (i % 5) * 50 });
      });
      // 30 days in period 0: steps ~ 7000
      const p0Days = Array.from({ length: 30 }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        return createDayMetrics(`2026-02-${d}`, { steps: 7000 + (i % 5) * 50 });
      });

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-30",
        previousPeriod: {
          startDate: "2026-02-01",
          endDate: "2026-02-28", // 28 calendar days
          dailyMetrics: p0Days,
        },
        dailyMetrics: p1Days,
        seed: 42,
      });

      const stepsComp = payload.consultationComparison.metrics.steps;
      expect(stepsComp.status).toBe("value");
      expect(stepsComp.period1Median).toBe(8100);
      expect(stepsComp.period0Median).toBe(7100);
      expect(stepsComp.difference).toBe(1000);
      expect(stepsComp.ci).not.toBeNull();
      expect(stepsComp.ci?.low).toBeGreaterThan(900);
      expect(stepsComp.ci?.high).toBeLessThan(1100);
    });
  });

  describe("Co-occurrence cross-table (A7)", () => {
    it("suppresses correlation with 'insufficient-data' when n < 21 pairs", () => {
      // 10 days of data (< 21)
      const dailyMetrics = Array.from({ length: 10 }, (_, i) =>
        createDayMetrics(`2026-03-0${i + 1}`),
      );
      const checkIns = Array.from({ length: 10 }, (_, i) => ({
        date: `2026-03-0${i + 1}`,
        bellyComfort: i % 2 === 0 ? 0 : 1,
        energy: i % 2 === 0 ? 0 : 1,
      }));

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-10",
        dailyMetrics,
        checkIns,
      });

      expect(payload.cooccurrenceTable.cells.length).toBe(4);
      for (const cell of payload.cooccurrenceTable.cells) {
        expect(cell.status).toBe("insufficient-data");
        expect(cell.have).toBeLessThan(MIN_COOCCURRENCE_PAIRS);
        expect(cell.need).toBe(MIN_COOCCURRENCE_PAIRS);
        expect(cell.rho).toBeNull();
      }
    });

    it("calculates sample size n, Spearman rho, and 95% bootstrap CI when n >= 21 pairs", () => {
      // 25 consecutive days where shorter sleep at lag 1 correlates with higher belly discomfort at lag 0
      const daysCount = 25;
      const dailyMetrics = Array.from({ length: daysCount }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        // Shorter sleep for odd indices
        const sleepMinutes = i % 2 === 0 ? 520 : 400;
        return createDayMetrics(`2026-03-${d}`, { sleepMinutes });
      });

      const checkIns = Array.from({ length: daysCount }, (_, i) => {
        const d = String(i + 1).padStart(2, "0");
        // Higher discomfort following short sleep
        const prevSleep = (i - 1) % 2 === 0 ? 520 : 400;
        const bellyComfort = prevSleep < 450 ? 2 : 0;
        return {
          date: `2026-03-${d}`,
          bellyComfort,
          energy: 0,
        };
      });

      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-25",
        dailyMetrics,
        checkIns,
        seed: 12345,
      });

      const sleepBellyCell = payload.cooccurrenceTable.cells.find(
        (c) => c.predictor === "sleepDuration" && c.target === "bellyComfort",
      );

      expect(sleepBellyCell).toBeDefined();
      expect(sleepBellyCell?.status).toBe("value");
      expect(sleepBellyCell?.n).toBe(24); // 25 days -> 24 lag-1 pairs
      expect(sleepBellyCell?.rho).toBeLessThan(-0.5); // Negative correlation: less sleep -> higher discomfort
      expect(sleepBellyCell?.ci).not.toBeNull();
      expect(sleepBellyCell?.ci?.low).toBeLessThanOrEqual(sleepBellyCell?.ci?.high ?? 0);
    });
  });

  describe("Disclaimers & Footnotes (§5.1, §6.3)", () => {
    it("attaches required demo disclaimer and clinical disclaimer", () => {
      const payload = buildDoctorReportPayload({
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        isDemo: true,
      });

      expect(payload.footnotesAndDisclaimers.isDemo).toBe(true);
      expect(payload.footnotesAndDisclaimers.demoDisclaimer).toBe(
        "Demo data — fictional patient data for demonstration only. Not for clinical decision-making.",
      );
      expect(payload.footnotesAndDisclaimers.clinicalDisclaimer).toBe(REPORT_DISCLAIMER);
    });
  });
});
