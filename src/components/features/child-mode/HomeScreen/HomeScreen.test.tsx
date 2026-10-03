import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { FIRE_MAX } from "@/config/economy";
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

describe("Child Mode HomeScreen (Task V4 Redesign)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders main screen directly with dragon without redirecting when no child is configured", async () => {
    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Child Home Screen")).toBeDefined();
      expect(screen.getByLabelText("Mascot Stage")).toBeDefined();
    });
    expect(mockReplace).not.toHaveBeenCalledWith(ROUTES.parentSetup);
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
      // 5 check-ins = 25 coins
      checkIns: [
        {
          id: "c1",
          date: "2026-09-01",
          answers: {},
          notToday: false,
          createdAt: "2026-09-01T10:00:00Z",
        },
        {
          id: "c2",
          date: "2026-09-02",
          answers: {},
          notToday: false,
          createdAt: "2026-09-02T10:00:00Z",
        },
        {
          id: "c3",
          date: "2026-09-03",
          answers: {},
          notToday: false,
          createdAt: "2026-09-03T10:00:00Z",
        },
        {
          id: "c4",
          date: "2026-09-04",
          answers: {},
          notToday: false,
          createdAt: "2026-09-04T10:00:00Z",
        },
        {
          id: "c5",
          date: "2026-09-05",
          answers: {},
          notToday: false,
          createdAt: "2026-09-05T10:00:00Z",
        },
      ],
      missionLogs: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    // Fire bar with exact aria-label `Fire 40 of ${FIRE_MAX}`
    const fireBar = await screen.findByLabelText(`Fire 40 of ${FIRE_MAX}`);
    expect(fireBar).toBeDefined();
    expect(fireBar.textContent).toContain("40");

    // Coins pill with exact aria-label "Coins 25"
    const coinsPill = screen.getByLabelText("Coins 25");
    expect(coinsPill).toBeDefined();
    expect(coinsPill.textContent).toContain("25");

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

  it("renders big PLAY button linking to ROUTES.play and three action buttons linking to shop, food, and customize", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    // Big PLAY button
    const playButton = await screen.findByTestId("home-play-button");
    expect(playButton).toBeDefined();
    fireEvent.click(playButton);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.play);

    // Shop button
    const shopButton = screen.getByTestId("nav-shop");
    expect(shopButton).toBeDefined();
    fireEvent.click(shopButton);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.shop);

    // Food button
    const foodButton = screen.getByTestId("nav-food");
    expect(foodButton).toBeDefined();
    fireEvent.click(foodButton);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.food);

    // Customize button
    const customizeButton = screen.getByTestId("nav-customize");
    expect(customizeButton).toBeDefined();
    fireEvent.click(customizeButton);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.customize);
  });

  it("shows daily check-in entry when today's check-in is not done, and hides it when done", async () => {
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

    // Check-in entry is present
    const checkInLink = await screen.findByTestId("nav-check-in");
    expect(checkInLink).toBeDefined();
    expect(checkInLink.getAttribute("href")).toBe(ROUTES.checkIn);

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

    await screen.findByTestId("home-play-button");
    expect(screen.queryByTestId("nav-check-in")).toBeNull();
  });

  it("redirects to ROUTES.parent when deviceRole is parent", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const parentState: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      settings: {
        ...demo.settings!,
        deviceRole: "parent",
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parentState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.parent);
    });
  });

  it("renders small parent link and hides door link when deviceRole is child", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const childOnlyState: AppState = {
      ...demo,
      child: { nickname: "Lucas" },
      settings: {
        ...demo.settings!,
        deviceRole: "child",
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(childOnlyState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    await screen.findByTestId("home-play-button");
    expect(screen.queryByText("Parents")).toBeNull();
    const smallLink = screen.getByRole("link", { name: "Parent mode" });
    expect(smallLink).toBeDefined();
    expect(smallLink.getAttribute("href")).toBe(ROUTES.parent);
  });

  it("updates evolution environment and dragon artwork when reaching 100 and 200 fire", async () => {
    const today = todayKey();
    const demo = buildDemoState({ today });
    const youngState: AppState = {
      ...demo,
      economy: {
        ...demo.economy!,
        fire: 120,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(youngState));

    const { rerender } = renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByText(/Dragón Joven/i)).toBeDefined();
    expect(screen.getByLabelText(/Habitat: Dragón Joven/i)).toBeDefined();
    const artwork = screen.getByTestId("companion-exact-artwork");
    expect(artwork.getAttribute("href")).toBe("/dragon_stage2_teen.png");

    // Heroic dragon state (>= 200 fire)
    const heroicState: AppState = {
      ...demo,
      economy: {
        ...demo.economy!,
        fire: 200,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(heroicState));

    rerender(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByText(/Dragón Heroico/i)).toBeDefined();
    expect(screen.getByLabelText(/Habitat: Dragón Heroico/i)).toBeDefined();
    expect(screen.getByTestId("companion-exact-artwork").getAttribute("href")).toBe(
      "/dragon_stage3_heroic.png",
    );
  });
});
