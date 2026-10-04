import { describe, expect, it } from "vitest";
import {
  BADGE_IDS,
  CORE_QUESTION_SCALE,
  ITEM_IDS,
  MISSION_IDS,
  QUESTION_IDS,
} from "@/config/content-ids";
import type { AppState, CheckIn, CompanionState, MissionLog } from "@/types";
import { equipItem, nextUnlock, syncCompanion, unequipItem } from "./companion";
import { CHECK_IN_POINTS, MISSION_POINTS, NOT_TODAY_POINTS, REST_POINTS } from "./constants";
import { CONFIDENCE_LABELS } from "./labels";
import {
  countCareDays,
  pointsForCheckIn,
  pointsForMission,
  teamStarsForMission,
  totalPoints,
  totalTeamStars,
} from "./points";

const emptyCompanion: CompanionState = {
  name: "Nova",
  points: 0,
  teamStars: 0,
  ownedItemIds: [],
  equippedItemIds: [],
  badgeIds: [],
};

function checkIn(date: string, answers: CheckIn["answers"], notToday = false): CheckIn {
  return { id: `c-${date}`, date, answers, notToday, createdAt: `${date}T17:00:00.000Z` };
}

function mission(date: string, over: Partial<MissionLog> = {}): MissionLog {
  return {
    id: `m-${date}-${over.missionId ?? "x"}`,
    date,
    missionId: MISSION_IDS.wallSit,
    status: "completed",
    company: "alone",
    confirmedBy: "child",
    createdAt: `${date}T18:00:00.000Z`,
    ...over,
  };
}

function stateWith(checkIns: CheckIn[], missionLogs: MissionLog[], companion = emptyCompanion) {
  return { checkIns, missionLogs, companion } satisfies Pick<
    AppState,
    "checkIns" | "missionLogs" | "companion"
  >;
}

describe("rewards do not depend on the answers", () => {
  it("gives the same points for every combination of answers", () => {
    const { min, max } = CORE_QUESTION_SCALE;
    const values: CheckIn["answers"][string][] = [];
    for (let v = min; v <= max; v += 1) values.push(v);
    values.push("skipped");

    const results = new Set<number>();
    for (const pain of values) {
      for (const playPace of values) {
        for (const energy of values) {
          const answers = {
            [QUESTION_IDS.bellyComfort]: pain,
            [QUESTION_IDS.playPace]: playPace,
            [QUESTION_IDS.energy]: energy,
          };
          results.add(pointsForCheckIn(checkIn("2026-10-01", answers)));
        }
      }
    }
    expect(results).toEqual(new Set([CHECK_IN_POINTS]));
  });

  it("the hardest and the easiest answer give exactly the same reward", () => {
    const worst = checkIn("2026-10-01", { [QUESTION_IDS.bellyComfort]: CORE_QUESTION_SCALE.max });
    const best = checkIn("2026-10-01", { [QUESTION_IDS.bellyComfort]: 0 });
    expect(pointsForCheckIn(worst)).toBe(pointsForCheckIn(best));
  });

  it("'not today' gives a smaller reward, and never nothing", () => {
    const notToday = checkIn("2026-10-01", {}, true);
    expect(pointsForCheckIn(notToday)).toBe(NOT_TODAY_POINTS);
    expect(NOT_TODAY_POINTS).toBeGreaterThan(0);
    expect(NOT_TODAY_POINTS).toBeLessThan(CHECK_IN_POINTS);
  });

  it("gives the same points for every mission kind", () => {
    const results = new Set(
      Object.values(MISSION_IDS).map((missionId) =>
        pointsForMission(mission("2026-10-01", { missionId })),
      ),
    );
    expect(results).toEqual(new Set([MISSION_POINTS]));
  });

  it("a stopped mission is rest: a smaller reward, never nothing", () => {
    const rest = mission("2026-10-01", { status: "rest" });
    expect(pointsForMission(rest)).toBe(REST_POINTS);
    expect(REST_POINTS).toBeGreaterThan(0);
    expect(REST_POINTS).toBeLessThan(MISSION_POINTS);
  });
});

describe("the team track is separate from the main track", () => {
  it("a mission with family gives the same points as one alone, plus a star", () => {
    const alone = mission("2026-10-01", { company: "alone" });
    const family = mission("2026-10-01", { company: "family", confirmedBy: "parent-pin" });
    expect(pointsForMission(family)).toBe(pointsForMission(alone));
    expect(teamStarsForMission(alone)).toBe(0);
    expect(teamStarsForMission(family)).toBe(1);
  });

  it("a rest session with someone gives no star", () => {
    expect(teamStarsForMission(mission("2026-10-01", { status: "rest", company: "family" }))).toBe(
      0,
    );
  });

  it("counts stars only from finished missions with someone", () => {
    const logs = [
      mission("2026-10-01"),
      mission("2026-10-02", { company: "family" }),
      mission("2026-10-03", { company: "other" }),
      mission("2026-10-04", { company: "other", status: "rest" }),
    ];
    expect(totalTeamStars(logs)).toBe(2);
  });
});

describe("totals ignore duplicated records", () => {
  it("counts one check-in per date and one mission log per id", () => {
    const first = checkIn("2026-10-01", {});
    const sameDate = { ...checkIn("2026-10-01", {}, true), id: "c-other" };
    const log = mission("2026-10-01", { company: "family" });
    const copy = { ...log };

    expect(totalPoints([first, sameDate], [log, copy])).toBe(CHECK_IN_POINTS + MISSION_POINTS);
    expect(totalTeamStars([log, copy])).toBe(1);
  });
});

describe("progress only goes up", () => {
  it("adding a check-in or a mission never lowers points or care days", () => {
    const base = stateWith([checkIn("2026-10-01", {})], [mission("2026-10-01")]);
    const more = stateWith(
      [...base.checkIns, checkIn("2026-10-02", {}, true)],
      [...base.missionLogs, mission("2026-10-03", { status: "rest" })],
    );
    expect(totalPoints(more.checkIns, more.missionLogs)).toBeGreaterThan(
      totalPoints(base.checkIns, base.missionLogs),
    );
    expect(countCareDays(more.checkIns, more.missionLogs)).toBeGreaterThan(
      countCareDays(base.checkIns, base.missionLogs),
    );
  });

  it("counts care days once per calendar day", () => {
    expect(
      countCareDays([checkIn("2026-10-01", {})], [mission("2026-10-01"), mission("2026-10-02")]),
    ).toBe(2);
  });

  it("a missed day changes nothing: there is no streak to break", () => {
    const withGap = stateWith([checkIn("2026-10-01", {}), checkIn("2026-10-09", {})], []);
    expect(totalPoints(withGap.checkIns, withGap.missionLogs)).toBe(2 * CHECK_IN_POINTS);
  });

  it("syncCompanion is idempotent", () => {
    const state = stateWith(
      [checkIn("2026-10-01", {})],
      [mission("2026-10-01", { company: "family" })],
    );
    const once = syncCompanion(state);
    const twice = syncCompanion({ ...state, companion: once });
    expect(twice).toEqual(once);
  });

  it("syncCompanion never takes anything away, even when logs are missing", () => {
    const rich: CompanionState = {
      ...emptyCompanion,
      points: 500,
      teamStars: 9,
      ownedItemIds: [ITEM_IDS.hatExplorer, ITEM_IDS.capeStar],
      equippedItemIds: [ITEM_IDS.hatExplorer],
      badgeIds: [BADGE_IDS.teamUp],
    };
    const next = syncCompanion(stateWith([], [], rich));
    expect(next.points).toBe(500);
    expect(next.teamStars).toBe(9);
    expect(next.ownedItemIds).toEqual(expect.arrayContaining(rich.ownedItemIds));
    expect(next.equippedItemIds).toEqual(rich.equippedItemIds);
    expect(next.badgeIds).toContain(BADGE_IDS.teamUp);
  });
});

describe("items and badges", () => {
  it("unlocks main-track items by points and team items by stars", () => {
    const logs = Array.from({ length: 2 }, (_, i) => mission(`2026-10-0${i + 1}`));
    const state = stateWith([checkIn("2026-10-01", {}), checkIn("2026-10-02", {})], logs);
    const next = syncCompanion(state);
    expect(next.points).toBe(40);
    expect(next.ownedItemIds).toContain(ITEM_IDS.hatExplorer);
    expect(next.ownedItemIds).toContain(ITEM_IDS.colorTeal);
    expect(next.ownedItemIds).not.toContain(ITEM_IDS.capeStar);

    const team = syncCompanion(
      stateWith(
        [],
        [1, 2, 3].map((d) => mission(`2026-10-0${d}`, { company: "family" })),
      ),
    );
    expect(team.teamStars).toBe(3);
    expect(team.ownedItemIds).toContain(ITEM_IDS.capeStar);
  });

  it("awards the first check-in and team-up badges", () => {
    const next = syncCompanion(
      stateWith([checkIn("2026-10-01", {})], [mission("2026-10-01", { company: "other" })]),
    );
    expect(next.badgeIds).toEqual(
      expect.arrayContaining([BADGE_IDS.firstCheckIn, BADGE_IDS.teamUp]),
    );
    expect(next.badgeIds).not.toContain(BADGE_IDS.careDays30);
  });

  it("awards the 30 care days badge", () => {
    const days = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, "0")}`);
    const next = syncCompanion(
      stateWith(
        days.map((d) => checkIn(d, {})),
        [],
      ),
    );
    expect(next.badgeIds).toContain(BADGE_IDS.careDays30);
  });

  it("equips one item per slot and ignores items that are not owned", () => {
    const owned: CompanionState = {
      ...emptyCompanion,
      ownedItemIds: [ITEM_IDS.hatExplorer, ITEM_IDS.colorTeal],
    };
    const withHat = equipItem(owned, ITEM_IDS.hatExplorer);
    expect(withHat.equippedItemIds).toEqual([ITEM_IDS.hatExplorer]);
    expect(equipItem(withHat, ITEM_IDS.capeStar)).toEqual(withHat);
    expect(equipItem(withHat, "unknown")).toEqual(withHat);
    const both = equipItem(withHat, ITEM_IDS.colorTeal);
    expect(both.equippedItemIds).toEqual([ITEM_IDS.hatExplorer, ITEM_IDS.colorTeal]);
    expect(unequipItem(both, ITEM_IDS.hatExplorer).equippedItemIds).toEqual([ITEM_IDS.colorTeal]);
  });

  it("points to the next item on each track", () => {
    const companion: CompanionState = {
      ...emptyCompanion,
      points: 30,
      ownedItemIds: [ITEM_IDS.hatExplorer],
    };
    const main = nextUnlock(companion, "main");
    expect(main?.item.id).toBe(ITEM_IDS.colorTeal);
    expect(main?.have).toBe(30);
    expect(main?.need).toBe(40);
    expect(nextUnlock(companion, "team")?.item.id).toBe(ITEM_IDS.capeStar);
    const all = { ...companion, ownedItemIds: Object.values(ITEM_IDS) };
    expect(nextUnlock(all, "main")).toBeNull();
  });
});

describe("confidence labels", () => {
  it("uses the neutral wording and never says declared or unverified", () => {
    expect(CONFIDENCE_LABELS).toEqual({
      alone: "Done on their own",
      other: "Done with someone",
      family: "Done with family",
    });
    const text = Object.values(CONFIDENCE_LABELS).join(" ").toLowerCase();
    expect(text).not.toMatch(/declared|unverified|cheat/);
  });
});
