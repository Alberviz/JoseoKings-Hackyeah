import { describe, expect, it } from "vitest";
import { MISSION_IDS, QUESTION_IDS } from "@/config/content-ids";
import type { CheckIn, MissionLog } from "@/types";
import { fromBase64Url, toBase64Url } from "./bytes";
import { isCompressionAvailable } from "./compress";
import { decryptBytes, encryptBytes, generateFamilyId, generateFamilyKey } from "./crypto";
import { FrameCollector, joinFrames, parseFrame, splitFrames } from "./frames";
import { isEmptyMerge, mergeShare } from "./merge";
import { decodePairing, encodePairing, isPairingCode } from "./pairing";
import { buildSharePayload, decodeShare, encodeShare, isShareFrame } from "./share";
import {
  LinkError,
  PAIRING_PREFIX,
  SHARE_PREFIX,
  type LinkRewardClaim,
  type PairingPayload,
  type ShareMergeTarget,
} from "./types";

const FAMILY_ID = "fam-test";
const KEY = generateFamilyKey();

function checkIn(date: string, belly: number, note?: string): CheckIn {
  return {
    id: `ci-${date}`,
    date,
    answers: {
      [QUESTION_IDS.bellyComfort]: belly,
      [QUESTION_IDS.energy]: 1,
      [QUESTION_IDS.playPace]: 0,
    },
    notToday: false,
    childNote: note,
    createdAt: `${date}T08:00:00.000Z`,
  };
}

function missionLog(date: string, suffix = "a"): MissionLog {
  return {
    id: `ml-${date}-${suffix}`,
    date,
    missionId: MISSION_IDS.dragonBreathing,
    status: "completed",
    company: "family",
    confirmedBy: "parent-pin",
    createdAt: `${date}T17:00:00.000Z`,
  };
}

function claim(date: string): LinkRewardClaim {
  return { id: `rc-${date}`, rewardId: "rw-dinner", date, status: "requested" };
}

const pairing: PairingPayload = {
  v: 1,
  familyId: FAMILY_ID,
  keyB64: KEY,
  nickname: "Lucas",
  allowedMissionIds: [MISSION_IDS.dragonBreathing, MISSION_IDS.bedStretch],
  specialRewards: [
    { id: "rw-dinner", label: "Choose today's dinner", fireCost: 50 },
    { id: "rw-board", label: "Board games night", fireCost: 80 },
  ],
  createdAt: "2026-10-03T20:00:00.000Z",
};

describe("bytes", () => {
  it("round-trips base64url without padding or unsafe characters", () => {
    const bytes = Uint8Array.from({ length: 50 }, (_, i) => (i * 37) % 256);
    const text = toBase64Url(bytes);
    expect(text).not.toMatch(/[+/=]/);
    expect(Array.from(fromBase64Url(text))).toEqual(Array.from(bytes));
  });
});

describe("crypto", () => {
  it("generates a distinct random key and id each time", () => {
    expect(generateFamilyKey()).not.toBe(generateFamilyKey());
    expect(generateFamilyId()).not.toBe(generateFamilyId());
    expect(fromBase64Url(KEY)).toHaveLength(16);
  });

  it("decrypts with the right key and refuses another family's key", async () => {
    const plain = new TextEncoder().encode("hello");
    const sealed = await encryptBytes(KEY, plain, "aad");
    expect(new TextDecoder().decode(await decryptBytes(KEY, sealed, "aad"))).toBe("hello");
    await expect(decryptBytes(generateFamilyKey(), sealed, "aad")).rejects.toMatchObject({
      code: "wrong-family",
    });
    await expect(decryptBytes(KEY, sealed, "other-aad")).rejects.toMatchObject({
      code: "wrong-family",
    });
  });

  it("never repeats the IV, so the same payload gives a different code", async () => {
    const plain = new TextEncoder().encode("same");
    const a = await encryptBytes(KEY, plain, "aad");
    const b = await encryptBytes(KEY, plain, "aad");
    expect(toBase64Url(a)).not.toBe(toBase64Url(b));
  });
});

describe("frames", () => {
  it("splits and joins in any order, ignoring duplicates", () => {
    const body = "x".repeat(1450);
    const frames = splitFrames(SHARE_PREFIX, body, 600);
    expect(frames).toHaveLength(3);
    expect(frames[0]).toMatch(/^CCD1:1\/3:/);
    const shuffled = [frames[2], frames[0], frames[0], frames[1]];
    expect(joinFrames(shuffled)).toEqual({ prefix: SHARE_PREFIX, body });
  });

  it("keeps a short body in one frame and reports progress", () => {
    const frames = splitFrames(SHARE_PREFIX, "abc", 600);
    expect(frames).toEqual(["CCD1:1/1:abc"]);
    const collector = new FrameCollector();
    expect(collector.add(frames[0])).toEqual({ have: 1, total: 1, isComplete: true });
  });

  it("rejects text that is not a code and incomplete sets", () => {
    expect(() => parseFrame("https://example.com")).toThrow(LinkError);
    expect(() => parseFrame("CCD1:3/2:abc")).toThrowError(/frame numbers/);
    const collector = new FrameCollector();
    collector.add("CCD1:1/2:abc");
    expect(() => collector.result()).toThrowError(expect.objectContaining({ code: "incomplete" }));
  });

  it("starts over when a frame from another code arrives", () => {
    const collector = new FrameCollector();
    collector.add("CCD1:1/2:abc");
    const progress = collector.add("CCD1:1/3:zzz");
    expect(progress).toEqual({ have: 1, total: 3, isComplete: false });
  });
});

describe("pairing code", () => {
  it("round-trips and carries no health data", () => {
    const code = encodePairing(pairing);
    expect(isPairingCode(code)).toBe(true);
    expect(code.startsWith(PAIRING_PREFIX)).toBe(true);
    expect(code.length).toBeLessThan(600);
    expect(decodePairing(code)).toEqual(pairing);
    expect(code).not.toContain("checkIns");
  });

  it("rejects garbage, other versions and too many rewards", () => {
    expect(() => decodePairing("hello")).toThrowError(
      expect.objectContaining({ code: "not-a-code" }),
    );
    expect(() => decodePairing("CCP9:abc")).toThrowError(
      expect.objectContaining({ code: "wrong-version" }),
    );
    expect(() => decodePairing(`${PAIRING_PREFIX}!!!`)).toThrowError(
      expect.objectContaining({ code: "corrupt" }),
    );
    const tooMany = {
      ...pairing,
      specialRewards: Array.from({ length: 9 }, (_, i) => ({
        id: `r${i}`,
        label: "x",
        fireCost: 1,
      })),
    };
    expect(() => encodePairing(tooMany)).toThrow();
  });
});

describe("share code", () => {
  const source = {
    familyId: FAMILY_ID,
    checkIns: [
      checkIn("2026-09-20", 0),
      checkIn("2026-10-01", 2, "tummy"),
      checkIn("2026-10-03", 1),
    ],
    missionLogs: [missionLog("2026-09-20"), missionLog("2026-10-02"), missionLog("2026-10-03")],
    rewardClaims: [claim("2026-10-03")],
  };

  it("builds a payload for the range only, both ends inclusive", () => {
    const payload = buildSharePayload(source, "2026-10-01", "2026-10-03");
    expect(payload.checkIns.map((c) => c.date)).toEqual(["2026-10-01", "2026-10-03"]);
    expect(payload.missionLogs.map((m) => m.date)).toEqual(["2026-10-02", "2026-10-03"]);
    expect(payload.rewardClaims).toHaveLength(1);
    expect(() => buildSharePayload(source, "2026-10-03", "2026-10-01")).toThrow();
  });

  it("round-trips through encryption and frames, compressed or not", async () => {
    const payload = buildSharePayload(source, "2026-09-01", "2026-10-03");
    for (const compress of isCompressionAvailable() ? [true, false] : [false]) {
      const frames = await encodeShare(payload, KEY, { compress, maxChars: 300 });
      expect(frames.every(isShareFrame)).toBe(true);
      expect(await decodeShare(frames, KEY, FAMILY_ID)).toEqual(payload);
    }
  });

  it("is not readable without the key and refuses another family", async () => {
    const payload = buildSharePayload(source, "2026-10-01", "2026-10-03");
    const frames = await encodeShare(payload, KEY, { compress: false });
    expect(frames.join("")).not.toContain("tummy");
    expect(frames.join("")).not.toContain("belly");
    await expect(decodeShare(frames, generateFamilyKey(), FAMILY_ID)).rejects.toMatchObject({
      code: "wrong-family",
    });
    await expect(decodeShare(frames, KEY, "another-family")).rejects.toMatchObject({
      code: "wrong-family",
    });
  });

  it("keeps 30 days of daily use within a few frames", async () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`);
    const busy = {
      familyId: FAMILY_ID,
      checkIns: days.map((d) => checkIn(d, d.endsWith("5") ? 2 : 0)),
      missionLogs: days.flatMap((d) => [missionLog(d, "a"), missionLog(d, "b")]),
      rewardClaims: [claim("2026-09-15")],
    };
    const payload = buildSharePayload(busy, "2026-09-01", "2026-09-30");
    const frames = await encodeShare(payload, KEY);
    const limit = isCompressionAvailable() ? 4 : 16;
    expect(frames.length).toBeLessThanOrEqual(limit);
    expect(await decodeShare(frames, KEY, FAMILY_ID)).toEqual(payload);
  });
});

describe("merge", () => {
  const empty: ShareMergeTarget = { checkIns: [], missionLogs: [], rewardClaims: [] };

  it("adds new records, replaces a changed day, never deletes, and is idempotent", () => {
    const first = buildSharePayload(
      {
        familyId: FAMILY_ID,
        checkIns: [checkIn("2026-10-01", 1)],
        missionLogs: [missionLog("2026-10-01")],
        rewardClaims: [],
      },
      "2026-10-01",
      "2026-10-01",
    );
    const once = mergeShare(empty, first);
    expect(once.summary).toEqual({
      checkInsAdded: 1,
      checkInsReplaced: 0,
      missionLogsAdded: 1,
      rewardClaimsAdded: 0,
    });

    const twice = mergeShare(once.state, first);
    expect(isEmptyMerge(twice.summary)).toBe(true);
    expect(twice.state).toEqual(once.state);

    const second = buildSharePayload(
      {
        familyId: FAMILY_ID,
        checkIns: [checkIn("2026-10-01", 2), checkIn("2026-10-02", 0)],
        missionLogs: [missionLog("2026-10-01"), missionLog("2026-10-02")],
        rewardClaims: [claim("2026-10-02")],
      },
      "2026-10-01",
      "2026-10-02",
    );
    const merged = mergeShare(twice.state, second);
    expect(merged.summary).toEqual({
      checkInsAdded: 1,
      checkInsReplaced: 1,
      missionLogsAdded: 1,
      rewardClaimsAdded: 1,
    });
    expect(merged.state.checkIns.map((c) => c.date)).toEqual(["2026-10-01", "2026-10-02"]);
    expect(merged.state.checkIns[0].answers[QUESTION_IDS.bellyComfort]).toBe(2);
    expect(merged.state.missionLogs).toHaveLength(2);
  });

  it("keeps the parent's other fields untouched", () => {
    const target = { ...empty, parentLogs: [{ date: "2026-10-01" }], nickname: "Lucas" };
    const payload = buildSharePayload(
      {
        familyId: FAMILY_ID,
        checkIns: [checkIn("2026-10-01", 0)],
        missionLogs: [],
        rewardClaims: [],
      },
      "2026-10-01",
      "2026-10-01",
    );
    const { state } = mergeShare(target, payload);
    expect(state.parentLogs).toEqual([{ date: "2026-10-01" }]);
    expect(state.nickname).toBe("Lucas");
  });

  it("never resets a claim the parents already marked as done", () => {
    const done: LinkRewardClaim = {
      ...claim("2026-10-02"),
      status: "done",
      doneDate: "2026-10-03",
    };
    const target: ShareMergeTarget = { ...empty, rewardClaims: [done] };
    const payload = buildSharePayload(
      { familyId: FAMILY_ID, checkIns: [], missionLogs: [], rewardClaims: [claim("2026-10-02")] },
      "2026-10-01",
      "2026-10-03",
    );
    const { state, summary } = mergeShare(target, payload);
    expect(summary.rewardClaimsAdded).toBe(0);
    expect(state.rewardClaims).toEqual([done]);
  });
});
