import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { sessionStore } from "@/hooks/useParentSession";
import { createPinRecord } from "@/lib/pin";

describe("sessionStore", () => {
  beforeEach(() => {
    sessionStore.resetForTesting();
  });

  afterEach(() => {
    sessionStore.resetForTesting();
  });

  it("returns initial snapshot and server snapshot", () => {
    const snap = sessionStore.getSnapshot();
    expect(snap.isUnlocked).toBe(false);
    expect(snap.isLockedOut).toBe(false);
    expect(snap.remainingLockSeconds).toBe(0);

    const serverSnap = sessionStore.getServerSnapshot();
    expect(serverSnap.isUnlocked).toBe(false);
    expect(serverSnap.isLockedOut).toBe(false);
  });

  it("handles unlock attempt with missing or unconfigured PIN", async () => {
    const result = await sessionStore.unlock("1234", null);
    expect(result.success).toBe(false);
    expect(result.error).toBe("No PIN has been created yet.");

    const emptyRecordResult = await sessionStore.unlock("1234", {
      pinHash: "",
      pinSalt: "",
      allowedMissionIds: [],
    });
    expect(emptyRecordResult.success).toBe(false);
    expect(emptyRecordResult.error).toBe("No PIN has been created yet.");
  });

  it("handles recordActivity only when unlocked", () => {
    // Locked: recordActivity does nothing
    sessionStore.recordActivity();
    expect(sessionStore.getSnapshot().isUnlocked).toBe(false);

    // Unlocked: recordActivity updates timer
    sessionStore.setUnlocked(true);
    expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
    sessionStore.recordActivity();
    expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
  });

  it("notifies listeners on state changes and cleans up on unsubscribe", async () => {
    let callCount = 0;
    const unsubscribe = sessionStore.subscribe(() => {
      callCount += 1;
    });

    sessionStore.setUnlocked(true);
    expect(callCount).toBe(1);

    sessionStore.lock();
    expect(callCount).toBe(2);

    unsubscribe();

    sessionStore.setUnlocked(true);
    // Should not increment after unsubscribe
    expect(callCount).toBe(2);
  });

  it("clears attempts when unlock succeeds", async () => {
    const pinRecord = await createPinRecord("1234");
    const settings = {
      ...pinRecord,
      allowedMissionIds: ["dragon-breathing"],
    };

    // 1 wrong attempt
    const failResult = await sessionStore.unlock("9999", settings);
    expect(failResult.success).toBe(false);
    expect(sessionStore.getSnapshot().attempts.failures).toBe(1);

    // Now correct attempt
    const successResult = await sessionStore.unlock("1234", settings);
    expect(successResult.success).toBe(true);
    expect(sessionStore.getSnapshot().isUnlocked).toBe(true);
    expect(sessionStore.getSnapshot().attempts.failures).toBe(0);
  });
});
