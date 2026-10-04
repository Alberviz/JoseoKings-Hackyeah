import { createDefaultEconomy } from "@/lib/economy";
import { syncCompanion } from "@/lib/rewards";
import type { AppState } from "@/types";
import type { WearableState } from "@/types/wearable";
import { appStateSchema } from "./schemas";
import { clearWearableState, wearableStateSchema } from "./wearableStore";

export const STORAGE_KEY = "crohncare_app_state";
export const BACKUP_STORAGE_KEY = "crohncare_app_state_backup";
/** The backup that was replaced by the latest one: the last 2 unreadable payloads are kept. */
export const PREVIOUS_BACKUP_STORAGE_KEY = "crohncare_app_state_backup_prev";

/**
 * Raw payload that could not be read on the last load. While it is set, the stored value is still
 * the original, and saving an untouched empty state must not replace it.
 */
let unreadableRaw: string | null = null;

/** Keeps the unreadable payload in the backup slot, moving the older backup to the previous slot. */
function backupUnreadable(raw: string): void {
  try {
    const current = window.localStorage.getItem(BACKUP_STORAGE_KEY);
    if (current === raw) return;
    if (current !== null) {
      window.localStorage.setItem(PREVIOUS_BACKUP_STORAGE_KEY, current);
    }
    window.localStorage.setItem(BACKUP_STORAGE_KEY, raw);
  } catch {
    // Ignore errors if storage is full or blocked
  }
}

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
      unreadableRaw = null;
      return result.data;
    }

    // Validation failed: keep raw in the backup and fall back to empty state
    unreadableRaw = raw;
    backupUnreadable(raw);
    return createEmptyState();
  } catch {
    // Malformed JSON: keep raw in the backup and fall back to empty state
    unreadableRaw = raw;
    backupUnreadable(raw);
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
    const serialized = JSON.stringify(validated);
    if (unreadableRaw !== null) {
      // The original unreadable value is still stored. Keep it until the user changes something.
      if (serialized === JSON.stringify(appStateSchema.parse(createEmptyState()))) {
        return true;
      }
      backupUnreadable(unreadableRaw);
      unreadableRaw = null;
    }
    window.localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes the main state key, the backup keys and the wearable state from localStorage.
 * Never throws.
 */
export function clearStorage(): void {
  unreadableRaw = null;
  clearWearableState();
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(BACKUP_STORAGE_KEY);
    window.localStorage.removeItem(PREVIOUS_BACKUP_STORAGE_KEY);
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
 * Reads the optional wearable state from a backup JSON string. Backups made before the rename
 * keep it under the old "watch" key, which is read as well.
 * Returns null when the backup has none or it is invalid.
 */
export function importBackupWearable(jsonString: string): WearableState | null {
  try {
    const parsed: unknown = JSON.parse(jsonString);
    if (typeof parsed !== "object" || parsed === null) return null;
    const block = parsed as { wearable?: unknown; watch?: unknown };
    const raw = "wearable" in block ? block.wearable : block.watch;
    if (raw === undefined) return null;
    const result = wearableStateSchema.safeParse(raw);
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
