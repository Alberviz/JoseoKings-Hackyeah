import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { WearableState } from "@/types/wearable";
import {
  createEmptyState,
  clearStorage,
  exportBackup,
  importBackup,
  importBackupWearable,
} from "./storage";
import { WEARABLE_STORAGE_KEY, saveWearableState } from "./wearableStore";

const wearable: WearableState = {
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

describe("backup with wearable state", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("round-trips the wearable state", () => {
    const json = exportBackup(createEmptyState(), wearable);
    expect(importBackupWearable(json)).toEqual(wearable);
    expect(() => importBackup(json)).not.toThrow();
  });

  it("reads an old backup that keeps the data under the watch field", () => {
    const old = { ...wearable, devices: [{ id: "a", kind: "watch", label: "A", metrics: [] }] };
    const json = JSON.stringify({ ...createEmptyState(), watch: old });
    const result = importBackupWearable(json);
    expect(result?.days).toEqual(wearable.days);
    expect(result?.devices?.[0].kind).toBe("wearable");
    expect(() => importBackup(json)).not.toThrow();
  });

  it("prefers the wearable field when a backup has both", () => {
    const json = JSON.stringify({
      ...createEmptyState(),
      wearable,
      watch: { ...wearable, days: [] },
    });
    expect(importBackupWearable(json)?.days).toEqual(wearable.days);
  });

  it("old backups without wearable import fine", () => {
    const json = exportBackup(createEmptyState());
    expect(importBackupWearable(json)).toBeNull();
    expect(() => importBackup(json)).not.toThrow();
  });

  it("ignores an invalid wearable block and bad JSON", () => {
    const json = JSON.stringify({ ...createEmptyState(), wearable: { days: "nope" } });
    expect(importBackupWearable(json)).toBeNull();
    expect(importBackupWearable("{broken")).toBeNull();
  });

  it("clearStorage also clears the wearable state", () => {
    saveWearableState(wearable);
    expect(localStorage.getItem(WEARABLE_STORAGE_KEY)).not.toBeNull();
    clearStorage();
    expect(localStorage.getItem(WEARABLE_STORAGE_KEY)).toBeNull();
  });
});
