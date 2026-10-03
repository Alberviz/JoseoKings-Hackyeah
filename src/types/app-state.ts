import type { CheckIn } from "./check-in";
import type { CompanionState } from "./companion";
import type { MissionLog } from "./mission";
import type { Consultation, FoodEntry, ParentLog } from "./parent-log";

export type ChildProfile = {
  /** Nickname chosen by the family. No surname, no birth date. */
  nickname: string;
};

export type ParentSettings = {
  /** PBKDF2 hash and salt, base64. Never the PIN itself. */
  pinHash: string;
  pinSalt: string;
  /** Missions the parents enabled. The child picks only from these. */
  allowedMissionIds: string[];
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
  checkIns: CheckIn[];
  missionLogs: MissionLog[];
  parentLogs: ParentLog[];
  foodEntries: FoodEntry[];
  consultations: Consultation[];
};
