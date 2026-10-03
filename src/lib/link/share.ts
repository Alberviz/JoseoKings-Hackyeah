// Data code: child to parent. JSON -> optional raw DEFLATE -> AES-GCM with the family key -> base64url
// -> numbered frames behind the CCD1: prefix. Bytes: [flags][iv 12][ciphertext+tag]. Bit 0 of flags says
// whether the plaintext was compressed, so the receiver never guesses.

import { daysBetween } from "@/lib/dates";
import type { CheckIn, DateKey, MissionLog } from "@/types";
import { concatBytes, fromBase64Url, toBase64Url, utf8Decode, utf8Encode } from "./bytes";
import { deflate, inflate, isCompressionAvailable } from "./compress";
import { decryptBytes, encryptBytes } from "./crypto";
import { DEFAULT_FRAME_CHARS, joinFrames, splitFrames } from "./frames";
import { sharePayloadSchema } from "./schemas";
import {
  LINK_VERSION,
  LinkError,
  SHARE_PREFIX,
  type LinkRewardClaim,
  type SharePayload,
} from "./types";

const FLAG_COMPRESSED = 0b0000_0001;

/** Day ranges the child can pick on the share screen. */
export const SHARE_RANGE_DAYS = [7, 14, 30] as const;
export type ShareRangeDays = (typeof SHARE_RANGE_DAYS)[number];

export type ShareSource = {
  familyId: string;
  checkIns: CheckIn[];
  missionLogs: MissionLog[];
  rewardClaims: LinkRewardClaim[];
};

function inRange(date: DateKey, from: DateKey, to: DateKey): boolean {
  return daysBetween(from, date) >= 0 && daysBetween(date, to) >= 0;
}

/** Everything the child recorded between `from` and `to` (both inclusive), sorted by date. */
export function buildSharePayload(source: ShareSource, from: DateKey, to: DateKey): SharePayload {
  if (daysBetween(from, to) < 0) throw new Error("`from` must not be after `to`.");
  const byDate = <T extends { date: DateKey }>(items: T[]) =>
    items
      .filter((item) => inRange(item.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date));
  return {
    v: LINK_VERSION,
    familyId: source.familyId,
    from,
    to,
    checkIns: byDate(source.checkIns),
    missionLogs: byDate(source.missionLogs),
    rewardClaims: byDate(source.rewardClaims),
  };
}

export type EncodeShareOptions = {
  /** Characters per frame. Smaller frames scan better; more frames take longer. */
  maxChars?: number;
  /** Force compression on or off. Default: on when the browser supports it. */
  compress?: boolean;
};

function additionalData(familyId: string): string {
  return `${SHARE_PREFIX}${familyId}`;
}

/** The frames to show as QR codes, one after another. */
export async function encodeShare(
  payload: SharePayload,
  keyB64: string,
  options: EncodeShareOptions = {},
): Promise<string[]> {
  const validated = sharePayloadSchema.parse(payload);
  const json = utf8Encode(JSON.stringify(validated));
  const compress = options.compress ?? isCompressionAvailable();
  const plain = compress ? await deflate(json) : json;
  const flags = new Uint8Array([compress ? FLAG_COMPRESSED : 0]);
  const sealed = await encryptBytes(keyB64, plain, additionalData(validated.familyId));
  const body = toBase64Url(concatBytes(flags, sealed));
  return splitFrames(SHARE_PREFIX, body, options.maxChars ?? DEFAULT_FRAME_CHARS);
}

export function isShareFrame(text: string): boolean {
  return text.trim().startsWith(SHARE_PREFIX);
}

/**
 * Decodes a complete set of frames with the family key. The parent app knows its own familyId; a code
 * from another family fails with LinkError("wrong-family").
 */
export async function decodeShare(
  frames: string[],
  keyB64: string,
  familyId: string,
): Promise<SharePayload> {
  const joined = joinFrames(frames);
  if (joined.prefix !== SHARE_PREFIX) {
    throw new LinkError("wrong-version", "This data code comes from another app version.");
  }
  let bytes: Uint8Array;
  try {
    bytes = fromBase64Url(joined.body);
  } catch {
    throw new LinkError("corrupt", "The data code could not be read.");
  }
  if (bytes.length < 2) throw new LinkError("corrupt", "The data code is too short.");
  const flags = bytes[0];
  const plain = await decryptBytes(keyB64, bytes.slice(1), additionalData(familyId));
  let json: string;
  try {
    json = utf8Decode((flags & FLAG_COMPRESSED) !== 0 ? await inflate(plain) : plain);
  } catch {
    throw new LinkError("corrupt", "The data code could not be unpacked.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new LinkError("corrupt", "The data code has unexpected content.");
  }
  const result = sharePayloadSchema.safeParse(parsed);
  if (!result.success) throw new LinkError("corrupt", "The data code has unexpected content.");
  if (result.data.familyId !== familyId) {
    throw new LinkError("wrong-family", "This code belongs to another family.");
  }
  return result.data;
}
