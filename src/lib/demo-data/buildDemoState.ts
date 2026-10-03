import { CORE_QUESTION_SCALE, ITEM_IDS, MISSION_IDS, QUESTION_IDS } from "@/config/content-ids";
import { addDays, isWeekend, todayKey } from "@/lib/dates";
import { syncCompanion } from "@/lib/rewards";
import type {
  ActivityLevel,
  AppState,
  CheckIn,
  Consultation,
  DateKey,
  FoodEntry,
  MedicationTaken,
  MissionCompany,
  MissionConfirmation,
  MissionLog,
  ParentLog,
  ParentSettings,
  SchoolDay,
} from "@/types";
import { createRandom, type Random } from "./random";

// Fictional data for the demo. A fictional child, no drug names, no real people.
// Shape of the story (days before "today"): a calm stretch, a slow rise, a flare around 30 to 20 days ago, then a recovery.

export const DEMO_DAYS = 90;
export const DEMO_SEED = 20261003;
export const DEMO_CHILD_NICKNAME = "Lucas";
export const DEMO_COMPANION_NAME = "Nova";

const CONSULTATION_DAYS_AGO = [80, 30] as const;

/** [days ago, how hard the day is, from 0 (very good) to 1 (very hard)]. Linear between points. */
const SEVERITY_CURVE: ReadonlyArray<readonly [number, number]> = [
  [DEMO_DAYS, 0.15],
  [60, 0.18],
  [34, 0.3],
  [27, 0.95],
  [22, 0.85],
  [8, 0.3],
  [0, 0.12],
];

const MISSION_ID_LIST = Object.values(MISSION_IDS);

const FOODS: readonly string[] = [
  "Pizza and a fizzy drink at a birthday party",
  "Creamy pasta for dinner",
  "Ice cream after school",
  "Fried chicken and chips",
  "Chocolate milk with breakfast cereal",
  "Salad with raw vegetables and seeds",
  "Cheese sandwich and a yoghurt",
  "Burger from a fast food place",
];

const NOTES: ReadonlyArray<readonly [number, string]> = [
  [88, "Started a new school year routine."],
  [47, "Birthday party at a cousin's house."],
  [28, "Stayed home from school. Quiet day."],
  [24, "Grandma came to visit."],
  [12, "Back at school for the whole day."],
  [4, "Played in the park with friends."],
];

function severityAt(daysAgo: number): number {
  for (let i = 0; i < SEVERITY_CURVE.length - 1; i += 1) {
    const [d0, s0] = SEVERITY_CURVE[i];
    const [d1, s1] = SEVERITY_CURVE[i + 1];
    if (daysAgo <= d0 && daysAgo >= d1) {
      const t = (d0 - daysAgo) / (d0 - d1);
      return s0 + (s1 - s0) * t;
    }
  }
  return SEVERITY_CURVE[SEVERITY_CURVE.length - 1][1];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const stamp = (date: DateKey, hour: number) =>
  `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`;
const compact = (date: DateKey) => date.replaceAll("-", "");

function makeCheckIn(date: DateKey, severity: number, rnd: Random): CheckIn {
  const { min, max } = CORE_QUESTION_SCALE;
  const notToday = rnd.chance(severity > 0.8 ? 0.25 : 0.05);
  const level = (extra: number) =>
    clamp(Math.round(severity * max + rnd.jitter(0.7) + extra), min, max);
  const answers: CheckIn["answers"] = notToday
    ? {
        [QUESTION_IDS.bellyPain]: "skipped",
        [QUESTION_IDS.bathroom]: "skipped",
        [QUESTION_IDS.energy]: "skipped",
      }
    : {
        [QUESTION_IDS.bellyPain]: level(0),
        [QUESTION_IDS.bathroom]: level(severity > 0.6 ? 0.5 : 0),
        // Energy: higher is more energy, so it moves the other way.
        [QUESTION_IDS.energy]: clamp(max - Math.round(severity * max + rnd.jitter(0.7)), min, max),
      };
  return {
    id: `demo-checkin-${compact(date)}`,
    date,
    answers,
    notToday,
    createdAt: stamp(date, 17),
  };
}

function makeMissionLog(date: DateKey, severity: number, rnd: Random): MissionLog | null {
  const attempt = severity < 0.4 ? 0.75 : severity < 0.7 ? 0.45 : 0.25;
  if (!rnd.chance(attempt)) return null;
  const status = rnd.chance(severity > 0.6 ? 0.5 : 0.07) ? "rest" : "completed";
  const roll = rnd.next();
  const company: MissionCompany = roll < 0.55 ? "alone" : roll < 0.85 ? "family" : "other";
  const confirmedBy: MissionConfirmation =
    company === "alone" ? "child" : company === "family" ? "parent-pin" : "other-tap";
  return {
    id: `demo-mission-${compact(date)}`,
    date,
    missionId: rnd.pick(MISSION_ID_LIST),
    status,
    company,
    confirmedBy,
    createdAt: stamp(date, 18),
  };
}

function makeParentLog(date: DateKey, daysAgo: number, severity: number, rnd: Random): ParentLog {
  const weekend = isWeekend(date);
  const sleepHours = clamp(Math.round((9.2 - severity * 2.8 + rnd.jitter(0.6)) * 2) / 2, 4, 11);
  const activity: ActivityLevel =
    severity > 0.7
      ? rnd.chance(0.6)
        ? "none"
        : "light"
      : severity > 0.35
        ? "light"
        : rnd.chance(0.5)
          ? "moderate"
          : "high";
  let school: SchoolDay = "attended";
  if (weekend) school = "no-school";
  else if (severity > 0.8) school = rnd.chance(0.7) ? "missed" : "left-early";
  else if (severity > 0.55)
    school = rnd.chance(0.5) ? "left-early" : rnd.chance(0.3) ? "missed" : "attended";
  const medRoll = rnd.next();
  const medicationTaken: MedicationTaken = medRoll < 0.9 ? "yes" : medRoll < 0.98 ? "partly" : "no";
  const note = NOTES.find(([ago]) => ago === daysAgo)?.[1];
  return { date, sleepHours, activity, school, medicationTaken, ...(note ? { note } : {}) };
}

function buildCompanion(checkIns: CheckIn[], missionLogs: MissionLog[]): AppState["companion"] {
  // Points, stars, items and badges come from the same rules as the real app.
  return syncCompanion({
    checkIns,
    missionLogs,
    companion: {
      name: DEMO_COMPANION_NAME,
      points: 0,
      teamStars: 0,
      ownedItemIds: [],
      equippedItemIds: [ITEM_IDS.hatExplorer, ITEM_IDS.colorTeal],
      badgeIds: [],
    },
  });
}

export type DemoOptions = {
  /** Last day of the demo data. Defaults to today (local). Pass a fixed day in tests. */
  today?: DateKey;
  /**
   * Parent settings to use. The default has an empty PIN hash, which means "no PIN yet":
   * parent mode asks the family to create one. Real PIN records come from src/lib/pin (task T3).
   */
  settings?: ParentSettings;
};

const DEFAULT_SETTINGS: ParentSettings = {
  pinHash: "",
  pinSalt: "",
  allowedMissionIds: MISSION_ID_LIST,
};

/** A complete fictional AppState: about 90 days, two consultations, one flare and its recovery. Deterministic. */
export function buildDemoState(options: DemoOptions = {}): AppState {
  const today = options.today ?? todayKey();
  const rnd = createRandom(DEMO_SEED);

  const checkIns: CheckIn[] = [];
  const missionLogs: MissionLog[] = [];
  const parentLogs: ParentLog[] = [];
  const foodEntries: FoodEntry[] = [];

  for (let daysAgo = DEMO_DAYS - 1; daysAgo >= 0; daysAgo -= 1) {
    const date = addDays(today, -daysAgo);
    const severity = severityAt(daysAgo);

    if (rnd.chance(0.9)) {
      const checkIn = makeCheckIn(date, severity, rnd);
      checkIns.push(checkIn);

      const pain = checkIn.answers[QUESTION_IDS.bellyPain];
      if (typeof pain === "number" && pain >= 3 && rnd.chance(0.7)) {
        foodEntries.push({
          id: `demo-food-${compact(date)}`,
          date,
          text: rnd.pick(FOODS),
          relatedCheckInId: checkIn.id,
          createdAt: stamp(date, 20),
        });
      }
    }

    const mission = makeMissionLog(date, severity, rnd);
    if (mission) missionLogs.push(mission);

    if (rnd.chance(0.85)) parentLogs.push(makeParentLog(date, daysAgo, severity, rnd));
  }

  const consultations: Consultation[] = CONSULTATION_DAYS_AGO.map((ago) => ({
    id: `demo-consultation-${compact(addDays(today, -ago))}`,
    date: addDays(today, -ago),
  }));

  return {
    schemaVersion: 1,
    isDemo: true,
    child: { nickname: DEMO_CHILD_NICKNAME },
    settings: options.settings ?? DEFAULT_SETTINGS,
    companion: buildCompanion(checkIns, missionLogs),
    checkIns,
    missionLogs,
    parentLogs,
    foodEntries,
    consultations,
  };
}
