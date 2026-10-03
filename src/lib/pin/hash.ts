import type { ParentSettings } from "@/types";
import { PBKDF2_ITERATIONS, PIN_LENGTH } from "./constants";

type PinRecord = Pick<ParentSettings, "pinHash" | "pinSalt">;

const PIN_PATTERN = new RegExp(`^\\d{${PIN_LENGTH}}$`);

export function isValidPin(pin: string): boolean {
  return PIN_PATTERN.test(pin);
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function derive(pin: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

/** Compares two byte arrays without stopping at the first difference. */
function sameBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** True when the family has not created a PIN yet (an empty record, as in the demo data). */
export function hasPin(record: PinRecord | null | undefined): boolean {
  return Boolean(record && record.pinHash && record.pinSalt);
}

/** Creates the hash and a fresh random salt for a new PIN. Throws when the PIN is not valid. */
export async function createPinRecord(pin: string): Promise<PinRecord> {
  if (!isValidPin(pin)) throw new Error(`The PIN must be ${PIN_LENGTH} digits.`);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt);
  return { pinHash: toBase64(hash), pinSalt: toBase64(salt) };
}

/** Checks a PIN against a stored record. Returns false for a wrong PIN, an invalid PIN or a missing record. */
export async function verifyPin(
  pin: string,
  record: PinRecord | null | undefined,
): Promise<boolean> {
  if (!isValidPin(pin) || !hasPin(record) || !record) return false;
  try {
    const expected = fromBase64(record.pinHash);
    const actual = await derive(pin, fromBase64(record.pinSalt));
    return sameBytes(expected, actual);
  } catch {
    return false;
  }
}
