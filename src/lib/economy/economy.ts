import {
  CHEST_COINS,
  DEFAULT_TREATS,
  FIRE_MAX,
  FOOD_FIRE,
  SHOP_ITEMS,
  TREAT_COST_MAX,
  TREAT_COST_MIN,
  TREAT_LABEL_MAX_LENGTH,
} from "@/config/economy";
import type {
  AppState,
  DateKey,
  EconomyState,
  MissionLog,
  ShopItem,
  ShopItemId,
  Treat,
} from "@/types";

export type EconomySource = Pick<AppState, "missionLogs" | "economy">;

export type BuyResult =
  | { ok: true; economy: EconomyState }
  | { ok: false; reason: "not-enough-coins" | "already-owned" | "unknown-item" };

export type GiveFoodResult = { ok: true; economy: EconomyState } | { ok: false; reason: "no-food" };

export type RedeemResult =
  { ok: true; economy: EconomyState } | { ok: false; reason: "not-enough-fire" | "unknown-treat" };

export type SetTreatsResult =
  | { ok: true; economy: EconomyState }
  | { ok: false; reason: "invalid-label" | "invalid-cost" | "duplicate-id" };

export function createDefaultEconomy(): EconomyState {
  return {
    fire: 0,
    coinsSpent: 0,
    inventory: { food: 0 },
    ownedItemIds: [],
    equippedItemIds: [],
    treats: DEFAULT_TREATS.map((treat) => ({ ...treat })),
    redemptions: [],
  };
}

export function findShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

/** Coins are derived from the logs, so recomputing never double counts. Rest sessions give no chest. */
export function coinsEarned(missionLogs: readonly MissionLog[]): number {
  const completed = new Set<string>();
  for (const log of missionLogs) {
    if (log.status === "completed") {
      completed.add(log.id);
    }
  }
  return completed.size * CHEST_COINS;
}

export function coinBalance(state: EconomySource): number {
  return Math.max(0, coinsEarned(state.missionLogs) - state.economy.coinsSpent);
}

export function buyItem(state: EconomySource, itemId: string): BuyResult {
  const item = findShopItem(itemId);
  if (!item) {
    return { ok: false, reason: "unknown-item" };
  }
  const { economy } = state;
  if (item.kind === "wearable" && economy.ownedItemIds.includes(item.id)) {
    return { ok: false, reason: "already-owned" };
  }
  if (coinBalance(state) < item.price) {
    return { ok: false, reason: "not-enough-coins" };
  }
  const next: EconomyState = { ...economy, coinsSpent: economy.coinsSpent + item.price };
  if (item.kind === "consumable") {
    return {
      ok: true,
      economy: { ...next, inventory: { ...economy.inventory, food: economy.inventory.food + 1 } },
    };
  }
  return { ok: true, economy: { ...next, ownedItemIds: [...economy.ownedItemIds, item.id] } };
}

export function giveFood(economy: EconomyState): GiveFoodResult {
  if (economy.inventory.food <= 0) {
    return { ok: false, reason: "no-food" };
  }
  return {
    ok: true,
    economy: {
      ...economy,
      fire: Math.min(FIRE_MAX, economy.fire + FOOD_FIRE),
      inventory: { ...economy.inventory, food: economy.inventory.food - 1 },
    },
  };
}

function slotOf(itemId: ShopItemId): string | undefined {
  const item = findShopItem(itemId);
  return item?.kind === "wearable" ? item.slot : undefined;
}

/** Equips an owned wearable. It replaces whatever is worn in the same slot. */
export function equipItem(economy: EconomyState, itemId: string): EconomyState {
  const item = findShopItem(itemId);
  if (!item || item.kind !== "wearable" || !economy.ownedItemIds.includes(item.id)) {
    return economy;
  }
  const kept = economy.equippedItemIds.filter((id) => id !== item.id && slotOf(id) !== item.slot);
  return { ...economy, equippedItemIds: [...kept, item.id] };
}

export function unequipItem(economy: EconomyState, itemId: string): EconomyState {
  if (!economy.equippedItemIds.some((id) => id === itemId)) {
    return economy;
  }
  return { ...economy, equippedItemIds: economy.equippedItemIds.filter((id) => id !== itemId) };
}

/** The only place where fire goes down: the child chooses to spend it. */
export function redeemTreat(economy: EconomyState, treatId: string, today: DateKey): RedeemResult {
  const treat = economy.treats.find((t) => t.id === treatId);
  if (!treat) {
    return { ok: false, reason: "unknown-treat" };
  }
  if (economy.fire < treat.fireCost) {
    return { ok: false, reason: "not-enough-fire" };
  }
  return {
    ok: true,
    economy: {
      ...economy,
      fire: economy.fire - treat.fireCost,
      redemptions: [
        ...economy.redemptions,
        { id: `redemption-${economy.redemptions.length + 1}`, treatId, date: today },
      ],
    },
  };
}

export function setTreats(economy: EconomyState, treats: readonly Treat[]): SetTreatsResult {
  const cleaned: Treat[] = [];
  for (const treat of treats) {
    const label = treat.label.trim();
    if (label.length < 1 || label.length > TREAT_LABEL_MAX_LENGTH) {
      return { ok: false, reason: "invalid-label" };
    }
    if (
      !Number.isInteger(treat.fireCost) ||
      treat.fireCost < TREAT_COST_MIN ||
      treat.fireCost > TREAT_COST_MAX
    ) {
      return { ok: false, reason: "invalid-cost" };
    }
    if (cleaned.some((c) => c.id === treat.id)) {
      return { ok: false, reason: "duplicate-id" };
    }
    cleaned.push({ id: treat.id, label, fireCost: treat.fireCost });
  }
  return { ok: true, economy: { ...economy, treats: cleaned } };
}
