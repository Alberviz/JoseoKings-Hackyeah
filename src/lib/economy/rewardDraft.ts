import {
  SPECIAL_REWARD_COST_MAX,
  SPECIAL_REWARD_COST_MIN,
  SPECIAL_REWARD_NAME_MAX_LENGTH,
} from "@/config/economy";

/** Upper bound for the list, so the child's shop stays short and easy to read. */
export const SPECIAL_REWARDS_MAX = 12;

export type RewardDraftResult =
  | { ok: true; name: string; fireCost: number }
  | { ok: false; field: "name" | "cost"; message: string };

/** Turns what the parent typed into a valid name and fire price, or says which field to fix. */
export function parseRewardDraft(nameText: string, costText: string): RewardDraftResult {
  const name = nameText.trim().replace(/\s+/g, " ");
  if (name.length < 1) {
    return { ok: false, field: "name", message: "Write a short name for the reward." };
  }
  if (name.length > SPECIAL_REWARD_NAME_MAX_LENGTH) {
    return {
      ok: false,
      field: "name",
      message: `Keep the name to ${SPECIAL_REWARD_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  const trimmedCost = costText.trim();
  const fireCost = /^\d+$/.test(trimmedCost) ? Number(trimmedCost) : Number.NaN;
  if (
    !Number.isInteger(fireCost) ||
    fireCost < SPECIAL_REWARD_COST_MIN ||
    fireCost > SPECIAL_REWARD_COST_MAX
  ) {
    return {
      ok: false,
      field: "cost",
      message: `Enter a whole number from ${SPECIAL_REWARD_COST_MIN} to ${SPECIAL_REWARD_COST_MAX}.`,
    };
  }
  return { ok: true, name, fireCost };
}

/** A unique id for a new reward, random so it never clashes across devices. */
export function generateRewardId(): string {
  if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
    return `reward-${globalThis.crypto.randomUUID()}`;
  }
  return `reward-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
