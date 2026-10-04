import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WatchState } from "@/types/watch";
import {
  createEmptyState,
  clearStorage,
  exportBackup,
  importBackup,
  importBackupWatch,
} from "./storage";
import { WATCH_STORAGE_KEY, saveWatchState } from "./watchStore";

const watch: WatchState = {
  days: [
    {
      date: "2026-10-01",
      steps: 4000,
      restingHr: 70,
      sleepMinutes: 480,
      nightComplete: true,
      dayComplete: true,
    },
  ],
  lastSyncAt: "2026-10-02T08:00:00.000Z",
  isDemo: true,
};

describe("backup with watch state", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("round-trips the watch state", () => {
    const json = exportBackup(createEmptyState(), watch);
    expect(importBackupWatch(json)).toEqual(watch);
    expect(() => importBackup(json)).not.toThrow();
  });

  it("old backups without watch import fine", () => {
    const json = exportBackup(createEmptyState());
    expect(importBackupWatch(json)).toBeNull();
    expect(() => importBackup(json)).not.toThrow();
  });

  it("ignores an invalid watch block and bad JSON", () => {
    const json = JSON.stringify({ ...createEmptyState(), watch: { days: "nope" } });
    expect(importBackupWatch(json)).toBeNull();
    expect(importBackupWatch("{broken")).toBeNull();
  });

  it("clearStorage also clears the watch state", () => {
    saveWatchState(watch);
    expect(localStorage.getItem(WATCH_STORAGE_KEY)).not.toBeNull();
    clearStorage();
    expect(localStorage.getItem(WATCH_STORAGE_KEY)).toBeNull();
  });
});
