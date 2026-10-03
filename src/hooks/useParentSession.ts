"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  AUTO_LOCK_MS,
  isLocked,
  NO_ATTEMPTS,
  registerFailure,
  registerSuccess,
  remainingLockMs,
  verifyPin,
  type PinAttempts,
} from "@/lib/pin";
import type { ParentSettings } from "@/types";

type SessionSnapshot = {
  isUnlocked: boolean;
  attempts: PinAttempts;
  remainingLockSeconds: number;
  isLockedOut: boolean;
  isCryptoAvailable: boolean;
};

const INITIAL_SERVER_SNAPSHOT: SessionSnapshot = {
  isUnlocked: false,
  attempts: NO_ATTEMPTS,
  remainingLockSeconds: 0,
  isLockedOut: false,
  isCryptoAvailable: false,
};

class ParentSessionStore {
  private isUnlocked: boolean = false;
  private attempts: PinAttempts = NO_ATTEMPTS;
  private autoLockTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private lockoutIntervalId: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<() => void>();
  private snapshot: SessionSnapshot;

  constructor() {
    this.snapshot = this.computeSnapshot();
  }

  private isCryptoSubtleAvailable(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof window.crypto !== "undefined" &&
      Boolean(window.crypto.subtle)
    );
  }

  private computeSnapshot(): SessionSnapshot {
    const now = Date.now();
    const lockedOut = isLocked(this.attempts, now);
    const remainingMs = remainingLockMs(this.attempts, now);
    const remainingLockSeconds = Math.ceil(remainingMs / 1000);

    return {
      isUnlocked: this.isUnlocked,
      attempts: this.attempts,
      remainingLockSeconds,
      isLockedOut: lockedOut,
      isCryptoAvailable: this.isCryptoSubtleAvailable(),
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private updateSnapshot() {
    this.snapshot = this.computeSnapshot();
    this.notify();
  }

  private checkLockoutStatus() {
    const now = Date.now();
    if (isLocked(this.attempts, now)) {
      if (!this.lockoutIntervalId) {
        this.lockoutIntervalId = setInterval(() => {
          const currentNow = Date.now();
          if (!isLocked(this.attempts, currentNow)) {
            if (this.lockoutIntervalId) {
              clearInterval(this.lockoutIntervalId);
              this.lockoutIntervalId = null;
            }
          }
          this.updateSnapshot();
        }, 1000);
      }
    } else if (this.lockoutIntervalId) {
      clearInterval(this.lockoutIntervalId);
      this.lockoutIntervalId = null;
    }
  }

  private startAutoLockTimer() {
    this.clearAutoLockTimer();
    this.autoLockTimeoutId = setTimeout(() => {
      this.lock();
    }, AUTO_LOCK_MS);
  }

  private clearAutoLockTimer() {
    if (this.autoLockTimeoutId) {
      clearTimeout(this.autoLockTimeoutId);
      this.autoLockTimeoutId = null;
    }
  }

  getSnapshot = (): SessionSnapshot => {
    return this.snapshot;
  };

  getServerSnapshot = (): SessionSnapshot => {
    return INITIAL_SERVER_SNAPSHOT;
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  lock = () => {
    this.isUnlocked = false;
    this.clearAutoLockTimer();
    this.updateSnapshot();
  };

  setUnlocked = (unlocked: boolean) => {
    this.isUnlocked = unlocked;
    if (unlocked) {
      this.attempts = registerSuccess();
      if (this.lockoutIntervalId) {
        clearInterval(this.lockoutIntervalId);
        this.lockoutIntervalId = null;
      }
      this.startAutoLockTimer();
    } else {
      this.clearAutoLockTimer();
    }
    this.updateSnapshot();
  };

  recordActivity = () => {
    if (!this.isUnlocked) return;
    this.startAutoLockTimer();
  };

  unlock = async (
    pin: string,
    settings: ParentSettings | null | undefined,
  ): Promise<{ success: boolean; error?: string }> => {
    const now = Date.now();
    if (isLocked(this.attempts, now)) {
      const seconds = Math.ceil(remainingLockMs(this.attempts, now) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Locked for ${seconds} seconds.`,
      };
    }

    if (!this.isCryptoSubtleAvailable()) {
      return {
        success: false,
        error: "PIN verification requires a secure connection (HTTPS or localhost).",
      };
    }

    if (!settings || !settings.pinHash || !settings.pinSalt) {
      return {
        success: false,
        error: "No PIN has been created yet.",
      };
    }

    const isValid = await verifyPin(pin, settings);
    const afterNow = Date.now();

    if (isValid) {
      this.setUnlocked(true);
      return { success: true };
    }

    this.attempts = registerFailure(this.attempts, afterNow);
    this.checkLockoutStatus();
    this.updateSnapshot();

    if (isLocked(this.attempts, afterNow)) {
      const seconds = Math.ceil(remainingLockMs(this.attempts, afterNow) / 1000);
      return {
        success: false,
        error: `Too many failed attempts. Locked for ${seconds} seconds.`,
      };
    }

    return {
      success: false,
      error: "Incorrect PIN. Please try again.",
    };
  };

  resetForTesting = () => {
    this.isUnlocked = false;
    this.attempts = NO_ATTEMPTS;
    this.clearAutoLockTimer();
    if (this.lockoutIntervalId) {
      clearInterval(this.lockoutIntervalId);
      this.lockoutIntervalId = null;
    }
    this.updateSnapshot();
  };
}

export const sessionStore = new ParentSessionStore();

export function useParentSession() {
  const snapshot = useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );

  useEffect(() => {
    const onActivity = () => {
      sessionStore.recordActivity();
    };

    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("touchstart", onActivity);

    return () => {
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("touchstart", onActivity);
    };
  }, []);

  return {
    isUnlocked: snapshot.isUnlocked,
    attempts: snapshot.attempts,
    remainingLockSeconds: snapshot.remainingLockSeconds,
    isLockedOut: snapshot.isLockedOut,
    isCryptoAvailable: snapshot.isCryptoAvailable,
    unlock: sessionStore.unlock,
    lock: sessionStore.lock,
    setUnlocked: sessionStore.setUnlocked,
    recordActivity: sessionStore.recordActivity,
    resetForTesting: sessionStore.resetForTesting,
  };
}
