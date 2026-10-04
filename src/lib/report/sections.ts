import { median, quartiles } from "@/lib/wearables/stats";
import type { DateKey, ParentLog } from "@/types";
import type { WatchState } from "@/types/watch";
import type { ObservedSection, WatchMetricSummary, WatchReportSection } from "./types";

function summarise(values: number[], decimals: number): WatchMetricSummary {
  if (values.length === 0) return { n: 0, median: null, q1: null, q3: null };
  const factor = 10 ** decimals;
  const round = (v: number | null) => (v === null ? null : Math.round(v * factor) / factor);
  const { q1, q3 } = quartiles(values);
  return { n: values.length, median: round(median(values)), q1: round(q1), q3: round(q3) };
}

/** Median and IQR of the watch values that are valid inside the report period. */
export function buildWatchSection(
  watch: WatchState,
  startDate: DateKey,
  endDate: DateKey,
): WatchReportSection {
  const days = watch.days.filter((d) => d.date >= startDate && d.date <= endDate);
  const steps: number[] = [];
  const restingHr: number[] = [];
  const sleepHours: number[] = [];
  let validDays = 0;

  for (const d of days) {
    const hasSteps = d.dayComplete && d.steps !== null;
    const hasHr = d.nightComplete && d.restingHr !== null;
    const hasSleep = d.nightComplete && d.sleepMinutes !== null;
    if (hasSteps) steps.push(d.steps as number);
    if (hasHr) restingHr.push(d.restingHr as number);
    if (hasSleep) sleepHours.push((d.sleepMinutes as number) / 60);
    if (hasSteps || hasHr || hasSleep) validDays += 1;
  }

  return {
    source: "Watch",
    isDemo: watch.isDemo,
    validDays,
    steps: summarise(steps, 0),
    restingHr: summarise(restingHr, 0),
    sleepHours: summarise(sleepHours, 1),
  };
}

/** Day counts of what the family entered in the period. */
export function buildObservedSection(periodLogs: ParentLog[]): ObservedSection {
  const count = (pick: (p: ParentLog) => boolean) => periodLogs.filter(pick).length;
  return {
    loggedDays: periodLogs.length,
    school: {
      attended: count((p) => p.school === "attended"),
      leftEarly: count((p) => p.school === "left-early"),
      missed: count((p) => p.school === "missed"),
      noSchool: count((p) => p.school === "no-school"),
    },
    medication: {
      yes: count((p) => p.medicationTaken === "yes"),
      partly: count((p) => p.medicationTaken === "partly"),
      no: count((p) => p.medicationTaken === "no"),
      notApplicable: count((p) => p.medicationTaken === "not-applicable"),
    },
  };
}
