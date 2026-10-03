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
      // Ignore quota/private browsing write errors
    }
    return createEmptyState();
  } catch {
    // Malformed JSON: save raw to backup and fall back to empty state
    try {
      window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
    } catch {
      // Ignore quota/private browsing write errors
    }
    return createEmptyState();
  }
}

/**
 * Saves the application state to localStorage after schema validation.
 * Wrapped in try/catch to protect against storage quota and private mode errors.
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
 * Removes both the main state and any backup copy from localStorage.
 */
export function clearStorage(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
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
