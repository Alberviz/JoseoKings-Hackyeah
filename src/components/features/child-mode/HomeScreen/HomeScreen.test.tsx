import { screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { todayKey } from "@/lib/dates";
import { buildDemoState } from "@/lib/demo-data";
import { createDefaultEconomy } from "@/lib/economy";
import { STORAGE_KEY } from "@/lib/storage/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import type { AppState } from "@/types";
import { HomeScreen } from "./HomeScreen";

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

describe("Child Mode HomeScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("redirects to parentSetup when no child is configured", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.parentSetup);
    });
  });

  it("renders top bar with fire bar, coins pill, and parent mode link with required aria labels", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const customState: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      economy: {
        ...createDefaultEconomy(),
        fire: 40,
        coinsSpent: 0,
      },
      // Initial coins = 100
      checkIns: [],
      missionLogs: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    // Fire bar with exact aria-label "Fire 40 of 100"
    const fireBar = await screen.findByLabelText("Fire 40 of 100");
    expect(fireBar).toBeDefined();
    expect(fireBar.textContent).toContain("40");

    // Coins pill with exact aria-label "Coins 100"
    const coinsPill = screen.getByLabelText("Coins 100");
    expect(coinsPill).toBeDefined();
    expect(coinsPill.textContent).toContain("100");

    // Discreet Parent Door
    const parentLink = screen.getByRole("link", { name: /Parent mode/i });
    expect(parentLink).toBeDefined();
    expect(parentLink.getAttribute("href")).toBe(ROUTES.parent);
  });

  it("renders large Companion dragon wearing economy.equippedItemIds", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const customState: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      companion: {
        ...demo.companion,
        name: "Smok",
      },
      economy: {
        ...createDefaultEconomy(),
        equippedItemIds: ["hat"],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const mascot = await screen.findByRole("img", { name: /Smok \(idle pose\)/i });
    expect(mascot).toBeDefined();
  });

  it("renders a big PLAY link and one game bar with shop, food and dress up links", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const playLink = await screen.findByTestId("home-play-button");
    expect(playLink.getAttribute("href")).toBe(ROUTES.play);
    expect(playLink.getAttribute("aria-label")).toBe("Play");

    const bar = screen.getByRole("navigation", { name: "Game" });
    expect(within(bar).getByTestId("nav-shop").getAttribute("href")).toBe(ROUTES.shop);
    expect(within(bar).getByTestId("nav-food").getAttribute("href")).toBe(ROUTES.food);
    expect(within(bar).getByTestId("nav-customize").getAttribute("href")).toBe(ROUTES.customize);
    expect(within(bar).getByText("Shop")).toBeDefined();
    expect(within(bar).getByText("Food")).toBeDefined();
    expect(within(bar).getByText("Dress up")).toBeDefined();
  });

  it("shows the check-in bubble when today's check-in is not done, and a chip when it is", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    // State with NO check-in for today
    const stateWithoutTodayCheckIn: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      checkIns: demo.checkIns.filter((c) => c.date !== today),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithoutTodayCheckIn));

    const { unmount } = renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const checkInLink = await screen.findByTestId("nav-check-in");
    expect(checkInLink.getAttribute("href")).toBe(ROUTES.checkIn);
    expect(checkInLink.textContent).toContain("How are you today?");
    expect(checkInLink.textContent).toContain("Tap to tell me with drawings");
    expect(screen.queryByTestId("check-in-done")).toBeNull();

    unmount();

    // Now test state WITH today's check-in
    const stateWithTodayCheckIn: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      checkIns: [
        ...demo.checkIns.filter((c) => c.date !== today),
        {
          id: "today-checkin",
          date: today,
          answers: { "belly-comfort": 0, energy: 0, "play-pace": 0 },
          notToday: false,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTodayCheckIn));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const chip = await screen.findByTestId("check-in-done");
    expect(chip.textContent).toContain("Told me today");
    expect(screen.queryByTestId("nav-check-in")).toBeNull();
  });

  it("renders dragon evolution stage badge with English copy and updates with fire level", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const customState: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      economy: {
        ...createDefaultEconomy(),
        fire: 0,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customState));

    const { unmount } = renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const badge = await screen.findByTestId("evolution-stage-badge");
    expect(badge).toBeDefined();
    expect(badge.textContent).toContain("Baby Dragon");
    expect(badge.textContent).toContain("50 fire to grow");

    unmount();

    const heroState: AppState = {
      ...customState,
      economy: {
        ...createDefaultEconomy(),
        fire: 100,
        highestFire: 100,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(heroState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    const heroBadge = await screen.findByTestId("evolution-stage-badge");
    expect(heroBadge.textContent).toContain("Hero Dragon");
    expect(heroBadge.textContent).toContain("Max level!");
  });
});
