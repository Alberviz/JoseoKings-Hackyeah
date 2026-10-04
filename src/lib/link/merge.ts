// Merging a child's data code into the parent's state. Idempotent: scanning the same code twice
// changes nothing the second time. Never deletes: the parent app only ever learns more.

import type { CheckIn } from "@/types";
import type { MergeSummary, ShareMergeTarget, SharePayload } from "./types";

function sameCheckIn(a: CheckIn, b: CheckIn): boolean {
  return JSON.stringify({ ...a, id: "" }) === JSON.stringify({ ...b, id: "" });
}

function isNewerCheckIn(incoming: CheckIn, existing: CheckIn): boolean {
  return incoming.createdAt.localeCompare(existing.createdAt) >= 0;
}

/**
 * Check-ins are keyed by day (one per day; the child's app is the source of truth). When both sides
 * differ, the record with the later `createdAt` wins, but the id already on the parent phone is kept
 * so `FoodEntry.relatedCheckInId` stays valid. Mission logs and reward claims are keyed by id and
 * only ever added.
 */
export function mergeShare<T extends ShareMergeTarget>(
  target: T,
  payload: SharePayload,
): { state: T; summary: MergeSummary } {
  const summary: MergeSummary = {
    checkInsAdded: 0,
    checkInsReplaced: 0,
    missionLogsAdded: 0,
    rewardClaimsAdded: 0,
  };

  const checkIns = [...target.checkIns];
  for (const incoming of payload.checkIns) {
    const index = checkIns.findIndex((existing) => existing.date === incoming.date);
    if (index === -1) {
      checkIns.push(incoming);
      summary.checkInsAdded += 1;
    } else if (!sameCheckIn(checkIns[index], incoming)) {
      if (isNewerCheckIn(incoming, checkIns[index])) {
        const existingId = checkIns[index].id;
        checkIns[index] = { ...incoming, id: existingId };
        summary.checkInsReplaced += 1;
      }
    }
  }

  const knownLogs = new Set(target.missionLogs.map((log) => log.id));
  const missionLogs = [...target.missionLogs];
  for (const incoming of payload.missionLogs) {
    if (knownLogs.has(incoming.id)) continue;
    knownLogs.add(incoming.id);
    missionLogs.push(incoming);
    summary.missionLogsAdded += 1;
  }

  const knownClaims = new Set(target.rewardClaims.map((claim) => claim.id));
  const rewardClaims = [...target.rewardClaims];
  for (const incoming of payload.rewardClaims) {
    if (knownClaims.has(incoming.id)) continue;
    knownClaims.add(incoming.id);
    rewardClaims.push(incoming);
    summary.rewardClaimsAdded += 1;
  }

  const byDate = <U extends { date: string }>(items: U[]) =>
    items.sort((a, b) => a.date.localeCompare(b.date));

  return {
    state: {
      ...target,
      checkIns: byDate(checkIns),
      missionLogs: byDate(missionLogs),
      rewardClaims: byDate(rewardClaims),
    },
    summary,
  };
}

export function isEmptyMerge(summary: MergeSummary): boolean {
  return (
    summary.checkInsAdded === 0 &&
    summary.checkInsReplaced === 0 &&
    summary.missionLogsAdded === 0 &&
    summary.rewardClaimsAdded === 0
  );
}
