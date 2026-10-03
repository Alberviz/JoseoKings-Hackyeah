import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  BACKUP_STORAGE_KEY,
  STORAGE_KEY,
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
      allowedMissionIds: ["m1", "m2"],
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

    saveState(initial);

    const rawInStorage = localStorage.getItem(STORAGE_KEY);
    expect(rawInStorage).not.toBeNull();

    const loaded = loadState();
    expect(loaded).toEqual(initial);
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

  it("migrate passes through valid schemaVersion 1 data", () => {
    const state = createEmptyState();
    const migrated = migrate(state);
    expect(migrated).toEqual(state);
  });

  it("exportBackup and importBackup round trip correctly", () => {
    const state = createEmptyState();
    state.child = { nickname: "Leo" };
    state.companion.teamStars = 5;

    const backupJson = exportBackup(state);
    expect(typeof backupJson).toBe("string");

    const restored = importBackup(backupJson);
    expect(restored).toEqual(state);
  });

  it("importBackup throws when given invalid or corrupt JSON string", () => {
    expect(() => importBackup("invalid-json")).toThrow();
    expect(() => importBackup(JSON.stringify({ schemaVersion: 999 }))).toThrow();
  });
});
