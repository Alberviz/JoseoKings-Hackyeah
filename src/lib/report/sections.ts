import { addDays, daysBetween } from "@/lib/dates";
import { resolveDeviceSelection } from "@/lib/wearables/devices";
import { median, quartiles } from "@/lib/wearables/stats";
import type { BathroomEntry, DateKey, ParentLog } from "@/types";
import type { WatchState } from "@/types/watch";
import type {
  BathroomObservedSummary,
  ObservedSection,
  WatchDailyPoint,
  WatchMetricSummary,
  WatchReportSection,
} from "./types";

function summarise(values: number[], decimals: number): WatchMetricSummary {
  if (values.length === 0) return { n: 0, median: null, q1: null, q3: null };
  const factor = 10 ** decimals;
  const round = (v: number | null) => (v === null ? null : Math.round(v * factor) / factor);
  const { q1, q3 } = quartiles(values);
  return { n: values.length, median: round(median(values)), q1: round(q1), q3: round(q3) };
}

/** Title of the note that explains how the watch figures are made. */
export const WATCH_METHOD_NOTE_TITLE = "How the watch figures are made";

const DENSE_METHOD_TEXT = "lowest 30-minute average";

function sparseMethodText(gapMin: number | null): string {
  return gapMin === null
    ? "lowest average of 3 readings in a row"
    : `lowest average of 3 readings in a row (watch recorded about every ${gapMin} min)`;
}

function nightsText(count: number): string {
  return `${count} ${count === 1 ? "night" : "nights"}`;
}

/** The text shown next to the night-time heart-rate figure. */
function buildRestingHrMethodText(dense: number, sparse: number, gapMin: number | null) {
  if (dense === 0 && sparse === 0) return null;
  if (sparse === 0) return DENSE_METHOD_TEXT;
  if (dense === 0) return sparseMethodText(gapMin);
  return `${DENSE_METHOD_TEXT} on ${nightsText(dense)}; ${sparseMethodText(gapMin)} on ${nightsText(sparse)}`;
}

/**
 * Plain note on how the watch figures are made. It states the limits: simple fixed calculations,
 * not clinical, not validated here, adapted when the watch records heart rate less often during
 * sleep, and mixed evidence in published work. No claim of correlation or detection.
 */
function buildMethodNote(
  dense: number,
  sparse: number,
  gapMin: number | null,
  restingHrSource: WatchReportSection["restingHrSource"],
): string[] {
  const note = [
    "The figures are simple fixed calculations done on this device from what the watch recorded. They describe this child's own recordings. They are not a clinical measurement and they have not been validated for this use.",
    "They follow methods used in research on wearables, which mostly used watches that record heart rate about every minute.",
  ];
  const total = dense + sparse;
  if (sparse > 0) {
    const every =
      gapMin === null ? "less often than every 5 minutes" : `about every ${gapMin} minutes`;
    note.push(
      `On ${sparse} of the ${nightsText(total)} the watch recorded heart rate during sleep ${every}. For those nights the night-time heart rate uses an adapted method, the lowest average of 3 readings in a row, which is less precise. ${nightsText(dense)} used the lowest 30-minute average.`,
    );
  } else if (dense > 0) {
    note.push(
      `On all ${nightsText(dense)} with a night-time heart-rate figure, the watch recorded heart rate often enough for the lowest 30-minute average.`,
    );
  }
  if (restingHrSource === "watch-daily" || restingHrSource === "mixed") {
    note.push(
      "On some days the resting heart rate is the figure the watch itself reported, not one calculated here.",
    );
  }
  note.push(
    "Published studies of watch data in inflammatory bowel disease are mostly in adults, and their results are mixed, for example on resting heart rate.",
  );
  return note;
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
  const hrSources = new Set<"night-samples" | "watch-daily">();
  let denseNights = 0;
  let sparseNights = 0;
  const sparseGaps: number[] = [];
  let validDays = 0;
  const byDate = new Map<DateKey, WatchDailyPoint>();

  for (const d of days) {
    const hasSteps = d.dayComplete && d.steps !== null;
    // The watch's own daily resting heart rate does not depend on our night checks.
    const hasHr = d.restingHr !== null && (d.nightComplete || d.restingHrSource === "watch-daily");
    const hasSleep = d.nightComplete && d.sleepMinutes !== null;
    if (hasSteps) steps.push(d.steps as number);
    if (hasHr) {
      restingHr.push(d.restingHr as number);
      hrSources.add(d.restingHrSource === "watch-daily" ? "watch-daily" : "night-samples");
      if (d.restingHrSource !== "watch-daily") {
        // Saved days without a method come from before the sparse method existed: dense nights.
        if (d.restingHrMethod === "sparse-3-readings") {
          sparseNights += 1;
          if (typeof d.restingHrGapMin === "number") sparseGaps.push(d.restingHrGapMin);
        } else {
          denseNights += 1;
        }
      }
    }
    if (hasSleep) sleepHours.push((d.sleepMinutes as number) / 60);
    if (hasSteps || hasHr || hasSleep) validDays += 1;
    byDate.set(d.date, {
      date: d.date,
      steps: hasSteps ? (d.steps as number) : null,
      restingHr: hasHr ? (d.restingHr as number) : null,
      sleepHours: hasSleep ? Math.round(((d.sleepMinutes as number) / 60) * 10) / 10 : null,
    });
  }

  const series: WatchDailyPoint[] = [];
  const total = daysBetween(startDate, endDate) + 1;
  for (let i = 0; i < total; i += 1) {
    const date = addDays(startDate, i);
    series.push(byDate.get(date) ?? { date, steps: null, restingHr: null, sleepHours: null });
  }

  const devices = watch.devices ?? [];
  const resolved = resolveDeviceSelection(devices, watch.deviceSelection);
  const usedIds = new Set([resolved.steps, resolved.heartRate, resolved.sleep]);
  const deviceLabels = devices.filter((dev) => usedIds.has(dev.id)).map((dev) => dev.label);
  const restingHrSource =
    hrSources.size === 2 ? "mixed" : hrSources.size === 1 ? [...hrSources][0] : null;

  const gapMedian = median(sparseGaps);
  const sparseGapMin = gapMedian === null ? null : Math.round(gapMedian);

  return {
    source: "From the watch (Google Health)",
    deviceLabels: watch.isDemo ? [] : deviceLabels,
    restingHrSource,
    restingHrNights: { dense: denseNights, sparse: sparseNights },
    sparseGapMin,
    restingHrMethodText: buildRestingHrMethodText(denseNights, sparseNights, sparseGapMin),
    methodNote: buildMethodNote(denseNights, sparseNights, sparseGapMin, restingHrSource),
    isDemo: watch.isDemo,
    validDays,
    steps: summarise(steps, 0),
    restingHr: summarise(restingHr, 0),
    sleepHours: summarise(sleepHours, 1),
    series,
  };
}

type DayBathroomRecord = {
  daytime: number;
  nighttime: number;
  looser: boolean;
  blood: boolean;
  hasBathroom: boolean;
};

/** Day counts and clinical observations from family entries in the period. */
export function buildObservedSection(
  periodLogs: ParentLog[],
  dailyLogs: BathroomEntry[] = [],
  parentObservations: BathroomEntry[] = [],
): ObservedSection {
  const count = (pick: (p: ParentLog) => boolean) => periodLogs.filter(pick).length;

  const recordsByDate = new Map<DateKey, DayBathroomRecord>();

  const getOrCreate = (date: DateKey): DayBathroomRecord => {
    let rec = recordsByDate.get(date);
    if (!rec) {
      rec = { daytime: 0, nighttime: 0, looser: false, blood: false, hasBathroom: false };
      recordsByDate.set(date, rec);
    }
    return rec;
  };

  for (const p of periodLogs) {
    if (!p.date) continue;
    const rec = getOrCreate(p.date);
    const hasStoolFields =
      p.stoolFrequency !== undefined ||
      p.stoolNight !== undefined ||
      p.stoolConsistency !== undefined ||
      p.stoolBlood !== undefined;
    const hasCounts =
      p.daytimeBathroomCount !== undefined ||
      p.nighttimeBathroomCount !== undefined ||
      p.looserStools !== undefined ||
      p.bloodVisible !== undefined;

    if (hasStoolFields || hasCounts) {
      rec.hasBathroom = true;
    }

    if (typeof p.daytimeBathroomCount === "number") {
      rec.daytime = Math.max(rec.daytime, p.daytimeBathroomCount);
    }
    if (typeof p.nighttimeBathroomCount === "number") {
      rec.nighttime = Math.max(rec.nighttime, p.nighttimeBathroomCount);
    } else if (p.stoolNight === "yes" && rec.nighttime === 0) {
      rec.nighttime = 1;
    }

    if (
      p.looserStools === true ||
      p.stoolConsistency === "looser" ||
      p.stoolConsistency === "watery"
    ) {
      rec.looser = true;
    }
    if (p.bloodVisible === true || p.stoolBlood === "visible") {
      rec.blood = true;
    }
  }

  for (const d of dailyLogs ?? []) {
    if (!d || !d.date) continue;
    const rec = getOrCreate(d.date);
    const hasCounts =
      d.daytimeBathroomCount !== undefined ||
      d.daytimeVisits !== undefined ||
      d.daytimeCount !== undefined ||
      d.nighttimeBathroomCount !== undefined ||
      d.nighttimeVisits !== undefined ||
      d.nighttimeCount !== undefined ||
      d.looserStools !== undefined ||
      d.bloodVisible !== undefined ||
      d.stoolFrequency !== undefined ||
      d.stoolNight !== undefined;

    if (hasCounts) {
      rec.hasBathroom = true;
    }

    const dayCount = d.daytimeBathroomCount ?? d.daytimeVisits ?? d.daytimeCount;
    if (typeof dayCount === "number") {
      rec.daytime = Math.max(rec.daytime, dayCount);
    }

    const nightCount = d.nighttimeBathroomCount ?? d.nighttimeVisits ?? d.nighttimeCount;
    if (typeof nightCount === "number") {
      rec.nighttime = Math.max(rec.nighttime, nightCount);
    } else if (d.stoolNight === "yes" && rec.nighttime === 0) {
      rec.nighttime = 1;
    }

    if (
      d.looserStools === true ||
      d.looserStoolsFlag === true ||
      d.stoolConsistency === "looser" ||
      d.stoolConsistency === "watery"
    ) {
      rec.looser = true;
    }
    if (d.bloodVisible === true || d.bloodVisibleFlag === true || d.stoolBlood === "visible") {
      rec.blood = true;
    }
  }

  for (const obs of parentObservations ?? []) {
    if (!obs || !obs.date) continue;
    const rec = getOrCreate(obs.date);
    rec.hasBathroom = true;

    const dayCount = obs.daytimeBathroomCount ?? obs.daytimeVisits ?? obs.daytimeCount;
    if (typeof dayCount === "number") {
      rec.daytime = Math.max(rec.daytime, dayCount);
    } else if (
      obs.kind === "bathroom_day" ||
      obs.kind === "bathroom_daytime" ||
      (obs.kind === "bathroom_visits" && obs.valueText === "day")
    ) {
      rec.daytime += obs.valueNum ?? 1;
    }

    const nightCount = obs.nighttimeBathroomCount ?? obs.nighttimeVisits ?? obs.nighttimeCount;
    if (typeof nightCount === "number") {
      rec.nighttime = Math.max(rec.nighttime, nightCount);
    } else if (
      obs.kind === "bathroom_night" ||
      obs.kind === "bathroom_nighttime" ||
      (obs.kind === "bathroom_visits" && obs.valueText === "night")
    ) {
      rec.nighttime += obs.valueNum ?? 1;
    } else if (obs.stoolNight === "yes" && rec.nighttime === 0) {
      rec.nighttime = 1;
    }

    if (
      obs.looserStools === true ||
      obs.looserStoolsFlag === true ||
      obs.stoolConsistency === "looser" ||
      obs.stoolConsistency === "watery" ||
      obs.kind === "looser_stools" ||
      obs.kind === "stool_looser" ||
      (obs.kind === "bathroom_visits" && obs.valueText?.toLowerCase().includes("loose"))
    ) {
      rec.looser = true;
    }

    if (
      obs.bloodVisible === true ||
      obs.bloodVisibleFlag === true ||
      obs.stoolBlood === "visible" ||
      obs.kind === "blood_visible" ||
      obs.kind === "blood_seen" ||
      (obs.kind === "bathroom_visits" && obs.valueText?.toLowerCase().includes("blood"))
    ) {
      rec.blood = true;
    }
  }

  let totalDaytime = 0;
  let totalNighttime = 0;
  let daysWithLooserStools = 0;
  let daysWithBloodVisible = 0;
  let daysLogged = 0;

  for (const rec of recordsByDate.values()) {
    if (rec.hasBathroom) {
      daysLogged += 1;
    }
    totalDaytime += rec.daytime;
    totalNighttime += rec.nighttime;
    if (rec.looser) daysWithLooserStools += 1;
    if (rec.blood) daysWithBloodVisible += 1;
  }

  const totalVisits = totalDaytime + totalNighttime;
  const avgDaytimePerDay =
    daysLogged > 0 ? Math.round((totalDaytime / daysLogged) * 10) / 10 : null;
  const avgNighttimePerDay =
    daysLogged > 0 ? Math.round((totalNighttime / daysLogged) * 10) / 10 : null;
  const avgVisitsPerDay = daysLogged > 0 ? Math.round((totalVisits / daysLogged) * 10) / 10 : null;

  const bathroom: BathroomObservedSummary = {
    totalDaytime,
    totalNighttime,
    totalVisits,
    avgDaytimePerDay,
    avgNighttimePerDay,
    avgVisitsPerDay,
    daysWithLooserStools,
    daysWithBloodVisible,
    daysLogged,
  };

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
    bathroom,
  };
}
