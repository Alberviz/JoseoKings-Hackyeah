import { createDefaultEconomy } from "@/lib/economy";
import { syncCompanion } from "@/lib/rewards";
import type { AppState } from "@/types";
import type { WearableState } from "@/types/wearable";
import { appStateSchema } from "./schemas";
import { clearWearableState, wearableStateSchema } from "./wearableStore";

export const STORAGE_KEY = "crohncare_app_state";
export const BACKUP_STORAGE_KEY = "crohncare_app_state_backup";

export function createEmptyState(): AppState {
  return {
    schemaVersion: 1,
    isDemo: false,
    child: null,
    settings: null,
    companion: {
      name: "Hero",
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
      equippedItemIds: [],
      badgeIds: [],
    },
    economy: createDefaultEconomy(),
    checkIns: [],
    missionLogs: [],
    parentLogs: [],
    foodEntries: [],
    consultations: [],
  };
}

/**
 * Migrates older state formats if schemaVersion increases in the future.
 * Currently supports schemaVersion 1 pass-through.
 */
export function migrate(raw: unknown): unknown {
  if (typeof raw !== "object" || raw === null) {
    return raw;
  }
  // Future schemaVersion migrations go here
  return raw;
}

/**
 * Loads the application state from localStorage.
 * If storage is empty or invalid, falls back safely to createEmptyState()
 * and preserves any corrupt raw payload under BACKUP_STORAGE_KEY.
 * Never throws because storage is blocked, full or unavailable.
 */
export function loadState(): AppState {
  if (typeof window === "undefined" || !window.localStorage) {
    return createEmptyState();
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return createEmptyState();
  }

  if (!raw) {
    return createEmptyState();
  }

  try {
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    const result = appStateSchema.safeParse(migrated);

    if (result.success) {
      return result.data;
    }

    // Validation failed: save raw to backup and fall back to empty state
    try {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
    } catch {
      // Ignore errors if storage is full or blocked
    }
    return createEmptyState();
  } catch {
    // Malformed JSON: save raw to backup and fall back to empty state
    try {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
    } catch {
      // Ignore errors if storage is full or blocked
    }
    return createEmptyState();
  }
}

/**
 * Saves the application state to localStorage after schema validation.
 * Returns true when saved, false if validation or storage failed.
 * Never throws because storage is full, blocked or unavailable.
 */
export function saveState(state: AppState): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }

  try {
    const validated = appStateSchema.parse(state);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes the main state key, the backup key and the wearable state from localStorage.
 * Never throws.
 */
export function clearStorage(): void {
  clearWearableState();
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch {
    // Ignore errors if localStorage is blocked
  }
}

/**
 * Exports the state as an indented JSON string for backup download.
 * Pass the wearable state to include it under the optional "wearable" key.
 */
export function exportBackup(state: AppState, wearable?: WearableState): string {
  const validated = appStateSchema.parse(state);
  const payload = wearable
    ? { ...validated, wearable: wearableStateSchema.parse(wearable) }
    : validated;
  return JSON.stringify(payload, null, 2);
}

/**
 * Reads the optional wearable state from a backup JSON string.
 * Returns null when the backup has none (older backups) or it is invalid.
 */
export function importBackupWearable(jsonString: string): WearableState | null {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null || !("wearable" in parsed)) return null;
    const result = wearableStateSchema.safeParse((parsed as { wearable: unknown }).wearable);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Imports and validates state from a backup JSON string, recomputing
 * companion rewards from the imported logs.
 * Throws an Error if the JSON is malformed or violates the AppState schema.
 */
export function importBackup(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  const migrated = migrate(parsed);
  const validated = appStateSchema.parse(migrated);
  return {
    ...validated,
    companion: syncCompanion({
      checkIns: validated.checkIns,
      missionLogs: validated.missionLogs,
      companion: validated.companion,
    }),
  };
}
