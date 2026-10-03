import type { AppState } from "@/types";
import { appStateSchema } from "./schemas";

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
 */
export function loadState(): AppState {
  if (typeof window === "undefined" || !window.localStorage) {
    return createEmptyState();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
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
    window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
    return createEmptyState();
  } catch {
    // Malformed JSON: save raw to backup and fall back to empty state
    window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
    return createEmptyState();
  }
}

/**
 * Saves the application state to localStorage after schema validation.
 */
export function saveState(state: AppState): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  const validated = appStateSchema.parse(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

/**
 * Exports the state as an indented JSON string for backup download.
 */
export function exportBackup(state: AppState): string {
  const validated = appStateSchema.parse(state);
  return JSON.stringify(validated, null, 2);
}

/**
 * Imports and validates state from a backup JSON string.
 * Throws an Error if the JSON is malformed or violates the AppState schema.
 */
export function importBackup(jsonString: string): AppState {
  const parsed = JSON.parse(jsonString);
  const migrated = migrate(parsed);
  return appStateSchema.parse(migrated);
}
