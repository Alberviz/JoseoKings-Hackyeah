// Pairing code: parent to child. Plain base64url JSON behind the CCP1: prefix. It carries the family
// key, the child's nickname, the enabled missions and the rewards from home. Never health data.

import { fromBase64Url, toBase64Url, utf8Decode, utf8Encode } from "./bytes";
import { pairingPayloadSchema } from "./schemas";
import { LINK_VERSION, LinkError, PAIRING_PREFIX, type PairingPayload } from "./types";

/** Keys that must never appear in a pairing code, whatever the caller passes. */
const FORBIDDEN_KEYS = ["checkIns", "missionLogs", "parentLogs", "foodEntries", "answers"];

export function encodePairing(payload: PairingPayload): string {
  const validated = pairingPayloadSchema.parse(payload);
  for (const key of FORBIDDEN_KEYS) {
    if (key in (validated as object)) {
      throw new Error(`A pairing code must not carry "${key}".`);
    }
  }
  return PAIRING_PREFIX + toBase64Url(utf8Encode(JSON.stringify(validated)));
}

export function isPairingCode(text: string): boolean {
  return text.trim().startsWith(PAIRING_PREFIX);
}

export function decodePairing(text: string): PairingPayload {
  const trimmed = text.trim();
  if (!trimmed.startsWith("CCP")) throw new LinkError("not-a-code", "This is not a pairing code.");
  if (!trimmed.startsWith(PAIRING_PREFIX)) {
    throw new LinkError("wrong-version", "This pairing code comes from another app version.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(utf8Decode(fromBase64Url(trimmed.slice(PAIRING_PREFIX.length))));
  } catch {
    throw new LinkError("corrupt", "The pairing code could not be read.");
  }
  const result = pairingPayloadSchema.safeParse(parsed);
  if (!result.success) throw new LinkError("corrupt", "The pairing code has unexpected content.");
  if (result.data.v !== LINK_VERSION) {
    throw new LinkError("wrong-version", "This pairing code comes from another app version.");
  }
  return result.data;
}
