import type { AppState, DateKey } from "@/types";
import { STOPWORDS } from "./constants";
import { getDaySummaries } from "./daySummaries";
import type { DateRange, FoodCooccurrence, FoodCooccurrenceEntry, FoodTermCount } from "./types";

/**
 * For food entries that fall on days with discomfort within the date range, returns
 * the entries and alphabetical, unranked term counts (distinct days each term appeared on).
 * No rankings, percentages, scores or causal wording.
 */
export function getFoodCooccurrence(state: AppState, range: DateRange): FoodCooccurrence {
  const summaries = getDaySummaries(state, range);
  const discomfortDates = new Set<DateKey>(
    summaries.filter((summary) => summary.hasDiscomfort).map((summary) => summary.date),
  );

  const entries: FoodCooccurrenceEntry[] = state.foodEntries
    .filter((entry) => discomfortDates.has(entry.date))
    .map((entry) => ({ date: entry.date, text: entry.text }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.text.localeCompare(b.text));

  const termDaysMap = new Map<string, Set<DateKey>>();

  for (const entry of entries) {
    const words = entry.text.toLowerCase().match(/[a-z]{3,}/g) ?? [];
    for (const word of words) {
      if (!STOPWORDS.has(word)) {
        let daysSet = termDaysMap.get(word);
        if (!daysSet) {
          daysSet = new Set<DateKey>();
          termDaysMap.set(word, daysSet);
        }
        daysSet.add(entry.date);
      }
    }
  }

  const termCounts: FoodTermCount[] = Array.from(termDaysMap.entries())
    .map(([term, daysSet]) => ({
      term,
      days: daysSet.size,
      count: daysSet.size,
    }))
    .sort((a, b) => a.term.localeCompare(b.term));

  return {
    entries,
    termCounts,
  };
}
