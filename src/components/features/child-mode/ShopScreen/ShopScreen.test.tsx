import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { INITIAL_COINS } from "@/config/economy";
import { buildDemoState } from "@/lib/demo-data";
import { STORAGE_KEY } from "@/lib/storage/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { ShopScreen } from "./ShopScreen";

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

describe("ShopScreen (Task V6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders top counters, back link, items, and special rewards", async () => {
    const demo = buildDemoState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <ShopScreen />
      </ProviderWrapper>,
    );

    // Back link to home
    const backLink = await screen.findByRole("link", { name: /Home/i });
    expect(backLink.getAttribute("href")).toBe(ROUTES.home);

    // Items list
    expect(screen.getByText("Food")).toBeDefined();
    expect(screen.getByText("Glasses")).toBeDefined();
    expect(screen.getByText("T-shirt")).toBeDefined();
    expect(screen.getByText("Hat")).toBeDefined();

    // Rewards from home section
    expect(screen.getByText("Rewards from home")).toBeDefined();
  });

  it("shows friendly inline message when trying to buy without enough coins", async () => {
    const demo = {
      ...buildDemoState(),
      checkIns: [],
      missionLogs: [],
      economy: {
        ...buildDemoState().economy,
        coinsSpent: INITIAL_COINS,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <ShopScreen />
      </ProviderWrapper>,
    );

    const buyButtons = await screen.findAllByRole("button", { name: /^Buy/i });
    expect(buyButtons.length).toBeGreaterThan(0);

    fireEvent.click(buyButtons[0]);

    // Friendly failure message
    expect(await screen.findByText("Not enough coins yet. Play to earn more.")).toBeDefined();
  });

  it("shows 'Owned' for already owned wearables", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        ownedItemIds: ["glasses" as const],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <ShopScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByText("Owned")).toBeDefined();
  });

  it("claims a reward from home and shows requested status", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        fire: 60,
        specialRewards: [{ id: "choose-dinner", name: "Choose today's dinner", fireCost: 50 }],
        rewardClaims: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <ShopScreen />
      </ProviderWrapper>,
    );

    const claimButton = await screen.findByRole("button", {
      name: /Claim Choose today's dinner/i,
    });
    fireEvent.click(claimButton);

    // Should show friendly asked message
    const messages = await screen.findAllByText("Asked! Your family will tell you when.");
    expect(messages.length).toBeGreaterThan(0);
  });
});
