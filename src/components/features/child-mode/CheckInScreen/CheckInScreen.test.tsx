import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { CheckInScreen } from "./CheckInScreen";
import { POU_CHECKIN_QUESTIONS } from "./questions";

describe("CheckInScreen (Pou-style Companion)", () => {
  it("renders the status meters, companion, and initial prompt", () => {
    renderWithTheme(<CheckInScreen questions={POU_CHECKIN_QUESTIONS} />);

    expect(screen.getByText("Tummy")).toBeTruthy();
    expect(screen.getByText("Battery")).toBeTruthy();
    expect(screen.getByText("Play")).toBeTruthy();
    expect(screen.getByText("Capy")).toBeTruthy();
    expect(screen.getByText("How is your belly feeling right now?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Calm and peaceful/i })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Uncomfortable, needs care/i })).toBeTruthy();
  });

  it("advances through meters and saves check-in", () => {
    const handleComplete = vi.fn();

    renderWithTheme(
      <CheckInScreen questions={POU_CHECKIN_QUESTIONS} onComplete={handleComplete} />,
    );

    // Step 1: Belly
    fireEvent.click(screen.getByRole("radio", { name: /Uncomfortable, needs care/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next meter/i }));

    // Step 2: Battery
    expect(screen.getByText("What's your energy battery level today?")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Half battery/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next meter/i }));

    // Step 3: Play
    expect(screen.getByText("How did your body want to move today?")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Took cozy breaks/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save today's check-in/i }));

    // End celebration
    expect(screen.getByRole("heading", { name: /Meters Recharged!/i })).toBeTruthy();
    expect(screen.getByText(/What your parents can see/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /Back to Companion/i })).toBeTruthy();

    expect(handleComplete).toHaveBeenCalledTimes(1);
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        notToday: false,
        answers: {
          belly_comfort: 2,
          energy_level: 1,
          daily_pace: 1,
        },
      }),
    );
  });

  it("switches questions directly when tapping a top status meter", () => {
    renderWithTheme(<CheckInScreen questions={POU_CHECKIN_QUESTIONS} />);

    // Tap directly on "Battery" meter
    fireEvent.click(screen.getByRole("button", { name: /Battery meter/i }));
    expect(screen.getByText("What's your energy battery level today?")).toBeTruthy();

    // Tap directly on "Play" meter
    fireEvent.click(screen.getByRole("button", { name: /Play meter/i }));
    expect(screen.getByText("How did your body want to move today?")).toBeTruthy();
  });

  it("handles the 'Today I'd rather just rest' skip path", () => {
    const handleComplete = vi.fn();

    renderWithTheme(
      <CheckInScreen questions={POU_CHECKIN_QUESTIONS} onComplete={handleComplete} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Today I'd rather just rest/i }));

    expect(screen.getByRole("heading", { name: /Care Day Saved!/i })).toBeTruthy();
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        notToday: true,
      }),
    );
  });
});
