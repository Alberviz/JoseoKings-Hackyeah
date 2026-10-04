import { LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "./constants";
import { NO_ATTEMPTS, type PinAttempts } from "./lockout";

export const PIN_ATTEMPTS_STORAGE_KEY = "crohncare_pin_attempts";

/** Reads a stored attempts value, or null when it is missing or not valid. */
export function parseAttempts(raw: string | null, now: number): PinAttempts | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const { failures, lockedUntil } = value as Record<string, unknown>;
    if (
      typeof failures !== "number" ||
      !Number.isInteger(failures) ||
      failures < 0 ||
      failures >= MAX_FAILED_ATTEMPTS
    ) {
      return null;
    }
    if (lockedUntil === null) return { failures, lockedUntil: null };
    // A lock end further away than one lock period cannot be real (clock changed or edited value).
    if (
      typeof lockedUntil !== "number" ||
      !Number.isFinite(lockedUntil) ||
      lockedUntil > now + LOCKOUT_MS
    ) {
      return null;
    }
    return { failures, lockedUntil };
  } catch {
    return null;
  }
}

/** Loads the failed attempts and the lockout of this device. Never throws. */
export function loadAttempts(now: number = Date.now()): PinAttempts {
  if (typeof window === "undefined") return NO_ATTEMPTS;
  try {
    return parseAttempts(window.localStorage.getItem(PIN_ATTEMPTS_STORAGE_KEY), now) ?? NO_ATTEMPTS;
  } catch {
    return NO_ATTEMPTS;
  }
}

/** Saves the attempts so that reloading the page does not reset them. Never throws. */
export function saveAttempts(attempts: PinAttempts): void {
  if (typeof window === "undefined") return;
  try {
    if (attempts.failures === 0 && attempts.lockedUntil === null) {
      window.localStorage.removeItem(PIN_ATTEMPTS_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PIN_ATTEMPTS_STORAGE_KEY, JSON.stringify(attempts));
    }
  } catch {
    // Storage blocked or full: the attempts still count in memory.
  }
}
