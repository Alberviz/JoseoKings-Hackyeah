import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syncCompanion } from "@/lib/rewards";
import type { AppState, CheckIn, Consultation, FoodEntry, MissionLog } from "@/types";
import {
  appStateSchema,
  checkInSchema,
  companionStateSchema,
  consultationSchema,
  foodEntrySchema,
  missionLogSchema,
  parentLogSchema,
  shopItemIdSchema,
  economyStateSchema,
} from "./schemas";
import {
  BACKUP_STORAGE_KEY,
  STORAGE_KEY,
  clearStorage,
  createEmptyState,
  exportBackup,
  importBackup,
  loadState,
  migrate,
  saveState,
} from "./storage";

describe("storage layer", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("createEmptyState returns valid schemaVersion 1 empty state", () => {
    const state = createEmptyState();
    expect(state.schemaVersion).toBe(1);
    expect(state.isDemo).toBe(false);
    expect(state.child).toBeNull();
    expect(state.settings).toBeNull();
    expect(state.checkIns).toEqual([]);
    expect(state.missionLogs).toEqual([]);
    expect(state.parentLogs).toEqual([]);
    expect(state.foodEntries).toEqual([]);
    expect(state.consultations).toEqual([]);
    expect(state.companion.points).toBe(0);
    expect(state.companion.teamStars).toBe(0);
  });

  it("loadState returns empty state when localStorage is empty", () => {
    const state = loadState();
    expect(state).toEqual(createEmptyState());
  });

  it("saveState and loadState round trip preserves data", () => {
    const initial = createEmptyState();
    initial.child = { nickname: "Lucas" };
    initial.settings = {
      pinHash: "hash123",
      pinSalt: "salt123",
    };
    initial.companion.points = 120;
    initial.companion.name = "Golem";
    initial.checkIns.push({
      id: "ci-1",
      date: "2026-10-03",
      answers: { mood: 3 },
      notToday: false,
      createdAt: "2026-10-03T10:00:00.000Z",
    });

    const saved = saveState(initial);
    expect(saved).toBe(true);

    const rawInStorage = localStorage.getItem(STORAGE_KEY);
    expect(rawInStorage).not.toBeNull();

    const loaded = loadState();
    expect(loaded).toEqual(initial);
  });

  it("still loads an old saved state that has deviceRole and allowedMissionIds", () => {
    const old = createEmptyState();
    old.child = { nickname: "Lucas" };
    old.settings = {
      pinHash: "hash123",
      pinSalt: "salt123",
      // Fields removed from the app; old devices may still have them saved.
      allowedMissionIds: ["m1", "m2"],
      deviceRole: "child",
    } as AppState["settings"];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));

    const loaded = loadState();
    expect(loaded.child).toEqual({ nickname: "Lucas" });
    expect(loaded.settings).toEqual({ pinHash: "hash123", pinSalt: "salt123" });
  });

  it("saving does not throw when localStorage.setItem throws", () => {
    const state = createEmptyState();
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError: storage is full");
    });

    expect(() => saveState(state)).not.toThrow();
    const result = saveState(state);
    expect(result).toBe(false);

    setItemSpy.mockRestore();
  });

  it("loadState does not throw even when localStorage.getItem throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: storage disabled");
    });

    expect(() => loadState()).not.toThrow();
    const result = loadState();
    expect(result).toEqual(createEmptyState());

    getItemSpy.mockRestore();
  });

  it("clearStorage removes both main storage key and backup storage key", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createEmptyState()));
    localStorage.setItem(BACKUP_STORAGE_KEY, "raw-backup-payload");

    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).not.toBeNull();

    clearStorage();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toBeNull();
  });

  it("falls back to empty state and saves backup when JSON is malformed garbage", () => {
    const garbage = "{not-valid-json";
    localStorage.setItem(STORAGE_KEY, garbage);

    const loaded = loadState();
    expect(loaded).toEqual(createEmptyState());
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toBe(garbage);
  });

  it("falls back to empty state and saves backup when state does not match schema", () => {
    const invalidState = {
      schemaVersion: 1,
      isDemo: "not-a-boolean",
      child: { missing_nickname: true },
    };
    const invalidJson = JSON.stringify(invalidState);
    localStorage.setItem(STORAGE_KEY, invalidJson);

    const loaded = loadState();
    expect(loaded).toEqual(createEmptyState());
    expect(localStorage.getItem(BACKUP_STORAGE_KEY)).toBe(invalidJson);
  });

  it("an invalid date is rejected by the schema", () => {
    const validCheckIn: CheckIn = {
      id: "ci-1",
      date: "2026-10-03",
      answers: {},
      notToday: false,
      createdAt: "2026-10-03T10:00:00.000Z",
    };
    expect(checkInSchema.safeParse(validCheckIn).success).toBe(true);
    expect(checkInSchema.safeParse({ ...validCheckIn, date: "not-a-date" }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validCheckIn, date: "2026-02-30" }).success).toBe(false);
    expect(checkInSchema.safeParse({ ...validCheckIn, date: "2026-13-45" }).success).toBe(false);

    const validMission: MissionLog = {
      id: "ml-1",
      date: "2026-10-03",
      missionId: "bed-stretch",
      status: "completed",
      company: "alone",
      confirmedBy: "child",
      createdAt: "2026-10-03T10:00:00.000Z",
    };
    expect(missionLogSchema.safeParse(validMission).success).toBe(true);
    expect(missionLogSchema.safeParse({ ...validMission, date: "2026/10/03" }).success).toBe(false);

    expect(parentLogSchema.safeParse({ date: "2026-10-03" }).success).toBe(true);
    expect(parentLogSchema.safeParse({ date: "invalid-date" }).success).toBe(false);

    const validFood: FoodEntry = {
      id: "fe-1",
      date: "2026-10-03",
      text: "Rice",
      createdAt: "2026-10-03T10:00:00.000Z",
    };
    expect(foodEntrySchema.safeParse(validFood).success).toBe(true);
    expect(foodEntrySchema.safeParse({ ...validFood, date: "2026-00-10" }).success).toBe(false);

    const validConsultation: Consultation = {
      id: "c-1",
      date: "2026-10-03",
    };
    expect(consultationSchema.safeParse(validConsultation).success).toBe(true);
    expect(consultationSchema.safeParse({ ...validConsultation, date: "2026-10-32" }).success).toBe(
      false,
    );
  });

  it("rejects invalid points, teamStars, and sleepHours in schemas", () => {
    const validCompanion = {
      name: "Hero",
      points: 20,
      teamStars: 2,
      ownedItemIds: [],
      equippedItemIds: [],
      badgeIds: [],
    };
    expect(companionStateSchema.safeParse(validCompanion).success).toBe(true);
    expect(companionStateSchema.safeParse({ ...validCompanion, points: -1 }).success).toBe(false);
    expect(companionStateSchema.safeParse({ ...validCompanion, points: 2.5 }).success).toBe(false);
    expect(companionStateSchema.safeParse({ ...validCompanion, teamStars: -1 }).success).toBe(
      false,
    );
    expect(companionStateSchema.safeParse({ ...validCompanion, teamStars: 0.5 }).success).toBe(
      false,
    );

    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: 8 }).success).toBe(true);
    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: 0 }).success).toBe(true);
    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: 24 }).success).toBe(true);
    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: 7.5 }).success).toBe(true);
    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: -1 }).success).toBe(false);
    expect(parentLogSchema.safeParse({ date: "2026-10-03", sleepHours: 25 }).success).toBe(false);
  });

  it("migrate passes through valid schemaVersion 1 data", () => {
    const state = createEmptyState();
    const migrated = migrate(state);
    expect(migrated).toEqual(state);
  });

  it("exportBackup and importBackup round trip correctly and derive companion rewards", () => {
    const state = createEmptyState();
    state.child = { nickname: "Leo" };
    state.companion = syncCompanion({
      checkIns: state.checkIns,
      missionLogs: state.missionLogs,
      companion: {
        ...state.companion,
        teamStars: 5,
      },
    });

    const backupJson = exportBackup(state);
    expect(typeof backupJson).toBe("string");

    const restored = importBackup(backupJson);
    expect(restored).toEqual(state);
  });

  it("importBackup recomputes companion rewards from imported logs", () => {
    const state: AppState = {
      ...createEmptyState(),
      checkIns: [
        {
          id: "ci-1",
          date: "2026-10-03",
          answers: {},
          notToday: false,
          createdAt: "2026-10-03T10:00:00.000Z",
        },
      ],
      companion: {
        name: "Hero",
        points: 0,
        teamStars: 0,
        ownedItemIds: [],
        equippedItemIds: [],
        badgeIds: [],
      },
    };

    const backupJson = JSON.stringify(appStateSchema.parse(state));
    const restored = importBackup(backupJson);

    expect(restored.companion.points).toBe(10);
  });

  it("importBackup throws when given invalid or corrupt JSON string", () => {
    expect(() => importBackup("invalid-json")).toThrow();
    expect(() => importBackup(JSON.stringify({ schemaVersion: 999 }))).toThrow();
  });

  it("missionLogSchema validates logs with and without moodBefore/moodAfter", () => {
    const withoutMoods: MissionLog = {
      id: "m-1",
      date: "2026-10-03",
      missionId: "animal-statue",
      status: "completed",
      company: "alone",
      confirmedBy: "child",
      createdAt: "2026-10-03T10:00:00.000Z",
    };
    expect(() => missionLogSchema.parse(withoutMoods)).not.toThrow();

    const withMoods: MissionLog = {
      ...withoutMoods,
      moodBefore: "strong",
      moodAfter: "great",
    };
    const parsed = missionLogSchema.parse(withMoods);
    expect(parsed.moodBefore).toBe("strong");
    expect(parsed.moodAfter).toBe("great");
  });

  it("shopItemIdSchema validates legacy items and new expanded items (additive only)", () => {
    // Legacy items
    expect(() => shopItemIdSchema.parse("food")).not.toThrow();
    expect(() => shopItemIdSchema.parse("glasses")).not.toThrow();
    expect(() => shopItemIdSchema.parse("t-shirt")).not.toThrow();
    expect(() => shopItemIdSchema.parse("hat")).not.toThrow();

    // New expanded items
    expect(() => shopItemIdSchema.parse("cap")).not.toThrow();
    expect(() => shopItemIdSchema.parse("sunglasses")).not.toThrow();
    expect(() => shopItemIdSchema.parse("sport-shirt")).not.toThrow();

    // Economy state with legacy items validates
    const legacyEconomy = {
      fire: 40,
      coinsSpent: 20,
      inventory: { food: 2 },
      ownedItemIds: ["hat", "glasses"],
      equippedItemIds: ["hat"],
      specialRewards: [],
      rewardClaims: [],
    };
    expect(() => economyStateSchema.parse(legacyEconomy)).not.toThrow();

    // Economy state with expanded items validates
    const expandedEconomy = {
      ...legacyEconomy,
      ownedItemIds: ["cap", "sunglasses", "sport-shirt"],
      equippedItemIds: ["cap", "sunglasses", "sport-shirt"],
    };
    expect(() => economyStateSchema.parse(expandedEconomy)).not.toThrow();
  });
});
