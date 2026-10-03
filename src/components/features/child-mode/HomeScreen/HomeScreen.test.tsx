import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { ROUTES } from "@/config/app";
import { buildDemoState } from "@/lib/demo-data";
import { STORAGE_KEY } from "@/lib/storage/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
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

describe("Child Mode HomeScreen (Task T6)", () => {
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

  it("renders the Krakow dragon companion, play button, and child navigation when child exists", async () => {
    // Populate valid demo AppState in localStorage
    const savedState = {
      ...buildDemoState(),
      companion: {
        ...buildDemoState().companion,
        name: "Smok",
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

    renderWithTheme(
      <ProviderWrapper>
        <HomeScreen />
      </ProviderWrapper>,
    );

    // Mascot renders with name and idle pose
    const mascot = await screen.findByRole("img", { name: /Smok \(idle pose\)/i });
    expect(mascot).toBeDefined();

    // Large play button leads to missions
    const playButton = screen.getByTestId("home-play-button");
    expect(playButton).toBeDefined();
    fireEvent.click(playButton);
    expect(mockPush).toHaveBeenCalledWith(ROUTES.missions);

    // Child Navigation items
    expect(screen.getByTestId("nav-check-in")).toBeDefined();
    expect(screen.getByTestId("nav-missions")).toBeDefined();
    expect(screen.getByTestId("nav-companion")).toBeDefined();

    // Discreet Parent Door
    expect(screen.getByRole("link", { name: /Parent mode/i })).toBeDefined();

    // Verifies Tamagotchi / medical anti-requirements: NO feed, NO medicines
    expect(screen.queryByText(/feed/i)).toBeNull();
    expect(screen.queryByText(/medicines/i)).toBeNull();
  });
});
