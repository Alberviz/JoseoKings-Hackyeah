import { describe, expect, it } from "vitest";
import { AUTO_LOCK_MS, LOCKOUT_MS, MAX_FAILED_ATTEMPTS } from "./constants";
import {
  NO_ATTEMPTS,
  isLocked,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  shouldAutoLock,
  type PinAttempts,
} from "./lockout";

const NOW = 1_000_000;

function failTimes(times: number, now = NOW): PinAttempts {
  let attempts = NO_ATTEMPTS;
  for (let i = 0; i < times; i += 1) attempts = registerFailure(attempts, now);
  return attempts;
}

describe("PIN lockout", () => {
  it("does not lock before the limit", () => {
    const attempts = failTimes(MAX_FAILED_ATTEMPTS - 1);
    expect(isLocked(attempts, NOW)).toBe(false);
    expect(attempts.failures).toBe(MAX_FAILED_ATTEMPTS - 1);
  });

  it("locks after five wrong tries and unlocks after thirty seconds", () => {
    const attempts = failTimes(MAX_FAILED_ATTEMPTS);
    expect(isLocked(attempts, NOW)).toBe(true);
    expect(remainingLockMs(attempts, NOW)).toBe(LOCKOUT_MS);
    expect(isLocked(attempts, NOW + LOCKOUT_MS - 1)).toBe(true);
    expect(isLocked(attempts, NOW + LOCKOUT_MS)).toBe(false);
    expect(remainingLockMs(attempts, NOW + LOCKOUT_MS + 5)).toBe(0);
  });

  it("starts counting from zero after a lock", () => {
    expect(failTimes(MAX_FAILED_ATTEMPTS).failures).toBe(0);
  });

  it("a correct PIN clears the failures", () => {
    expect(failTimes(3).failures).toBe(3);
    expect(registerSuccess()).toEqual(NO_ATTEMPTS);
  });

  it("auto-locks after 90 seconds without interaction", () => {
    expect(shouldAutoLock(NOW, NOW + AUTO_LOCK_MS - 1)).toBe(false);
    expect(shouldAutoLock(NOW, NOW + AUTO_LOCK_MS)).toBe(true);
  });
});
