import {
  CHECKIN_COINS,
  CHECKIN_SKIP_COINS,
  CHEST_COINS,
  DEFAULT_SPECIAL_REWARDS,
  DRAGON_EVOLUTION_STAGES,
  DRAGON_EVOLUTION_THRESHOLDS,
  FIRE_MAX,
  FOOD_FIRE,
  INITIAL_COINS,
  REST_COINS,
  SHOP_ITEMS,
  SPECIAL_REWARD_COST_MAX,
  SPECIAL_REWARD_COST_MIN,
  SPECIAL_REWARD_NAME_MAX_LENGTH,
} from "@/config/economy";
import type {
  AppState,
  CheckIn,
  DateKey,
  DragonEvolutionInfo,
  DragonStageId,
  EconomyState,
  MissionLog,
  ShopItem,
  ShopItemId,
  SpecialReward,
} from "@/types";

export type EconomySource = Pick<AppState, "checkIns" | "missionLogs" | "economy">;

export type BuyResult =
  | { ok: true; economy: EconomyState }
  | { ok: false; reason: "not-enough-coins" | "already-owned" | "unknown-item" };

export type GiveFoodResult = { ok: true; economy: EconomyState } | { ok: false; reason: "no-food" };

export type ClaimResult =
  { ok: true; economy: EconomyState } | { ok: false; reason: "not-enough-fire" | "unknown-reward" };

export type SetSpecialRewardsResult =
  | { ok: true; economy: EconomyState }
  | { ok: false; reason: "invalid-name" | "invalid-cost" | "duplicate-id" };

export type ClaimOptions = {
  /** Returns a new unique id. Tests inject a deterministic one. */
  generateId?: () => string;
  now?: Date;
};

/** A random UUID so claim ids stay unique across devices. The fallback is only for runtimes without crypto. */
export function generateClaimId(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  return `claim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDefaultEconomy(): EconomyState {
  return {
    fire: 0,
    highestFire: 0,
    coinsSpent: 0,
    inventory: { food: 0 },
    ownedItemIds: [],
    equippedItemIds: [],
    specialRewards: DEFAULT_SPECIAL_REWARDS.map((reward) => ({ ...reward })),
    rewardClaims: [],
  };
}

export function findShopItem(itemId: string): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === itemId);
}

/**
 * Coins are derived from the records, so recomputing never double counts: one check-in per
 * date and one mission log per id. The amount depends only on whether the child checked in
 * fully or skipped, and whether a mission was completed or stopped early (rest).
 */
export function coinsEarned(source: Pick<AppState, "checkIns" | "missionLogs">): number {
  const checkInByDate = new Map<string, CheckIn>();
  for (const checkIn of source.checkIns) {
    if (!checkInByDate.has(checkIn.date)) {
      checkInByDate.set(checkIn.date, checkIn);
    }
  }
  let total = 0;
  for (const checkIn of checkInByDate.values()) {
    total += checkIn.notToday ? CHECKIN_SKIP_COINS : CHECKIN_COINS;
  }
  const seenLogs = new Map<string, MissionLog>();
  for (const log of source.missionLogs) {
    if (!seenLogs.has(log.id)) {
      seenLogs.set(log.id, log);
    }
  }
  for (const log of seenLogs.values()) {
    total += log.status === "completed" ? CHEST_COINS : REST_COINS;
  }
  return total;
}

export function coinBalance(state: EconomySource): number {
  return Math.max(0, INITIAL_COINS + coinsEarned(state) - state.economy.coinsSpent);
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
  const nextFire = Math.min(FIRE_MAX, economy.fire + FOOD_FIRE);
  const highestFire = Math.max(economy.highestFire ?? economy.fire, nextFire);
  return {
    ok: true,
    economy: {
      ...economy,
      fire: nextFire,
      highestFire,
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

/** The only place where fire goes down: the child chooses to claim a special reward. */
export function claimReward(
  economy: EconomyState,
  rewardId: string,
  today: DateKey,
  options: ClaimOptions = {},
): ClaimResult {
  const { generateId = generateClaimId, now = new Date() } = options;
  const reward = economy.specialRewards.find((r) => r.id === rewardId);
  if (!reward) {
    return { ok: false, reason: "unknown-reward" };
  }
  if (economy.fire < reward.fireCost) {
    return { ok: false, reason: "not-enough-fire" };
  }
  const highestFire = Math.max(economy.highestFire ?? economy.fire, economy.fire);
  return {
    ok: true,
    economy: {
      ...economy,
      fire: economy.fire - reward.fireCost,
      highestFire,
      rewardClaims: [
        ...economy.rewardClaims,
        {
          id: generateId(),
          rewardId,
          date: today,
          createdAt: now.toISOString(),
          status: "requested",
        },
      ],
    },
  };
}

/** A parent confirms the reward was given. Fire does not change. Unknown or already done: unchanged. */
export function markClaimDone(
  economy: EconomyState,
  claimId: string,
  today: DateKey,
): EconomyState {
  const claim = economy.rewardClaims.find((c) => c.id === claimId);
  if (!claim || claim.status === "done") {
    return economy;
  }
  return {
    ...economy,
    rewardClaims: economy.rewardClaims.map((c) =>
      c.id === claimId ? { ...c, status: "done", doneAt: today } : c,
    ),
  };
}

export function setSpecialRewards(
  economy: EconomyState,
  rewards: readonly SpecialReward[],
): SetSpecialRewardsResult {
  const cleaned: SpecialReward[] = [];
  for (const reward of rewards) {
    const name = reward.name.trim();
    if (name.length < 1 || name.length > SPECIAL_REWARD_NAME_MAX_LENGTH) {
      return { ok: false, reason: "invalid-name" };
    }
    if (
      !Number.isInteger(reward.fireCost) ||
      reward.fireCost < SPECIAL_REWARD_COST_MIN ||
      reward.fireCost > SPECIAL_REWARD_COST_MAX
    ) {
      return { ok: false, reason: "invalid-cost" };
    }
    if (cleaned.some((c) => c.id === reward.id)) {
      return { ok: false, reason: "duplicate-id" };
    }
    cleaned.push({ id: reward.id, name, fireCost: reward.fireCost });
  }
  return { ok: true, economy: { ...economy, specialRewards: cleaned } };
}

/**
 * Calculates current dragon evolution details based on current fire.
 * When fire is spent on rewards, the stage dynamically adjusts (e.g. 100 Hero -> spends 50 -> 50 Young).
 */
export function getDragonEvolution(
  economy: Pick<EconomyState, "fire"> & { highestFire?: number },
): DragonEvolutionInfo {
  const currentFire = Math.max(0, economy.fire ?? 0);
  const highestFire = Math.max(currentFire, economy.highestFire ?? 0);

  let stage: DragonStageId = 1;
  if (currentFire >= DRAGON_EVOLUTION_THRESHOLDS.stage3) {
    stage = 3;
  } else if (currentFire >= DRAGON_EVOLUTION_THRESHOLDS.stage2) {
    stage = 2;
  }

  const stageConfig = DRAGON_EVOLUTION_STAGES[stage];
  const fireNeededForNext =
    stageConfig.nextThreshold !== null ? Math.max(0, stageConfig.nextThreshold - currentFire) : 0;

  return {
    ...stageConfig,
    fireNeededForNext,
    highestFire,
  };
}
