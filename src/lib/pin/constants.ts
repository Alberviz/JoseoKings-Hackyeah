// The PIN separates child mode from parent mode on a shared device. It is not security:
// anyone who can read the device storage can bypass it. See docs/ARCHITECTURE.md section 6.

export const PIN_LENGTH = 4;
export const PBKDF2_ITERATIONS = 100_000;
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 30_000;
/** Parent mode locks itself after this long without any interaction. */
export const AUTO_LOCK_MS = 90_000;
