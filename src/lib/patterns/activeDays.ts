import type { ActiveDays, DaySummary } from "./types";

/**
 * Returns counts of days with at least one completed mission, split by company:
 * alone, family, and other.
 */
export function getActiveDays(summaries: DaySummary[]): ActiveDays {
  let alone = 0;
  let family = 0;
  let other = 0;

  for (const summary of summaries) {
    if (summary.missions.byCompany.alone > 0) {
      alone += 1;
    }
    if (summary.missions.byCompany.family > 0) {
      family += 1;
    }
    if (summary.missions.byCompany.other > 0) {
      other += 1;
    }
  }

  return { alone, family, other };
}
