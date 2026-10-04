import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { addDays, daysBetween } from "@/lib/dates";
import type { AppState, CheckIn, DateKey, MissionLog, ParentLog } from "@/types";
import type { CheckInStatus, DateRange, DaySummary, DaySummaryMissions } from "./types";

/**
 * Returns one DaySummary for every calendar day in the range (inclusive), in order,
 * even for days with no data.
 */
/** The check-in only has 0, 1 or 2. Anything else counts as missing, like in the report. */
function validAnswer(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 2
    ? value
    : null;
}

export function getDaySummaries(state: AppState, range: DateRange): DaySummary[] {
  const totalDays = daysBetween(range.from, range.to);
  if (totalDays < 0) {
    return [];
  }

  const checkInByDate = new Map<DateKey, CheckIn>();
  for (const checkIn of state.checkIns) {
    if (!checkInByDate.has(checkIn.date)) {
      checkInByDate.set(checkIn.date, checkIn);
    }
  }

  const parentLogByDate = new Map<DateKey, ParentLog>();
  for (const parentLog of state.parentLogs) {
    if (!parentLogByDate.has(parentLog.date)) {
      parentLogByDate.set(parentLog.date, parentLog);
    }
  }

  const missionLogsByDate = new Map<DateKey, MissionLog[]>();
  for (const mission of state.missionLogs) {
    const existing = missionLogsByDate.get(mission.date);
    if (existing) {
      existing.push(mission);
    } else {
      missionLogsByDate.set(mission.date, [mission]);
    }
  }

  const summaries: DaySummary[] = [];

  for (let i = 0; i <= totalDays; i += 1) {
    const date = addDays(range.from, i);

    const checkIn = checkInByDate.get(date);
    let checkInStatus: CheckInStatus = "none";
    let bellyComfort: number | null = null;
    let energy: number | null = null;
    let playPace: number | null = null;
    let dayLevel: number | null = null;
    let hasDiscomfort = false;

    if (checkIn) {
      if (checkIn.notToday) {
        checkInStatus = "not-today";
      } else {
        checkInStatus = "answered";

        const rawBelly = checkIn.answers[QUESTION_IDS.bellyComfort];
        const rawEnergy = checkIn.answers[QUESTION_IDS.energy];
        const rawPlayPace = checkIn.answers[QUESTION_IDS.playPace];

        bellyComfort = validAnswer(rawBelly);
        energy = validAnswer(rawEnergy);
        playPace = validAnswer(rawPlayPace);

        const answers = [bellyComfort, energy, playPace].filter(
          (value): value is number => value !== null,
        );
        dayLevel = answers.length > 0 ? Math.max(...answers) : null;
        hasDiscomfort = typeof bellyComfort === "number" && bellyComfort >= DISCOMFORT_THRESHOLD;
      }
    }

    const parentLog = parentLogByDate.get(date);
    const sleepHours = parentLog?.sleepHours ?? null;
    const activity = parentLog?.activity ?? null;
    const school = parentLog?.school ?? null;
    const medicationTaken = parentLog?.medicationTaken ?? null;

    const missionsForDay = missionLogsByDate.get(date) ?? [];
    let completed = 0;
    let rest = 0;
    let alone = 0;
    let family = 0;
    let other = 0;

    for (const mission of missionsForDay) {
      if (mission.status === "completed") {
        completed += 1;
        if (mission.company === "alone") {
          alone += 1;
        } else if (mission.company === "family") {
          family += 1;
        } else if (mission.company === "other") {
          other += 1;
        }
      } else if (mission.status === "rest") {
        rest += 1;
      }
    }

    const missions: DaySummaryMissions = {
      completed,
      rest,
      byCompany: { alone, family, other },
    };

    summaries.push({
      date,
      checkInStatus,
      bellyComfort,
      energy,
      playPace,
      dayLevel,
      hasDiscomfort,
      sleepHours,
      activity,
      school,
      medicationTaken,
      missions,
    });
  }

  return summaries;
}
