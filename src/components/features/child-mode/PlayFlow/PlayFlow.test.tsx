import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { PlayFlow } from "./PlayFlow";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

describe("PlayFlow (Task V5)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("Step 1: renders who plays options and companion, back button navigates home", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    expect(screen.getByRole("button", { name: /Alone/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Family/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Someone else/i })).toBeTruthy();
    expect(screen.getByTestId("companion-svg")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Go back/i }));
    expect(mockPush).toHaveBeenCalledWith(ROUTES.home);
  });

  it("Step 2: selecting Alone moves to feelings screen with 3 options and dots", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    fireEvent.click(screen.getByRole("button", { name: /Alone/i }));

    expect(await screen.findByText("How are you feeling?")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Calm, level 1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Strong, level 2/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Amazing, level 3/i })).toBeTruthy();
    expect(screen.getByTestId("companion-svg")).toBeTruthy();

    // Back returns to step 1
    fireEvent.click(screen.getByRole("button", { name: /Go back/i }));
    expect(screen.getByText("Who is playing?")).toBeTruthy();
  });

  it("Step 3: picking Calm selects level 1 game and allows rerolling with Another game", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    fireEvent.click(screen.getByRole("button", { name: /Alone/i }));

    await screen.findByText("How are you feeling?");
    fireEvent.click(screen.getByRole("button", { name: /Calm, level 1/i }));

    expect(await screen.findByText("Ready to play?")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Let's play/i })).toBeTruthy();
    const rerollButton = screen.getByRole("button", { name: /Another game/i });
    expect(rerollButton).toBeTruthy();

    // Reroll works
    fireEvent.click(rerollButton);
    expect(screen.getByText("Ready to play?")).toBeTruthy();

    // Back button returns to step 2
    fireEvent.click(screen.getByRole("button", { name: /Go back/i }));
    expect(screen.getByText("How are you feeling?")).toBeTruthy();
  });

  it("Step 4 & 5 & 6 & 7: complete alone game routine, confirm, mood, and open chest with +12 coins", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    fireEvent.click(screen.getByRole("button", { name: /Alone/i }));

    await screen.findByText("How are you feeling?");
    fireEvent.click(screen.getByRole("button", { name: /Calm, level 1/i }));

    await screen.findByText("Ready to play?");
    fireEvent.click(screen.getByRole("button", { name: /Let's play/i }));

    // Step 4: Exercise
    expect(await screen.findByRole("timer")).toBeTruthy();
    expect(screen.getByTestId("exercise-figure-svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Rest now/i })).toBeTruthy();

    // Advance through exercise steps
    while (screen.queryByRole("button", { name: /Next step/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    }

    // Last step shows Done button
    const doneBtn = screen.getByRole("button", { name: /Done/i });
    expect(doneBtn).toBeTruthy();
    fireEvent.click(doneBtn);

    // Step 5: Confirmation (Alone -> I did it)
    expect(await screen.findByText("All done!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /I did it/i }));

    // Step 6: How do you feel after playing?
    expect(await screen.findByText("How do you feel after playing?")).toBeTruthy();
    expect(screen.getByTestId("companion-svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Exhausted/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Chill/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Great/i })).toBeTruthy();

    // Pick mood
    fireEvent.click(screen.getByRole("button", { name: /Great/i }));

    // Step 7: Chest
    expect(await screen.findByText("+12")).toBeTruthy();
    expect(screen.getByText("Every time you play, you get a chest.")).toBeTruthy();
    expect(screen.getByRole("img", { name: /Open treasure chest/i })).toBeTruthy();
    expect(screen.getByTestId("companion-svg")).toBeTruthy();

    // Back home button
    const homeBtn = screen.getByRole("button", { name: /Back home/i });
    expect(homeBtn).toBeTruthy();
    fireEvent.click(homeBtn);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.home);
  });

  it("Rest now flow: stops exercise early, awards +6 coins, and saves rest log", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    fireEvent.click(screen.getByRole("button", { name: /Alone/i }));

    await screen.findByText("How are you feeling?");
    fireEvent.click(screen.getByRole("button", { name: /Strong, level 2/i }));

    await screen.findByText("Ready to play?");
    fireEvent.click(screen.getByRole("button", { name: /Let's play/i }));

    // On exercise step, click Rest now
    expect(await screen.findByRole("button", { name: /Rest now/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Rest now/i }));

    // Directly prompts how do you feel after playing
    expect(await screen.findByText("How do you feel after playing?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Chill/i }));

    // Chest gives +6 for rest
    expect(await screen.findByText("+6")).toBeTruthy();
    expect(screen.getByText("Every time you play, you get a chest.")).toBeTruthy();
  });

  it("Step 5 with Someone else (other): asks partner to confirm", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    await screen.findByText("Who is playing?");
    fireEvent.click(screen.getByRole("button", { name: /Someone else/i }));

    await screen.findByText("How are you feeling?");
    fireEvent.click(screen.getByRole("button", { name: /Amazing, level 3/i }));

    await screen.findByText("Ready to play?");
    fireEvent.click(screen.getByRole("button", { name: /Let's play/i }));

    // Advance through exercise
    while (screen.queryByRole("button", { name: /Next step/i })) {
      fireEvent.click(screen.getByRole("button", { name: /Next step/i }));
    }
    fireEvent.click(screen.getByRole("button", { name: /Done/i }));

    // Someone else confirmation
    expect(await screen.findByText("Great teamwork!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    expect(await screen.findByText("How do you feel after playing?")).toBeTruthy();
  });
});
