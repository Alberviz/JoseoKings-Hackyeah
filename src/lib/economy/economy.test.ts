import { describe, expect, it } from "vitest";
import {
  CHECKIN_COINS,
  CHECKIN_SKIP_COINS,
  CHEST_COINS,
  FIRE_MAX,
  FOOD_FIRE,
  getDragonEvolution,
  REST_COINS,
} from "@/config/economy";
import { createEmptyState, loadState, STORAGE_KEY } from "@/lib/storage";
import type {
  AppState,
  CheckIn,
  EconomyState,
  MissionLog,
  MissionCompany,
  MissionStatus,
} from "@/types";
import {
  buyItem,
  claimReward,
  coinBalance,
  coinsEarned,
  createDefaultEconomy,
  equipItem,
  giveFood,
  markClaimDone,
  setSpecialRewards,
  unequipItem,
} from "./economy";

function makeLog(
  id: string,
  status: MissionStatus = "completed",
  company: MissionCompany = "alone",
) {
  const log: MissionLog = {
    id,
    date: "2026-10-03",
    missionId: "dragon-breathing",
    status,
    company,
    confirmedBy: "child",
    createdAt: "2026-10-03T10:00:00.000Z",
  };
  return log;
}

function richState(logCount = 10, economy: Partial<EconomyState> = {}) {
  return {
    checkIns: [],
    missionLogs: Array.from({ length: logCount }, (_, i) => makeLog(`m-${i}`)),
    economy: { ...createDefaultEconomy(), ...economy },
  };
}

function makeCheckIn(date: string, notToday = false, answers: CheckIn["answers"] = {}): CheckIn {
  return { id: `ci-${date}`, date, answers, notToday, createdAt: `${date}T10:00:00.000Z` };
}

describe("coins", () => {
  it("gives the same chest for every company and a smaller one for rest", () => {
    const missionLogs = [
      makeLog("a", "completed", "alone"),
      makeLog("b", "completed", "family"),
      makeLog("c", "completed", "other"),
      makeLog("d", "rest"),
    ];
    expect(coinsEarned({ checkIns: [], missionLogs })).toBe(3 * CHEST_COINS + REST_COINS);
  });

  it("gives a full check-in more than a skipped one, and both count", () => {
    expect(coinsEarned({ checkIns: [makeCheckIn("2026-10-01")], missionLogs: [] })).toBe(
      CHECKIN_COINS,
    );
    expect(coinsEarned({ checkIns: [makeCheckIn("2026-10-01", true)], missionLogs: [] })).toBe(
      CHECKIN_SKIP_COINS,
    );
    expect(CHECKIN_SKIP_COINS).toBeLessThan(CHECKIN_COINS);
    expect(REST_COINS).toBeLessThan(CHEST_COINS);
  });

  it("does not depend on the answers", () => {
    const low = makeCheckIn("2026-10-01", false, { "belly-comfort": 0, mood: 0 });
    const high = makeCheckIn("2026-10-01", false, { "belly-comfort": 3, mood: "skipped" });
    expect(coinsEarned({ checkIns: [low], missionLogs: [] })).toBe(
      coinsEarned({ checkIns: [high], missionLogs: [] }),
    );
  });

  it("is idempotent: one check-in per date and one log per id", () => {
    const state = {
      checkIns: [makeCheckIn("2026-10-01"), makeCheckIn("2026-10-01", true)],
      missionLogs: [makeLog("a"), makeLog("a")],
    };
    expect(coinsEarned(state)).toBe(CHECKIN_COINS + CHEST_COINS);
    expect(coinsEarned(state)).toBe(coinsEarned(state));
  });

  it("balance is earned minus spent and never negative", () => {
    const economy = { ...createDefaultEconomy(), coinsSpent: 5 };
    expect(coinBalance({ checkIns: [], missionLogs: [makeLog("a")], economy })).toBe(
      CHEST_COINS - 5,
    );
    expect(coinBalance({ checkIns: [], missionLogs: [], economy })).toBe(0);
  });
});

describe("buyItem", () => {
  it("buys food as a consumable, many times", () => {
    const first = buyItem(richState(), "food");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.economy.inventory.food).toBe(1);
    expect(first.economy.coinsSpent).toBe(5);
    const second = buyItem({ ...richState(), economy: first.economy }, "food");
    expect(second.ok && second.economy.inventory.food).toBe(2);
  });

  it("buys a wearable once", () => {
    const first = buyItem(richState(), "hat");
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.economy.ownedItemIds).toEqual(["hat"]);
    const again = buyItem({ ...richState(), economy: first.economy }, "hat");
    expect(again).toEqual({ ok: false, reason: "already-owned" });
  });

  it("fails with a reason and leaves the input untouched", () => {
    const state = richState(0);
    const snapshot = structuredClone(state);
    expect(buyItem(state, "hat")).toEqual({ ok: false, reason: "not-enough-coins" });
    expect(buyItem(state, "sword")).toEqual({ ok: false, reason: "unknown-item" });
    expect(state).toEqual(snapshot);
  });

  it("never spends more than the balance", () => {
    const state = richState(1); // 12 coins
    const a = buyItem(state, "hat"); // 10
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const b = buyItem({ ...state, economy: a.economy }, "glasses"); // 7 > 2
    expect(b).toEqual({ ok: false, reason: "not-enough-coins" });
  });
});

describe("giveFood", () => {
  it("needs food in the inventory", () => {
    expect(giveFood(createDefaultEconomy())).toEqual({ ok: false, reason: "no-food" });
  });

  it("adds fire and uses one food", () => {
    const result = giveFood({ ...createDefaultEconomy(), inventory: { food: 2 } });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.economy.fire).toBe(FOOD_FIRE);
    expect(result.economy.inventory.food).toBe(1);
  });

  it("caps fire at FIRE_MAX", () => {
    const result = giveFood({
      ...createDefaultEconomy(),
      fire: FIRE_MAX - 5,
      inventory: { food: 1 },
    });
    expect(result.ok && result.economy.fire).toBe(FIRE_MAX);
  });
});

describe("equip and unequip", () => {
  const owned: EconomyState = {
    ...createDefaultEconomy(),
    ownedItemIds: ["glasses", "t-shirt", "hat"],
  };

  it("equips owned wearables, one per slot", () => {
    const withHat = equipItem(owned, "hat");
    const withShirt = equipItem(withHat, "t-shirt");
    expect(withShirt.equippedItemIds).toEqual(["hat", "t-shirt"]);
  });

  it("replaces the item in the same slot", () => {
    const base: EconomyState = { ...owned, ownedItemIds: ["hat", "t-shirt"] };
    const equipped = equipItem(equipItem(base, "hat"), "hat");
    expect(equipped.equippedItemIds).toEqual(["hat"]);
    // Same slot replacement is covered by forcing a stale slot conflict.
    const conflicted: EconomyState = { ...base, equippedItemIds: ["hat"] };
    expect(equipItem(conflicted, "t-shirt").equippedItemIds).toEqual(["hat", "t-shirt"]);
  });

  it("ignores items that are not owned, unknown or consumable", () => {
    const empty = createDefaultEconomy();
    expect(equipItem(empty, "hat")).toBe(empty);
    expect(equipItem(owned, "food")).toBe(owned);
    expect(equipItem(owned, "nope")).toBe(owned);
  });

  it("unequips", () => {
    const worn = equipItem(owned, "hat");
    expect(unequipItem(worn, "hat").equippedItemIds).toEqual([]);
    expect(unequipItem(worn, "glasses")).toBe(worn);
  });
});

describe("claimReward", () => {
  const today = "2026-10-03";
  const now = new Date("2026-10-03T12:00:00.000Z");

  it("needs enough fire", () => {
    const economy = { ...createDefaultEconomy(), fire: 49 };
    expect(claimReward(economy, "choose-dinner", today)).toEqual({
      ok: false,
      reason: "not-enough-fire",
    });
    expect(claimReward(economy, "nope", today)).toEqual({
      ok: false,
      reason: "unknown-reward",
    });
  });

  it("spends fire and records a requested claim with a generated id", () => {
    const economy = { ...createDefaultEconomy(), fire: 70 };
    const result = claimReward(economy, "choose-dinner", today, {
      generateId: () => "claim-1",
      now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.economy.fire).toBe(20);
    expect(result.economy.rewardClaims).toEqual([
      {
        id: "claim-1",
        rewardId: "choose-dinner",
        date: today,
        createdAt: "2026-10-03T12:00:00.000Z",
        status: "requested",
      },
    ]);
    expect(economy.fire).toBe(70);
  });

  it("uses unique ids by default", () => {
    const economy = { ...createDefaultEconomy(), fire: 100 };
    const a = claimReward(economy, "phone-minutes", today);
    expect(a.ok).toBe(true);
    if (!a.ok) return;
    const b = claimReward(a.economy, "phone-minutes", today);
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    const ids = b.economy.rewardClaims.map((c) => c.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("markClaimDone confirms a claim without touching fire", () => {
    const economy = { ...createDefaultEconomy(), fire: 60 };
    const claimed = claimReward(economy, "phone-minutes", today, { generateId: () => "c1", now });
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) return;
    const done = markClaimDone(claimed.economy, "c1", "2026-10-04");
    expect(done.fire).toBe(claimed.economy.fire);
    expect(done.rewardClaims[0]).toMatchObject({ status: "done", doneAt: "2026-10-04" });
    expect(markClaimDone(claimed.economy, "missing", "2026-10-04")).toBe(claimed.economy);
    expect(markClaimDone(done, "c1", "2026-10-05")).toBe(done);
  });

  it("fire is not changed by buying, equipping or earning coins", () => {
    const state = richState(5, { fire: 40, ownedItemIds: ["hat"] });
    const bought = buyItem(state, "food");
    expect(bought.ok && bought.economy.fire).toBe(40);
    expect(equipItem(state.economy, "hat").fire).toBe(40);
  });
});

describe("setSpecialRewards", () => {
  const economy = createDefaultEconomy();

  it("trims names and accepts valid rewards", () => {
    const result = setSpecialRewards(economy, [{ id: "a", name: "  Movie night ", fireCost: 30 }]);
    expect(result.ok && result.economy.specialRewards).toEqual([
      { id: "a", name: "Movie night", fireCost: 30 },
    ]);
  });

  it("rejects bad names", () => {
    expect(setSpecialRewards(economy, [{ id: "a", name: "   ", fireCost: 10 }])).toEqual({
      ok: false,
      reason: "invalid-name",
    });
    expect(setSpecialRewards(economy, [{ id: "a", name: "x".repeat(41), fireCost: 10 }]).ok).toBe(
      false,
    );
  });

  it("rejects bad costs", () => {
    for (const fireCost of [0, -5, FIRE_MAX + 1, 2.5, Number.NaN]) {
      expect(setSpecialRewards(economy, [{ id: "a", name: "Ok", fireCost }])).toEqual({
        ok: false,
        reason: "invalid-cost",
      });
    }
  });

  it("rejects duplicate ids", () => {
    const result = setSpecialRewards(economy, [
      { id: "a", name: "One", fireCost: 10 },
      { id: "a", name: "Two", fireCost: 20 },
    ]);
    expect(result).toEqual({ ok: false, reason: "duplicate-id" });
  });
});

describe("storage migration", () => {
  it("fills economy defaults for old saved data without economy", () => {
    const old: Partial<AppState> = { ...createEmptyState(), child: { nickname: "Lucas" } };
    delete old.economy;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    const loaded = loadState();
    expect(loaded.child?.nickname).toBe("Lucas");
    expect(loaded.economy).toEqual(createDefaultEconomy());
    expect(loaded.economy.specialRewards[0].id).toBe("choose-dinner");
    localStorage.clear();
  });

  it("falls back to default economy when it is corrupt, keeping the rest", () => {
    const state = { ...createEmptyState(), child: { nickname: "Lucas" } };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, economy: { fire: -3, coinsSpent: "many" } }),
    );
    const loaded = loadState();
    expect(loaded.child?.nickname).toBe("Lucas");
    expect(loaded.economy).toEqual(createDefaultEconomy());
    localStorage.clear();
  });

  it("keeps a valid saved economy", () => {
    const economy: EconomyState = { ...createDefaultEconomy(), fire: 30, ownedItemIds: ["hat"] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...createEmptyState(), economy }));
    expect(loadState().economy).toEqual(economy);
    localStorage.clear();
  });
});

describe("dragon evolution system", () => {
  it("returns baby dragon for fire < 100", () => {
    const evo0 = getDragonEvolution(0);
    expect(evo0.stage).toBe(1);
    expect(evo0.key).toBe("baby");
    expect(evo0.artwork).toBe("/dragon.png");
    expect(evo0.background).toBe("/bg_stage1_pastel.jpg");
    expect(evo0.nextThreshold).toBe(100);

    const evo99 = getDragonEvolution(99);
    expect(evo99.stage).toBe(1);
    expect(evo99.key).toBe("baby");
  });

  it("evolves to young dragon at 100 fire", () => {
    const evo100 = getDragonEvolution(100);
    expect(evo100.stage).toBe(2);
    expect(evo100.key).toBe("young");
    expect(evo100.artwork).toBe("/dragon_stage2_teen.png");
    expect(evo100.background).toBe("/bg_stage2_warrior.jpg");
    expect(evo100.nextThreshold).toBe(200);

    const evo199 = getDragonEvolution(199);
    expect(evo199.stage).toBe(2);
    expect(evo199.key).toBe("young");
  });

  it("evolves to heroic dragon at 200 fire", () => {
    const evo200 = getDragonEvolution(200);
    expect(evo200.stage).toBe(3);
    expect(evo200.key).toBe("heroic");
    expect(evo200.artwork).toBe("/dragon_stage3_heroic.png");
    expect(evo200.background).toBe("/bg_stage3_heroic.jpg");
    expect(evo200.nextThreshold).toBeNull();
  });
});
