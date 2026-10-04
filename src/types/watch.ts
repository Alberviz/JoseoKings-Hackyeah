export type WatchDay = {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  steps: number | null;
  /** Nocturnal resting heart rate, beats per minute. */
  restingHr: number | null;
  sleepMinutes: number | null;
  /** Enough night data to trust restingHr and sleepMinutes. */
  nightComplete: boolean;
  /** Enough daytime data to trust steps. */
  dayComplete: boolean;
};

export type WatchState = {
  days: WatchDay[];
  /** ISO timestamp of the last successful sync, or null. */
  lastSyncAt: string | null;
  /** True when the days were generated demo data. */
  isDemo: boolean;
};
