import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  loadAttempts,
  parseAttempts,
  PIN_ATTEMPTS_STORAGE_KEY,
  saveAttempts,
} from "./attemptsStorage";
import { LOCKOUT_MS } from "./constants";
import { NO_ATTEMPTS } from "./lockout";

const NOW = 1_000_000;

describe("attemptsStorage", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it("round-trips failures and lockout", () => {
    saveAttempts({ failures: 2, lockedUntil: null });
    expect(loadAttempts(NOW)).toEqual({ failures: 2, lockedUntil: null });
    saveAttempts({ failures: 0, lockedUntil: NOW + 1000 });
    expect(loadAttempts(NOW)).toEqual({ failures: 0, lockedUntil: NOW + 1000 });
  });

  it("removes the key when there is nothing to remember", () => {
    saveAttempts({ failures: 1, lockedUntil: null });
    saveAttempts(NO_ATTEMPTS);
    expect(localStorage.getItem(PIN_ATTEMPTS_STORAGE_KEY)).toBeNull();
  });

  it("falls back to no attempts for missing or corrupt values", () => {
    expect(loadAttempts(NOW)).toEqual(NO_ATTEMPTS);
    localStorage.setItem(PIN_ATTEMPTS_STORAGE_KEY, "not json");
    expect(loadAttempts(NOW)).toEqual(NO_ATTEMPTS);
    expect(parseAttempts('{"failures":"3","lockedUntil":null}', NOW)).toBeNull();
    expect(parseAttempts('{"failures":-1,"lockedUntil":null}', NOW)).toBeNull();
    expect(parseAttempts('{"failures":99,"lockedUntil":null}', NOW)).toBeNull();
    expect(parseAttempts('{"failures":0,"lockedUntil":"soon"}', NOW)).toBeNull();
    expect(parseAttempts("null", NOW)).toBeNull();
  });

  it("rejects a lock end that is further away than one lock period", () => {
    const far = NOW + LOCKOUT_MS + 1;
    expect(parseAttempts(JSON.stringify({ failures: 0, lockedUntil: far }), NOW)).toBeNull();
  });
});
