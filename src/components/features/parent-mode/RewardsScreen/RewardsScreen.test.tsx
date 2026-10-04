import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { sessionStore } from "@/hooks/useParentSession";
import { createDefaultEconomy } from "@/lib/economy";
import { createPinRecord } from "@/lib/pin";
import { saveState, STORAGE_KEY } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { theme } from "@/theme/theme";
import type { AppState, EconomyState } from "@/types";
import { RewardsScreen } from "./RewardsScreen";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

function ProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <AppStateProvider>{children}</AppStateProvider>
    </ThemeProvider>
  );
}

async function seedReadyState(economy: EconomyState = createDefaultEconomy()) {
  const pinRecord = await createPinRecord("1234");
  const state: AppState = {
    schemaVersion: 1,
    isDemo: false,
    child: { nickname: "Lucas" },
    settings: { ...pinRecord },
    companion: {
      name: "Hero",
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
      equippedItemIds: [],
      badgeIds: [],
    },
    economy,
    checkIns: [],
    missionLogs: [],
    parentLogs: [],
    foodEntries: [],
    consultations: [],
  };
  saveState(state);
}

function readEconomy(): EconomyState {
  const raw = localStorage.getItem(STORAGE_KEY);
  return (JSON.parse(raw as string) as AppState).economy;
}

function renderScreen() {
  renderWithTheme(
    <ProviderWrapper>
      <RewardsScreen />
    </ProviderWrapper>,
  );
}

describe("RewardsScreen", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
    mockReplace.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    sessionStore.resetForTesting();
  });

  it("shows the PIN gate when locked", async () => {
    await seedReadyState();
    renderScreen();
    expect(await screen.findByLabelText("4-digit PIN")).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Family rewards" })).toBeNull();
  });

  it("adds, edits and removes a reward", async () => {
    await seedReadyState({ ...createDefaultEconomy(), specialRewards: [] });
    sessionStore.setUnlocked(true);
    renderScreen();

    await screen.findByRole("heading", { name: "Family rewards" });
    expect(screen.getByText("No rewards yet. Add the first one below.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Reward name"), { target: { value: "Movie night" } });
    fireEvent.change(screen.getByLabelText("Price in fire"), { target: { value: "40" } });
    fireEvent.click(screen.getByRole("button", { name: "Add reward" }));
    expect(await screen.findByText("Reward added.")).toBeTruthy();
    await waitFor(() =>
      expect(readEconomy().specialRewards).toMatchObject([{ name: "Movie night", fireCost: 40 }]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Edit Movie night" }));
    const list = screen.getByRole("list", { name: "Special rewards" });
    fireEvent.change(within(list).getByLabelText("Reward name"), {
      target: { value: "Pizza night" },
    });
    fireEvent.change(within(list).getByLabelText("Price in fire"), { target: { value: "55" } });
    fireEvent.click(screen.getByRole("button", { name: "Save reward" }));
    expect(await screen.findByText("Reward updated.")).toBeTruthy();
    await waitFor(() =>
      expect(readEconomy().specialRewards).toMatchObject([{ name: "Pizza night", fireCost: 55 }]),
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Pizza night" }));
    expect(await screen.findByText("Reward removed.")).toBeTruthy();
    await waitFor(() => expect(readEconomy().specialRewards).toEqual([]));
  });

  it("rejects an invalid price and keeps the list unchanged", async () => {
    await seedReadyState();
    sessionStore.setUnlocked(true);
    renderScreen();

    await screen.findByRole("heading", { name: "Family rewards" });
    const before = readEconomy().specialRewards.length;
    fireEvent.change(screen.getByLabelText("Reward name"), { target: { value: "Zoo trip" } });
    fireEvent.change(screen.getByLabelText("Price in fire"), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: "Add reward" }));

    expect(await screen.findByText("Enter a whole number from 1 to 100.")).toBeTruthy();
    expect(readEconomy().specialRewards).toHaveLength(before);
  });

  it("confirms a requested claim without changing fire", async () => {
    await seedReadyState({
      ...createDefaultEconomy(),
      fire: 20,
      specialRewards: [{ id: "rew-1", name: "Movie night", fireCost: 30 }],
      rewardClaims: [
        {
          id: "claim-1",
          rewardId: "rew-1",
          date: "2026-10-04",
          createdAt: "2026-10-04T18:00:00Z",
          status: "requested",
        },
      ],
    });
    sessionStore.setUnlocked(true);
    renderScreen();

    await screen.findByRole("heading", { name: "Family rewards" });
    expect(screen.getByText("Asked on 2026-10-04")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Confirm Movie night was given" }));

    expect(await screen.findByText("Marked as given.")).toBeTruthy();
    expect(screen.getByText("No requests right now.")).toBeTruthy();
    await waitFor(() => {
      const economy = readEconomy();
      expect(economy.rewardClaims[0]?.status).toBe("done");
      expect(economy.fire).toBe(20);
    });
  });

  it("names a claim whose reward was removed", async () => {
    await seedReadyState({
      ...createDefaultEconomy(),
      specialRewards: [],
      rewardClaims: [
        {
          id: "claim-1",
          rewardId: "gone",
          date: "2026-10-04",
          createdAt: "2026-10-04T18:00:00Z",
          status: "requested",
        },
      ],
    });
    sessionStore.setUnlocked(true);
    renderScreen();

    expect(await screen.findByText("A family reward")).toBeTruthy();
  });
});
