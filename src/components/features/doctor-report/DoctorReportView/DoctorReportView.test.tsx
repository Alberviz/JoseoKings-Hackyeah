import { fireEvent, screen } from "@testing-library/react";
import { APP_NAME } from "@/config/app";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { DoctorReportData } from "@/lib/report/types";
import { DoctorReportView } from "./DoctorReportView";

const mockReportData: DoctorReportData = {
  childNickname: "Lucas",
  isDemo: true,
  generatedDate: "2026-10-01",
  period: {
    startDate: "2026-09-01",
    endDate: "2026-10-01",
    totalDays: 31,
    previousConsultationDate: "2026-08-15",
  },
  metrics: {
    checkInDaysCount: 26,
    checkInCompletionRate: 0.8387,
    careDaysCount: 28,
    discomfortDaysCount: 4,
    avgSleepHours: 8.5,
    sleepRecordedDaysCount: 22,
    schoolImpactedDaysCount: 2,
  },
  activity: {
    totalMissionsCompleted: 15,
    byConfidence: [
      { company: "family", label: "Done with family", count: 8 },
      { company: "alone", label: "Done on their own", count: 5 },
      { company: "other", label: "Done with someone", count: 2 },
    ],
    byCorroboration: [
      { method: "watch", label: "Watch verified", count: 10 },
      { method: "motion", label: "Motion sensor verified", count: 4 },
      { method: "none", label: "Self-reported only", count: 1 },
    ],
    corroborationTotals: {
      watch: 10,
      motion: 4,
      none: 1,
    },
  },
  foodsOnDiscomfortDays: [
    { text: "Milk", count: 3 },
    { text: "Pizza", count: 2 },
  ],
  watch: {
    source: "Watch",
    isDemo: false,
    validDays: 20,
    steps: { n: 20, median: 5200, q1: 3900, q3: 6800 },
    restingHr: { n: 18, median: 61, q1: 58, q3: 64 },
    sleepHours: { n: 18, median: 7.8, q1: 7.2, q3: 8.4 },
    series: [
      { date: "2026-09-01", steps: 5000, restingHr: 60, sleepHours: 8 },
      { date: "2026-09-02", steps: null, restingHr: null, sleepHours: null },
    ],
  },
  crossComparison: [
    {
      source: "Child",
      signal: "Belly comfort answer",
      metric: "Steps",
      n: 20,
      rho: -0.42,
      low: -0.7,
      high: -0.08,
    },
  ],
  observed: {
    loggedDays: 22,
    school: { attended: 15, leftEarly: 1, missed: 1, noSchool: 5 },
    medication: { yes: 20, partly: 0, no: 1, notApplicable: 1 },
    bathroom: {
      totalDaytime: 33,
      totalNighttime: 5,
      totalVisits: 38,
      avgDaytimePerDay: 1.5,
      avgNighttimePerDay: 0.2,
      avgVisitsPerDay: 1.7,
      daysWithLooserStools: 4,
      daysWithBloodVisible: 1,
      daysLogged: 22,
    },
  },
  dayStrip: [
    {
      date: "2026-09-01",
      hasCheckIn: true,
      notToday: false,
      bellyComfort: 1,
      energy: 0,
      playPace: 0,
      hadMissions: true,
      hadDiscomfort: false,
      hasParentLog: true,
      sleepHours: 8.5,
    },
    {
      date: "2026-09-02",
      hasCheckIn: true,
      notToday: true,
      bellyComfort: null,
      energy: null,
      playPace: null,
      hadMissions: false,
      hadDiscomfort: true,
      hasParentLog: false,
    },
  ],
  disclaimer:
    "Summary written by the family from what the child and carers entered. It is not a medical assessment, it makes no diagnosis and it gives no advice.",
};

describe("DoctorReportView", () => {
  it("renders child nickname, period dates, previous consultation, and demo badge", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText(`${APP_NAME} · Consultation Summary`)).toBeTruthy();
    expect(screen.getByText("Lucas")).toBeTruthy();
    expect(screen.getByText(/From 2026-09-01 to 2026-10-01 \(31 days\)/)).toBeTruthy();
    expect(screen.getByText(/Previous consultation: 2026-08-15/)).toBeTruthy();
    expect(screen.getByText("Demo data")).toBeTruthy();
  });

  it("omits previous consultation and demo badge when not applicable", () => {
    const dataWithoutDemo: DoctorReportData = {
      ...mockReportData,
      isDemo: false,
      period: {
        ...mockReportData.period,
        previousConsultationDate: null,
      },
    };

    renderWithTheme(<DoctorReportView data={dataWithoutDemo} />);

    expect(screen.queryByText(/Previous consultation:/)).toBeNull();
    expect(screen.queryByText("Demo data")).toBeNull();
  });

  it("renders next appointment when provided", () => {
    const dataWithNext: DoctorReportData = {
      ...mockReportData,
      period: {
        ...mockReportData.period,
        nextAppointmentDate: "2026-10-15",
      },
    };

    renderWithTheme(<DoctorReportView data={dataWithNext} />);

    expect(screen.getByText(/Next appointment: 2026-10-15/)).toBeTruthy();
  });

  it("renders overview metrics correctly", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Check-in consistency")).toBeTruthy();
    expect(screen.getByText("84%")).toBeTruthy();
    expect(screen.getByText("26 of 31 days")).toBeTruthy();

    expect(screen.getByText("Care days")).toBeTruthy();
    expect(screen.getByText("28")).toBeTruthy();
    expect(screen.getByText("days active (check-in or mission)")).toBeTruthy();

    expect(screen.getByText("Days with discomfort")).toBeTruthy();
    expect(screen.getByText("4")).toBeTruthy();

    expect(screen.getByText("Average sleep")).toBeTruthy();
    expect(screen.getByText("8.5 h")).toBeTruthy();

    expect(screen.getByText("School days impacted")).toBeTruthy();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("renders physical movement section and confidence breakdown", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Physical Movement & Activity")).toBeTruthy();
    expect(screen.getByText(/Total completed missions:/)).toBeTruthy();
    expect(screen.getByText("Done with family")).toBeTruthy();
    expect(screen.getByText("8 missions")).toBeTruthy();
    expect(screen.getByText("Done on their own")).toBeTruthy();
    expect(screen.getByText("5 missions")).toBeTruthy();
    expect(screen.getByText("Done with someone")).toBeTruthy();
    expect(screen.getByText("2 missions")).toBeTruthy();
  });

  it("renders daily strip table and rows", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Daily strip / timeline")).toBeTruthy();
    expect(screen.getByText("2026-09-01")).toBeTruthy();
    expect(screen.getByText("2026-09-02")).toBeTruthy();
    expect(screen.getAllByText("Not today").length).toBeGreaterThan(0);
  });

  it("renders co-occurring foods note and food counts", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(
      screen.getByText(
        "The family logged these foods on days when discomfort was reported (co-occurrence counts only, not ranked as causes).",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Milk")).toBeTruthy();
    expect(screen.getByText("3 days")).toBeTruthy();
    expect(screen.getByText("Pizza")).toBeTruthy();
    expect(screen.getByText("2 days")).toBeTruthy();
  });

  it("renders watch data with median, middle half and valid days", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Watch data")).toBeTruthy();
    expect(screen.getByText("5200 steps")).toBeTruthy();
    expect(screen.getByText("3900 to 6800 steps")).toBeTruthy();
    expect(screen.getByText("61 bpm")).toBeTruthy();
    expect(screen.getAllByText("Source: Watch").length).toBe(1);
  });

  it("shows no-data text and a demo banner for the watch section", () => {
    const empty = { n: 0, median: null, q1: null, q3: null };
    renderWithTheme(
      <DoctorReportView
        data={{
          ...mockReportData,
          isDemo: false,
          watch: {
            source: "Watch",
            isDemo: true,
            validDays: 0,
            steps: empty,
            restingHr: empty,
            sleepHours: empty,
            series: [],
          },
          crossComparison: [],
        }}
      />,
    );

    expect(screen.getByText("No data from the watch in this period.")).toBeTruthy();
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0);
  });

  it("renders charts and the clinician comparison with N and interval", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getAllByRole("img").length).toBe(3);
    expect(screen.getByText("Child, family and watch together")).toBeTruthy();
    expect(screen.getByText("-0.7 to -0.08")).toBeTruthy();
    expect(screen.getByText("-0.42")).toBeTruthy();
  });

  it("explains when there are too few paired days", () => {
    renderWithTheme(<DoctorReportView data={{ ...mockReportData, crossComparison: [] }} />);

    expect(screen.getByText(/Not enough days with both/)).toBeTruthy();
  });

  it("renders the observed by the family counts including bathroom clinical observations", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Observed by the family")).toBeTruthy();
    expect(screen.getByText("School: attended")).toBeTruthy();
    expect(screen.getByText("Medication: taken")).toBeTruthy();
    expect(screen.getByText("Bathroom: daytime visits")).toBeTruthy();
    expect(screen.getByText("33 total (avg 1.5/day)")).toBeTruthy();
    expect(screen.getByText("Bathroom: nighttime visits")).toBeTruthy();
    expect(screen.getByText("5 total (avg 0.2/day)")).toBeTruthy();
    expect(screen.getByText("Bathroom: total visits")).toBeTruthy();
    expect(screen.getByText("38 total (avg 1.7/day)")).toBeTruthy();
    expect(screen.getByText("Bathroom: looser stools reported")).toBeTruthy();
    expect(screen.getByText("4 days")).toBeTruthy();
    expect(screen.getByText("Bathroom: visible blood reported")).toBeTruthy();
    expect(screen.getByText("1 day")).toBeTruthy();
  });

  it("renders mission corroboration breakdown when available", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Watch verified")).toBeTruthy();
    expect(screen.getByText("10 missions")).toBeTruthy();
    expect(screen.getByText("Motion sensor verified")).toBeTruthy();
    expect(screen.getByText("4 missions")).toBeTruthy();
    expect(screen.getByText("Self-reported only")).toBeTruthy();
    expect(screen.getByText("1 mission")).toBeTruthy();
  });

  it("renders daily SVG sparklines with titles and accessibility attributes", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    const svgs = screen.getAllByRole("img");
    expect(svgs.length).toBe(3);
    expect(screen.getAllByText("Steps per day").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Nocturnal resting HR").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sleep duration").length).toBeGreaterThan(0);
  });

  it("renders mandatory disclaimer banner", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText(mockReportData.disclaimer)).toBeTruthy();
  });

  it("calls window.print() when clicking Save as PDF / Print", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    renderWithTheme(<DoctorReportView data={mockReportData} />);

    const printButton = screen.getByRole("button", { name: "Save as PDF / Print" });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });
});
