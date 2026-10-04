import { act, fireEvent, screen } from "@testing-library/react";
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
    vi.useRealTimers();
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
    vi.useFakeTimers();

    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow initialStep="exercise" initialCompany="alone" initialLevel={1} />
      </ProviderWrapper>,
    );

    expect(screen.getByRole("timer")).toBeTruthy();
    expect(screen.getByTestId("exercise-figure-svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Rest now/i })).toBeTruthy();

    // Step 0: Verify button is initially disabled, advance to last 5s to see 'Almost there!' hint
    const step1Btn = screen.getByRole("button", { name: /Next step/i });
    expect((step1Btn as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    expect(screen.getByText("Almost there!")).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect((step1Btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(step1Btn);

    // Step 1: Disabled initially, advance 16s, click
    const step2Btn = screen.getByRole("button", { name: /Next step/i });
    expect((step2Btn as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(16000);
    });
    expect((step2Btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(step2Btn);

    // Step 2: Disabled initially, advance 16s, click
    const step3Btn = screen.getByRole("button", { name: /Next step/i });
    expect((step3Btn as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(16000);
    });
    expect((step3Btn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(step3Btn);

    // Step 3: Done button initially disabled, advance 21s, click
    const doneBtn = screen.getByRole("button", { name: /Done/i });
    expect((doneBtn as HTMLButtonElement).disabled).toBe(true);
    act(() => {
      vi.advanceTimersByTime(21000);
    });
    expect((doneBtn as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(doneBtn);

    vi.useRealTimers();

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
    expect(await screen.findByRole("button", { name: /Open chest/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Open chest/i }));

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
    expect(await screen.findByRole("button", { name: /Open chest/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Open chest/i }));

    expect(await screen.findByText("+6")).toBeTruthy();
    expect(screen.getByText("Every time you play, you get a chest.")).toBeTruthy();
  });

  it("opens chest directly when tapping the closed chest graphic", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow initialStep="chest" />
      </ProviderWrapper>,
    );

    expect(await screen.findByText("Tap the chest to open your reward!")).toBeTruthy();
    const chestButton = screen.getByTestId("open-treasure-chest");
    fireEvent.click(chestButton);

    expect(await screen.findByText("+12")).toBeTruthy();
    expect(screen.getByText("Every time you play, you get a chest.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Back home/i })).toBeTruthy();
  });

  it("Step 5 with Someone else (other): asks partner to confirm", async () => {
    vi.useFakeTimers();

    renderWithTheme(
      <ProviderWrapper>
        <PlayFlow />
      </ProviderWrapper>,
    );

    expect(screen.getByText("Who is playing?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Someone else/i }));

    expect(screen.getByText("How are you feeling?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Amazing, level 3/i }));

    expect(screen.getByText("Ready to play?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Let's play/i }));

    // Step 0 (10s):
    act(() => {
      vi.advanceTimersByTime(11000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));

    // Step 1 (20s):
    act(() => {
      vi.advanceTimersByTime(21000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));

    // Step 2 (20s):
    act(() => {
      vi.advanceTimersByTime(21000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Next step/i }));

    // Step 3 (20s - last step shows Done):
    act(() => {
      vi.advanceTimersByTime(21000);
    });
    fireEvent.click(screen.getByRole("button", { name: /Done/i }));

    vi.useRealTimers();

    // Someone else confirmation
    expect(await screen.findByText("Great teamwork!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    expect(await screen.findByText("How do you feel after playing?")).toBeTruthy();
  });
});
