// AES-GCM with the family key. The key is random (never a PIN, so nothing to brute-force) and travels
// once, inside the pairing code, from the parent's screen to the child's camera. Needs a secure context
// (HTTPS or localhost): see ERRORS.md E5.

import { concatBytes, fromBase64Url, toBase64Url } from "./bytes";
import { LinkError } from "./types";

export const FAMILY_KEY_BYTES = 16;
const IV_BYTES = 12;

export function isLinkCryptoAvailable(): boolean {
  return typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined";
}

/** A fresh random family key as base64url. Called once, by the parent app, at setup. */
export function generateFamilyKey(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(FAMILY_KEY_BYTES)));
}

/** A random, URL-safe family id. Not secret: it only tells two codes apart. */
export function generateFamilyId(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(6)));
}

async function importKey(keyB64: string): Promise<CryptoKey> {
  const raw = fromBase64Url(keyB64);
  if (raw.length !== FAMILY_KEY_BYTES) {
    throw new LinkError("corrupt", "The family key has the wrong length.");
  }
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Returns iv (12 bytes) followed by the ciphertext with its tag. */
export async function encryptBytes(
  keyB64: string,
  plain: Uint8Array,
  additionalData: string,
): Promise<Uint8Array> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(additionalData) },
    key,
    plain as BufferSource,
  );
  return concatBytes(iv, new Uint8Array(cipher));
}

/** Inverse of `encryptBytes`. Throws LinkError("wrong-family") when the key or the data do not match. */
export async function decryptBytes(
  keyB64: string,
  data: Uint8Array,
  additionalData: string,
): Promise<Uint8Array> {
  if (data.length <= IV_BYTES) throw new LinkError("corrupt", "The code is too short.");
  const key = await importKey(keyB64);
  const iv = data.slice(0, IV_BYTES);
  const cipher = data.slice(IV_BYTES);
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(additionalData) },
      key,
      cipher as BufferSource,
    );
    return new Uint8Array(plain);
  } catch {
    throw new LinkError(
      "wrong-family",
      "This code was not made for this family, or the scan was damaged.",
    );
  }
}
