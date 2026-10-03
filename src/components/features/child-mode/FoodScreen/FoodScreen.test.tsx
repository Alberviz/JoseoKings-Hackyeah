import { fireEvent, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { buildDemoState } from "@/lib/demo-data";
import { STORAGE_KEY } from "@/lib/storage/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import { FoodScreen } from "./FoodScreen";

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

describe("FoodScreen (Task V6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows food count, dragon mascot, fire bar, and give food button", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        fire: 40,
        inventory: { food: 3 },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <FoodScreen />
      </ProviderWrapper>,
    );

    // Shows food count
    expect(await screen.findByText(/Food: 3/i)).toBeDefined();

    // Fire bar
    const fireBar = screen.getByRole("progressbar", { name: /Dragon fire bar/i });
    expect(fireBar).toBeDefined();
    expect(fireBar.getAttribute("aria-valuenow")).toBe("40");
    expect(fireBar.getAttribute("aria-valuemax")).toBe("100");

    // Give food button
    const giveFoodBtn = screen.getByRole("button", { name: /Give food/i });
    expect(giveFoodBtn).toBeDefined();
    expect(giveFoodBtn.hasAttribute("disabled")).toBe(false);
  });

  it("gives food to companion, raising fire and reducing food count", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        fire: 20,
        inventory: { food: 1 },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <FoodScreen />
      </ProviderWrapper>,
    );

    const giveFoodBtn = await screen.findByRole("button", { name: /Give food/i });
    fireEvent.click(giveFoodBtn);

    // Shows eating flame puff and floating fire badge
    expect(await screen.findByTestId("floating-fire-puff")).toBeDefined();
    expect(screen.getByTestId("companion-flame-puff")).toBeDefined();

    // Fire should now be 30
    expect(await screen.findByText(/30 \/ 100/i)).toBeDefined();
    // Food count should now be 0
    expect(screen.getByText(/Food: 0/i)).toBeDefined();

    // Now that food is 0, link to shop appears
    const shopLink = screen.getByRole("link", { name: /Buy food in the shop/i });
    expect(shopLink.getAttribute("href")).toBe(ROUTES.shop);
  });

  it("shows link to shop when food is 0 initially", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        fire: 50,
        inventory: { food: 0 },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <FoodScreen />
      </ProviderWrapper>,
    );

    const shopLink = await screen.findByRole("link", { name: /Buy food in the shop/i });
    expect(shopLink.getAttribute("href")).toBe(ROUTES.shop);

    const giveFoodBtn = screen.getByRole("button", { name: /Give food/i });
    expect(giveFoodBtn.hasAttribute("disabled")).toBe(true);
  });
});
