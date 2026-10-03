import { AUTO_LOCK_MS, LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "./constants";

// Plain data and pure functions. The caller keeps the state in memory and passes the current time (ms).

export type PinAttempts = {
  failures: number;
  /** Time when the lock ends, or null when not locked. */
  lockedUntil: number | null;
};

export const NO_ATTEMPTS: PinAttempts = { failures: 0, lockedUntil: null };

export function isLocked(attempts: PinAttempts, now: number): boolean {
  return attempts.lockedUntil !== null && now < attempts.lockedUntil;
}

export function remainingLockMs(attempts: PinAttempts, now: number): number {
  return attempts.lockedUntil === null ? 0 : Math.max(0, attempts.lockedUntil - now);
}

/** Records a wrong PIN. After MAX_FAILED_ATTEMPTS in a row the PIN is locked for LOCKOUT_MS. */
export function registerFailure(attempts: PinAttempts, now: number): PinAttempts {
  const failures = attempts.failures + 1;
  return failures >= MAX_FAILED_ATTEMPTS
    ? { failures: 0, lockedUntil: now + LOCKOUT_MS }
    : { failures, lockedUntil: null };
}

/** A correct PIN clears everything. */
export function registerSuccess(): PinAttempts {
  return NO_ATTEMPTS;
}

/** Parent mode locks itself after AUTO_LOCK_MS without interaction. */
export function shouldAutoLock(lastActivityAt: number, now: number): boolean {
  return now - lastActivityAt >= AUTO_LOCK_MS;
}
