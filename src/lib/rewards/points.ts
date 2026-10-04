import type { CheckIn, DateKey, MissionLog } from "@/types";
import {
  CHECK_IN_POINTS,
  MISSION_POINTS,
  NOT_TODAY_POINTS,
  REST_POINTS,
  TEAM_STARS_PER_MISSION,
} from "./constants";

// The reward is decided by what the child did, never by what the child answered or which mission it was.
// The parameter types are narrow on purpose: these functions cannot read the answers or the mission kind.

export function pointsForCheckIn(checkIn: Pick<CheckIn, "notToday">): number {
  return checkIn.notToday ? NOT_TODAY_POINTS : CHECK_IN_POINTS;
}

export function pointsForMission(log: Pick<MissionLog, "status">): number {
  return log.status === "completed" ? MISSION_POINTS : REST_POINTS;
}

/** Team stars only come from a finished mission done with someone. A rest session never gives one. */
export function teamStarsForMission(log: Pick<MissionLog, "status" | "company">): number {
  return log.status === "completed" && log.company !== "alone" ? TEAM_STARS_PER_MISSION : 0;
}

/** One check-in per date (the first one wins), like the coin count in the economy. */
function uniqueCheckIns<T extends Pick<CheckIn, "date">>(checkIns: readonly T[]): T[] {
  const byDate = new Map<DateKey, T>();
  for (const checkIn of checkIns) {
    if (!byDate.has(checkIn.date)) {
      byDate.set(checkIn.date, checkIn);
    }
  }
  return Array.from(byDate.values());
}

/** One mission log per id (the first one wins), like the coin count in the economy. */
function uniqueMissionLogs<T extends Pick<MissionLog, "id">>(missionLogs: readonly T[]): T[] {
  const byId = new Map<string, T>();
  for (const log of missionLogs) {
    if (!byId.has(log.id)) {
      byId.set(log.id, log);
    }
  }
  return Array.from(byId.values());
}

export function totalPoints(
  checkIns: readonly Pick<CheckIn, "date" | "notToday">[],
  missionLogs: readonly Pick<MissionLog, "id" | "status">[],
): number {
  return (
    uniqueCheckIns(checkIns).reduce((sum, c) => sum + pointsForCheckIn(c), 0) +
    uniqueMissionLogs(missionLogs).reduce((sum, m) => sum + pointsForMission(m), 0)
  );
}

export function totalTeamStars(
  missionLogs: readonly Pick<MissionLog, "id" | "status" | "company">[],
): number {
  return uniqueMissionLogs(missionLogs).reduce((sum, m) => sum + teamStarsForMission(m), 0);
}

/** Days with at least one check-in or mission. A running total: it only goes up and is never reset. */
export function countCareDays(
  checkIns: readonly { date: DateKey }[],
  missionLogs: readonly { date: DateKey }[],
): number {
  return new Set([...checkIns.map((c) => c.date), ...missionLogs.map((m) => m.date)]).size;
}
