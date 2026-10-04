/** Copy for the parent view of the wearable data and for the child-versus-wearable comparison. */

export type DayTone = "usual" | "slightlyDifferent" | "clearlyDifferent" | "unknown";

export const DAY_TONE_LABELS: Record<DayTone, string> = {
  usual: "Like usual",
  slightlyDifferent: "A bit different from usual",
  clearlyDifferent: "Clearly different from usual",
  unknown: "No wearable data yet",
};

export const WEARABLE_STATUS_COPY = {
  title: "How the days look",
  fromWearable: "From the wearable (Google Health)",
  noWearableData: "No wearable data yet",
  demo: "Demo data",
  usualSentence: "Everything looked like usual.",
  unknownSentence: "No wearable data yet.",
  sleepBelow: "slept less than usual",
  sleepAbove: "slept more than usual",
  stepsBelow: "moved less than usual",
  stepsAbove: "moved more than usual",
  hrAbove: "resting heart rate higher",
  hrBelow: "resting heart rate lower",
  stripLabel: "Last 7 days",
  logSigns: "Log physical signs",
  footnote:
    "What the wearable recorded compared with the child's own usual. Not a medical assessment.",
} as const;

export const WEARABLE_COMPARE_COPY = {
  title: "Tired days and the night before",
  notEnough: "Not enough days yet",
  notEnoughDetail: (pairs: number, min: number) =>
    `Needs at least ${min} days with both an energy answer and a wearable night. So far: ${pairs}.`,
  summary: (count: number, total: number) =>
    `On ${count} of ${total} days marked tired, the night before was shorter than the period median.`,
  note: "A count of what was recorded. It does not say why a day felt the way it did.",
} as const;
