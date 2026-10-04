import type { CheckIn, DateKey } from "./check-in";
import type { CompanionState } from "./companion";
import type { EconomyState } from "./economy";
import type { MissionLog } from "./mission";
import type { Consultation, FoodEntry, ParentLog } from "./parent-log";

export type ChildProfile = {
  /** Nickname chosen by the family. No surname, no birth date. */
  nickname: string;
};

export type DeviceRole = "child" | "parent" | "both";

export type ParentSettings = {
  /** PBKDF2 hash and salt, base64. Never the PIN itself. */
  pinHash: string;
  pinSalt: string;
  /** Missions the parents enabled. The child picks only from these. */
  allowedMissionIds: string[];
  /** Who this device is for. Defaults to "both". */
  deviceRole?: DeviceRole;
  /** Optional daily care / medicine reminder time in HH:MM format (local time). No drug names. */
  reminderTime?: string;
  /** Whether the daily reminder is enabled on this device. */
  reminderEnabled?: boolean;
};

/** The loose shape of a daily log or a family observation, as far as the report reads it. */
export type BathroomEntry = {
  date?: DateKey;
  kind?: string;
  valueText?: string;
  valueNum?: number;
  daytimeBathroomCount?: number;
  daytimeVisits?: number;
  daytimeCount?: number;
  nighttimeBathroomCount?: number;
  nighttimeVisits?: number;
  nighttimeCount?: number;
  looserStools?: boolean;
  looserStoolsFlag?: boolean;
  bloodVisible?: boolean;
  bloodVisibleFlag?: boolean;
  stoolFrequency?: unknown;
  stoolNight?: string;
  stoolConsistency?: string;
  stoolBlood?: string;
};

/** The whole app state. One object in localStorage, validated on every read. */
export type AppState = {
  /** Bump when the shape changes and add a migration in src/lib/storage. */
  schemaVersion: 1;
  /** True when the data was loaded from the demo generator. The UI must show a visible "Demo data" label. */
  isDemo: boolean;
  child: ChildProfile | null;
  settings: ParentSettings | null;
  companion: CompanionState;
  economy: EconomyState;
  checkIns: CheckIn[];
  missionLogs: MissionLog[];
  parentLogs: ParentLog[];
  foodEntries: FoodEntry[];
  consultations: Consultation[];
  /** Optional daily logs (alternative data stream for parent logs). */
  dailyLogs?: BathroomEntry[];
  /** Optional physical observations entered by family. */
  parentObservations?: BathroomEntry[];
};
