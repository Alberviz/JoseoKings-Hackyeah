import type { AppState, CompanionItem, CompanionState } from "@/types";
import { CARE_DAYS_BADGE_TARGET } from "./constants";
import { BADGES, COMPANION_ITEMS } from "./items";
import { BADGE_IDS } from "@/config/content-ids";
import { countCareDays, totalPoints, totalTeamStars } from "./points";

const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])];

function earnedBadgeIds(state: Pick<AppState, "checkIns" | "missionLogs">): string[] {
  const earned: string[] = [];
  if (state.checkIns.length > 0) earned.push(BADGE_IDS.firstCheckIn);
  if (countCareDays(state.checkIns, state.missionLogs) >= CARE_DAYS_BADGE_TARGET)
    earned.push(BADGE_IDS.careDays30);
  if (state.missionLogs.some((m) => m.status === "completed" && m.company !== "alone")) {
    earned.push(BADGE_IDS.teamUp);
  }
  return earned;
}

function isUnlocked(item: CompanionItem, points: number, teamStars: number): boolean {
  return item.track === "main" ? points >= item.cost : teamStars >= item.cost;
}

/**
 * Recomputes the companion from the logs. Safe to call after every change (it is idempotent).
 * Nothing is ever taken away: points, stars, items and badges only go up, and equipped items stay equipped.
 */
export function syncCompanion(
  state: Pick<AppState, "checkIns" | "missionLogs" | "companion">,
  catalog: readonly CompanionItem[] = COMPANION_ITEMS,
): CompanionState {
  const { companion } = state;
  const points = Math.max(companion.points, totalPoints(state.checkIns, state.missionLogs));
  const teamStars = Math.max(companion.teamStars, totalTeamStars(state.missionLogs));
  const unlocked = catalog
    .filter((item) => isUnlocked(item, points, teamStars))
    .map((item) => item.id);
  const knownBadges = new Set(BADGES.map((b) => b.id));

  return {
    ...companion,
    points,
    teamStars,
    ownedItemIds: union(companion.ownedItemIds, unlocked),
    badgeIds: union(
      companion.badgeIds,
      earnedBadgeIds(state).filter((id) => knownBadges.has(id)),
    ),
  };
}

/** Puts an owned item on the companion. One item per slot: a new hat replaces the old hat. */
export function equipItem(
  companion: CompanionState,
  itemId: string,
  catalog: readonly CompanionItem[] = COMPANION_ITEMS,
): CompanionState {
  const item = catalog.find((i) => i.id === itemId);
  if (!item || !companion.ownedItemIds.includes(itemId)) return companion;
  const sameSlot = new Set(catalog.filter((i) => i.slot === item.slot).map((i) => i.id));
  return {
    ...companion,
    equippedItemIds: [...companion.equippedItemIds.filter((id) => !sameSlot.has(id)), itemId],
  };
}

export function unequipItem(companion: CompanionState, itemId: string): CompanionState {
  return { ...companion, equippedItemIds: companion.equippedItemIds.filter((id) => id !== itemId) };
}

export type NextUnlock = {
  item: CompanionItem;
  /** Progress inside the track, for a progress bar. */
  have: number;
  need: number;
};

/** The cheapest item the child has not unlocked yet on a track, or null when everything is unlocked. */
export function nextUnlock(
  companion: CompanionState,
  track: CompanionItem["track"],
  catalog: readonly CompanionItem[] = COMPANION_ITEMS,
): NextUnlock | null {
  const have = track === "main" ? companion.points : companion.teamStars;
  const locked = catalog
    .filter((item) => item.track === track && !companion.ownedItemIds.includes(item.id))
    .sort((a, b) => a.cost - b.cost);
  return locked[0] ? { item: locked[0], have, need: locked[0].cost } : null;
}
