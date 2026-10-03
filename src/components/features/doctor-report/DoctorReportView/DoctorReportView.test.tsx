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
  },
  foodsOnDiscomfortDays: [
    { text: "Milk", count: 3 },
    { text: "Pizza", count: 2 },
  ],
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

  it("renders overview metrics correctly", () => {
    renderWithTheme(<DoctorReportView data={mockReportData} />);

    expect(screen.getByText("Check-in adherence rate")).toBeTruthy();
    expect(screen.getByText("84%")).toBeTruthy();
    expect(screen.getByText("26 of 31 days")).toBeTruthy();

    expect(screen.getByText("Care days")).toBeTruthy();
    expect(screen.getByText("28")).toBeTruthy();

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
