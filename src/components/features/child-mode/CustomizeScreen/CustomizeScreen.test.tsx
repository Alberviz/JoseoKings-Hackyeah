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
import { CustomizeScreen } from "./CustomizeScreen";

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

describe("CustomizeScreen (Task V6)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("shows empty state when no wearables are owned", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        ownedItemIds: [],
        equippedItemIds: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <CustomizeScreen />
      </ProviderWrapper>,
    );

    expect(await screen.findByText(/You don't have any accessories yet/i)).toBeDefined();

    const shopLink = screen.getByRole("link", { name: /Visit the shop/i });
    expect(shopLink.getAttribute("href")).toBe(ROUTES.shop);
  });

  it("renders owned wearables as square buttons and toggles equip/unequip", async () => {
    const demo = {
      ...buildDemoState(),
      economy: {
        ...buildDemoState().economy,
        ownedItemIds: ["glasses" as const, "hat" as const],
        equippedItemIds: ["glasses" as const],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));

    renderWithTheme(
      <ProviderWrapper>
        <CustomizeScreen />
      </ProviderWrapper>,
    );

    // Companion is rendered
    expect(await screen.findByRole("img", { name: /idle pose/i })).toBeDefined();

    // Glasses button is worn (aria-pressed="true")
    const glassesBtn = screen.getByRole("button", { name: /Glasses \(worn\)/i });
    expect(glassesBtn).toBeDefined();
    expect(glassesBtn.getAttribute("aria-pressed")).toBe("true");

    // Hat button is not worn (aria-pressed="false")
    const hatBtn = screen.getByRole("button", { name: /^Hat$/i });
    expect(hatBtn).toBeDefined();
    expect(hatBtn.getAttribute("aria-pressed")).toBe("false");

    // Clicking worn glasses should unequip it
    fireEvent.click(glassesBtn);
    expect(glassesBtn.getAttribute("aria-pressed")).toBe("false");

    // Clicking hat should equip it
    fireEvent.click(hatBtn);
    expect(hatBtn.getAttribute("aria-pressed")).toBe("true");
  });
});
