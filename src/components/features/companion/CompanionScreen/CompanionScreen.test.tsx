import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { AppStateProvider } from "@/components/providers/AppStateProvider";
import { BADGE_IDS, ITEM_IDS } from "@/config/content-ids";
import { STORAGE_KEY, createEmptyState } from "@/lib/storage";
import { renderWithTheme } from "@/test/renderWithTheme";
import { CompanionScreen } from "./CompanionScreen";
import type { CompanionState } from "@/types";

function seedState(companionPartial: Partial<CompanionState> = {}) {
  const state = createEmptyState();
  state.child = { nickname: "Lucas" };
  state.companion = {
    ...state.companion,
    name: "Draco",
    ...companionPartial,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

describe("CompanionScreen (T15)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("renders screen title, back button, companion name and preview", async () => {
    seedState({
      points: 20,
      ownedItemIds: [ITEM_IDS.hatExplorer],
    });

    const { findByRole, findByText } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    expect(await findByRole("heading", { level: 1, name: "Your Companion" })).toBeDefined();
    expect(await findByText("← Home")).toBeDefined();
    expect(await findByRole("heading", { level: 3, name: "Draco" })).toBeDefined();
    expect(await findByText("Main Track")).toBeDefined();
    expect(await findByText("Team Track")).toBeDefined();
  });

  it("switches companion poses when clicking pose buttons", async () => {
    seedState();

    const { findByRole } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    const cheerBtn = await findByRole("button", { name: "cheer" });
    expect(cheerBtn.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(cheerBtn);
    expect(cheerBtn.getAttribute("aria-pressed")).toBe("true");

    const idleBtn = await findByRole("button", { name: "idle" });
    expect(idleBtn.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(idleBtn);
    expect(idleBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("displays track progress and next unlock milestones", async () => {
    seedState({
      points: 10,
      teamStars: 1,
    });

    const { findByText, findAllByText } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    // 10 points on main track
    expect(await findByText("10 points")).toBeDefined();
    const nextElements = await findAllByText(/Next:/);
    expect(nextElements.length).toBe(2);
    const explorerHats = await findAllByText(/Explorer hat/);
    expect(explorerHats.length).toBe(2);

    // 1 star on team track
    expect(await findByText("1 stars")).toBeDefined();
    const teamCapes = await findAllByText(/Team cape/);
    expect(teamCapes.length).toBe(2);
  });

  it("shows completion message when all track items are unlocked", async () => {
    seedState({
      points: 100,
      teamStars: 10,
      ownedItemIds: [
        ITEM_IDS.hatExplorer,
        ITEM_IDS.colorTeal,
        ITEM_IDS.gadgetGoggles,
        ITEM_IDS.capeStar,
      ],
    });

    const { findByText } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    expect(await findByText("All main track items unlocked!")).toBeDefined();
    expect(await findByText("All team track items unlocked!")).toBeDefined();
  });

  it("filters items by track", async () => {
    seedState({
      ownedItemIds: [ITEM_IDS.hatExplorer, ITEM_IDS.capeStar],
    });

    const { findByRole, queryByRole } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    // Filter to Team Track
    const teamFilterBtn = await findByRole("button", { name: /Team Track/ });
    fireEvent.click(teamFilterBtn);

    // Explorer hat (main track) equip button should not be in the items grid
    expect(queryByRole("button", { name: "Equip Explorer hat" })).toBeNull();
    // Team cape equip button should be in the items grid
    expect(queryByRole("button", { name: "Equip Team cape" })).not.toBeNull();

    // Switch back to All
    const allFilterBtn = await findByRole("button", { name: /All Items/ });
    fireEvent.click(allFilterBtn);
    expect(queryByRole("button", { name: "Equip Explorer hat" })).not.toBeNull();
  });

  it("equips and unequips unlocked items", async () => {
    seedState({
      points: 25,
      ownedItemIds: [ITEM_IDS.hatExplorer],
      equippedItemIds: [],
    });

    const { findByRole } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    // Equip button for Explorer hat
    const equipHatBtn = await findByRole("button", { name: "Equip Explorer hat" });
    fireEvent.click(equipHatBtn);

    // Should now be equipped with Unequip button
    const unequipHatBtn = await findByRole("button", { name: "Unequip Explorer hat" });
    expect(unequipHatBtn).toBeDefined();

    // Unequip again
    fireEvent.click(unequipHatBtn);
    const reEquipBtn = await findByRole("button", { name: "Equip Explorer hat" });
    expect(reEquipBtn).toBeDefined();
  });

  it("shows locked items with clear requirements without sad state", async () => {
    seedState({
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
    });

    const { findByText } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    expect(await findByText("Unlocks at 20 points")).toBeDefined();
    expect(await findByText("Unlocks at 40 points")).toBeDefined();
    expect(await findByText("Unlocks at 80 points")).toBeDefined();
    expect(await findByText("Unlocks at 3 team stars")).toBeDefined();
  });

  it("displays badges and indicates whether they are earned or in progress", async () => {
    seedState({
      badgeIds: [BADGE_IDS.firstCheckIn],
    });

    const { findByText, findAllByText } = renderWithTheme(
      <AppStateProvider>
        <CompanionScreen />
      </AppStateProvider>,
    );

    expect(await findByText("First check-in")).toBeDefined();
    expect(await findByText("30 care days")).toBeDefined();
    expect(await findByText("Team up")).toBeDefined();

    // One earned, two in progress
    const earnedBadges = await findAllByText("Earned");
    expect(earnedBadges).toHaveLength(1);

    const inProgressBadges = await findAllByText("In Progress");
    expect(inProgressBadges).toHaveLength(2);
  });
});
