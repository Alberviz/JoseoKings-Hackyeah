import { describe, expect, it } from "vitest";
import { createPinRecord, hasPin, isValidPin, verifyPin } from "./hash";

describe("PIN hash", () => {
  it("accepts exactly four digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });

  it("verifies the right PIN and rejects a wrong one", async () => {
    const record = await createPinRecord("4821");
    expect(await verifyPin("4821", record)).toBe(true);
    expect(await verifyPin("4822", record)).toBe(false);
    expect(await verifyPin("0000", record)).toBe(false);
  });

  it("never stores the PIN itself and uses a different salt each time", async () => {
    const a = await createPinRecord("1111");
    const b = await createPinRecord("1111");
    expect(JSON.stringify(a)).not.toContain("1111");
    expect(a.pinSalt).not.toBe(b.pinSalt);
    expect(a.pinHash).not.toBe(b.pinHash);
  });

  it("refuses to create a record for an invalid PIN", async () => {
    await expect(createPinRecord("12")).rejects.toThrow();
  });

  it("treats a missing or empty record as no PIN set", async () => {
    expect(hasPin(null)).toBe(false);
    expect(hasPin({ pinHash: "", pinSalt: "" })).toBe(false);
    expect(await verifyPin("1234", null)).toBe(false);
    expect(await verifyPin("1234", { pinHash: "", pinSalt: "" })).toBe(false);
  });

  it("returns false, not an error, for a corrupt record", async () => {
    expect(await verifyPin("1234", { pinHash: "***", pinSalt: "***" })).toBe(false);
  });
});
