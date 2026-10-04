import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { QUESTION_IDS } from "@/config/content-ids";
import { CHECK_IN_QUESTIONS } from "@/content/check-in-questions";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { CheckInScreen } from "./CheckInScreen";

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

describe("CheckInScreen", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders progress, companion, and the first official prompt", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <CheckInScreen questions={CHECK_IN_QUESTIONS} />
      </ProviderWrapper>,
    );

    await screen.findByText("Question 1 of 3");
    expect(screen.getByText("How is your belly feeling today?")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Calm and comfortable/i })).toBeTruthy();
    expect(screen.getByRole("radio", { name: /Sore or uncomfortable/i })).toBeTruthy();
  });

  it("advances through questions and saves check-in", async () => {
    const handleComplete = vi.fn();

    renderWithTheme(
      <ProviderWrapper>
        <CheckInScreen questions={CHECK_IN_QUESTIONS} onComplete={handleComplete} />
      </ProviderWrapper>,
    );

    await screen.findByText("Question 1 of 3");

    fireEvent.click(screen.getByRole("radio", { name: /Sore or uncomfortable/i }));
    expect(screen.getByText(/You chose: Sore or uncomfortable/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Next question/i }));

    expect(screen.getByText("How is your energy today?")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Medium energy/i }));
    fireEvent.click(screen.getByRole("button", { name: /Next question/i }));

    expect(screen.getByText("How did you feel like moving today?")).toBeTruthy();
    fireEvent.click(screen.getByRole("radio", { name: /Taking breaks to rest/i }));
    fireEvent.click(screen.getByRole("button", { name: /Save today's check-in/i }));

    expect(screen.getByRole("heading", { name: /Check-in saved/i })).toBeTruthy();
    expect(screen.queryByText(/What your parents can see/i)).toBeNull();
    expect(screen.getByRole("link", { name: /Back home/i })).toBeTruthy();

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledTimes(1);
    });
    expect(handleComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        notToday: false,
        answers: {
          [QUESTION_IDS.bellyComfort]: 2,
          [QUESTION_IDS.energy]: 1,
          [QUESTION_IDS.playPace]: 1,
        },
      }),
    );
  });

  it("handles the not-today skip path with skipped answers", async () => {
    const handleComplete = vi.fn();

    renderWithTheme(
      <ProviderWrapper>
        <CheckInScreen questions={CHECK_IN_QUESTIONS} onComplete={handleComplete} />
      </ProviderWrapper>,
    );

    await screen.findByRole("button", { name: /I don't feel like it today/i });
    fireEvent.click(screen.getByRole("button", { name: /I don't feel like it today/i }));

    expect(screen.getByRole("heading", { name: /Care day saved/i })).toBeTruthy();
    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          notToday: true,
          answers: {
            [QUESTION_IDS.bellyComfort]: "skipped",
            [QUESTION_IDS.energy]: "skipped",
            [QUESTION_IDS.playPace]: "skipped",
          },
        }),
      );
    });
  });
});
