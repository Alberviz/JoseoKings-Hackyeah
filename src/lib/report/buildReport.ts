import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import { addDays, daysBetween, todayKey } from "@/lib/dates";
import { CORROBORATION_LABELS } from "@/lib/missions/corroboration";
import { confidenceLabel } from "@/lib/rewards";
import { createEmptyWearableState } from "@/lib/storage/wearableStore";
import type { AppState, BathroomEntry, DateKey, MissionCompany } from "@/types";
import type { WearableState } from "@/types/wearable";
import { compareChildWithWearable } from "./crossComparison";
import { buildObservedSection, buildWearableSection } from "./sections";
import type {
  ActivityConfidenceCount,
  DayStripEntry,
  DoctorReportData,
  FoodCooccurrence,
  MissionCorroborationCount,
} from "./types";

type DatedBathroomEntry = BathroomEntry & { date: DateKey };

const COMPANIES: readonly MissionCompany[] = ["alone", "family", "other"];

function isSchoolImpacted(school?: string): boolean {
  return (
    school === "home" || school === "partial" || school === "missed" || school === "left-early"
  );
}

export function buildReport(
  state: AppState,
  today: DateKey = todayKey(),
  wearable: WearableState = createEmptyWearableState(),
): DoctorReportData {
  const priorConsultations = [...(state.consultations ?? [])]
    .filter((c) => c.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));

  const lastConsultation = priorConsultations[0] ?? null;

  const upcomingConsultations = [...(state.consultations ?? [])]
    .filter((c) => c.date > today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextAppointmentDate = upcomingConsultations[0]?.date ?? null;

  let startDate: DateKey;
  let previousConsultationDate: DateKey | null = null;

  if (lastConsultation) {
    previousConsultationDate = lastConsultation.date;
    const diff = daysBetween(lastConsultation.date, today);
    if (diff > 90 || diff <= 0) {
      // The period does not start at that consultation, so do not name it in the header.
      previousConsultationDate = null;
      startDate = addDays(today, -29);
    } else {
      startDate = addDays(lastConsultation.date, 1);
    }
  } else {
    startDate = addDays(today, -29);
    previousConsultationDate = null;
  }

  const endDate = today;
  const totalDays = daysBetween(startDate, endDate) + 1;

  const checkInByDate = new Map<DateKey, (typeof state.checkIns)[number]>();
  for (const c of state.checkIns ?? []) {
    if (!checkInByDate.has(c.date)) {
      checkInByDate.set(c.date, c);
    }
  }

  const parentLogByDate = new Map<DateKey, (typeof state.parentLogs)[number]>();
  for (const p of state.parentLogs ?? []) {
    if (!parentLogByDate.has(p.date)) {
      parentLogByDate.set(p.date, p);
    }
  }

  const missionDates = new Set<DateKey>();
  for (const m of state.missionLogs ?? []) {
    missionDates.add(m.date);
  }

  const inPeriod = (entry: BathroomEntry | undefined): entry is DatedBathroomEntry =>
    Boolean(entry && entry.date && entry.date >= startDate && entry.date <= endDate);
  const periodDailyLogs = (state.dailyLogs ?? []).filter(inPeriod);
  const periodParentObservations = (state.parentObservations ?? []).filter(inPeriod);

  const dailyLogByDate = new Map<DateKey, DatedBathroomEntry>();
  for (const d of periodDailyLogs) {
    if (!dailyLogByDate.has(d.date)) {
      dailyLogByDate.set(d.date, d);
    }
  }

  const parentObsByDate = new Map<DateKey, DatedBathroomEntry[]>();
  for (const o of periodParentObservations) {
    const list = parentObsByDate.get(o.date) ?? [];
    list.push(o);
    parentObsByDate.set(o.date, list);
  }

  const dayStrip: DayStripEntry[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const day = addDays(startDate, i);
    const checkIn = checkInByDate.get(day);
    const parentLog = parentLogByDate.get(day);
    const dailyLog = dailyLogByDate.get(day);
    const parentObsList = parentObsByDate.get(day) ?? [];

    const rawBelly = checkIn?.answers?.[QUESTION_IDS.bellyComfort];
    const bellyComfort =
      typeof rawBelly === "number" && Number.isInteger(rawBelly) && rawBelly >= 0 && rawBelly <= 2
        ? rawBelly
        : null;

    const rawEnergy = checkIn?.answers?.[QUESTION_IDS.energy];
    const energy =
      typeof rawEnergy === "number" &&
      Number.isInteger(rawEnergy) &&
      rawEnergy >= 0 &&
      rawEnergy <= 2
        ? rawEnergy
        : null;

    const rawPlayPace = checkIn?.answers?.[QUESTION_IDS.playPace];
    const playPace =
      typeof rawPlayPace === "number" &&
      Number.isInteger(rawPlayPace) &&
      rawPlayPace >= 0 &&
      rawPlayPace <= 2
        ? rawPlayPace
        : null;

    const notToday = Boolean(checkIn?.notToday);
    const hadDiscomfort = bellyComfort !== null && bellyComfort >= DISCOMFORT_THRESHOLD;

    const daytimeBathroomCount =
      parentLog?.daytimeBathroomCount ??
      dailyLog?.daytimeBathroomCount ??
      dailyLog?.daytimeVisits ??
      (parentObsList.length > 0
        ? parentObsList.reduce(
            (max: number, o: BathroomEntry) =>
              Math.max(max, o.daytimeBathroomCount ?? o.daytimeVisits ?? o.valueNum ?? 0),
            0,
          )
        : undefined);

    const nighttimeBathroomCount =
      parentLog?.nighttimeBathroomCount ??
      dailyLog?.nighttimeBathroomCount ??
      dailyLog?.nighttimeVisits ??
      (parentLog?.stoolNight === "yes" || dailyLog?.stoolNight === "yes"
        ? 1
        : parentObsList.length > 0
          ? parentObsList.reduce(
              (max: number, o: BathroomEntry) =>
                Math.max(
                  max,
                  o.nighttimeBathroomCount ??
                    o.nighttimeVisits ??
                    (o.stoolNight === "yes" ? 1 : (o.valueNum ?? 0)),
                ),
              0,
            )
          : undefined);

    const looserStools =
      Boolean(parentLog?.looserStools) ||
      parentLog?.stoolConsistency === "looser" ||
      parentLog?.stoolConsistency === "watery" ||
      Boolean(dailyLog?.looserStools) ||
      dailyLog?.stoolConsistency === "looser" ||
      dailyLog?.stoolConsistency === "watery" ||
      parentObsList.some(
        (o: BathroomEntry) =>
          Boolean(o.looserStools) ||
          o.stoolConsistency === "looser" ||
          o.stoolConsistency === "watery" ||
          o.kind === "looser_stools",
      );

    const bloodVisible =
      Boolean(parentLog?.bloodVisible) ||
      parentLog?.stoolBlood === "visible" ||
      Boolean(dailyLog?.bloodVisible) ||
      dailyLog?.stoolBlood === "visible" ||
      parentObsList.some(
        (o: BathroomEntry) =>
          Boolean(o.bloodVisible) || o.stoolBlood === "visible" || o.kind === "blood_visible",
      );

    dayStrip.push({
      date: day,
      hasCheckIn: Boolean(checkIn),
      notToday,
      bellyComfort,
      energy,
      playPace,
      hadMissions: missionDates.has(day),
      hadDiscomfort,
      hasParentLog: Boolean(parentLog || dailyLog || parentObsList.length > 0),
      ...(parentLog?.sleepHours !== undefined ? { sleepHours: parentLog.sleepHours } : {}),
      ...(parentLog ? { schoolImpacted: isSchoolImpacted(parentLog.school) } : {}),
      ...(typeof daytimeBathroomCount === "number" ? { daytimeBathroomCount } : {}),
      ...(typeof nighttimeBathroomCount === "number" ? { nighttimeBathroomCount } : {}),
      ...(looserStools ? { looserStools: true } : {}),
      ...(bloodVisible ? { bloodVisible: true } : {}),
    });
  }

  const checkInDaysCount = dayStrip.filter((d) => d.hasCheckIn).length;
  const checkInCompletionRate = totalDays > 0 ? checkInDaysCount / totalDays : 0;
  const careDaysCount = dayStrip.filter((d) => d.hasCheckIn || d.hadMissions).length;
  const discomfortDaysCount = dayStrip.filter((d) => d.hadDiscomfort).length;

  // One log per date (the first), same as the day strip.
  const periodParentLogs = Array.from(parentLogByDate.values()).filter(
    (p) => p.date >= startDate && p.date <= endDate,
  );

  const sleepLogs = periodParentLogs.filter((p) => typeof p.sleepHours === "number");
  const sleepRecordedDaysCount = sleepLogs.length;
  const avgSleepHours =
    sleepRecordedDaysCount > 0
      ? Math.round(
          (sleepLogs.reduce((sum, p) => sum + (p.sleepHours as number), 0) /
            sleepRecordedDaysCount) *
            10,
        ) / 10
      : null;

  const schoolImpactedDaysCount = periodParentLogs.filter((p) => isSchoolImpacted(p.school)).length;

  const completedMissions = (state.missionLogs ?? []).filter(
    (m) => m.date >= startDate && m.date <= endDate && m.status === "completed",
  );

  const byConfidence: ActivityConfidenceCount[] = COMPANIES.map((company) => ({
    company,
    label: confidenceLabel(company),
    count: completedMissions.filter((m) => m.company === company).length,
  }));

  const wearableCorroboratedCount = completedMissions.filter(
    (m) => m.corroboration === "wearable",
  ).length;
  const motionCorroboratedCount = completedMissions.filter(
    (m) => m.corroboration === "motion",
  ).length;
  const noneCorroboratedCount = completedMissions.filter((m) => !m.corroboration).length;

  const byCorroboration: MissionCorroborationCount[] = [
    {
      method: "wearable",
      label: CORROBORATION_LABELS.wearable,
      count: wearableCorroboratedCount,
    },
    { method: "motion", label: CORROBORATION_LABELS.motion, count: motionCorroboratedCount },
    { method: "none", label: "Self-reported only", count: noneCorroboratedCount },
  ];

  const discomfortDates = new Set<DateKey>(
    dayStrip.filter((d) => d.hadDiscomfort).map((d) => d.date),
  );

  // Count distinct days per food, ignoring case and spaces; show the first spelling seen.
  const foodDays = new Map<string, { text: string; dates: Set<DateKey> }>();
  for (const entry of state.foodEntries ?? []) {
    if (discomfortDates.has(entry.date)) {
      const text = entry.text.trim();
      if (text.length > 0) {
        const key = text.toLowerCase();
        const found = foodDays.get(key);
        if (found) {
          found.dates.add(entry.date);
        } else {
          foodDays.set(key, { text, dates: new Set([entry.date]) });
        }
      }
    }
  }

  const foodsOnDiscomfortDays: FoodCooccurrence[] = Array.from(foodDays.values())
    .map(({ text, dates }) => ({ text, count: dates.size }))
    .sort((a, b) => a.text.localeCompare(b.text));

  const wearableSection = buildWearableSection(wearable, startDate, endDate);

  return {
    childNickname: state.child?.nickname ?? "Child",
    isDemo: Boolean(state.isDemo),
    generatedDate: today,
    period: {
      startDate,
      endDate,
      totalDays,
      previousConsultationDate,
      nextAppointmentDate,
    },
    metrics: {
      checkInDaysCount,
      checkInCompletionRate,
      careDaysCount,
      discomfortDaysCount,
      avgSleepHours,
      sleepRecordedDaysCount,
      schoolImpactedDaysCount,
    },
    activity: {
      totalMissionsCompleted: completedMissions.length,
      byConfidence,
      byCorroboration,
      corroborationTotals: {
        wearable: wearableCorroboratedCount,
        motion: motionCorroboratedCount,
        none: noneCorroboratedCount,
      },
    },
    foodsOnDiscomfortDays,
    crossComparison: compareChildWithWearable(dayStrip, wearableSection.series),
    wearable: wearableSection,
    observed: buildObservedSection(periodParentLogs, periodDailyLogs, periodParentObservations),
    dayStrip,
    disclaimer: REPORT_DISCLAIMER,
  };
}
