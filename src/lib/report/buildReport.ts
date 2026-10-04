import { DISCOMFORT_THRESHOLD, QUESTION_IDS } from "@/config/content-ids";
import { REPORT_DISCLAIMER } from "@/content/disclaimers";
import { addDays, daysBetween, todayKey } from "@/lib/dates";
import { confidenceLabel } from "@/lib/rewards";
import { createEmptyWatchState } from "@/lib/storage/watchStore";
import type { AppState, DateKey, MissionCompany } from "@/types";
import type { WatchState } from "@/types/watch";
import { compareChildWithWatch } from "./crossComparison";
import { buildObservedSection, buildWatchSection } from "./sections";
import type {
  ActivityConfidenceCount,
  DayStripEntry,
  DoctorReportData,
  FoodCooccurrence,
  MissionCorroborationCount,
} from "./types";

const COMPANIES: readonly MissionCompany[] = ["alone", "family", "other"];

function isSchoolImpacted(school?: string): boolean {
  return (
    school === "home" || school === "partial" || school === "missed" || school === "left-early"
  );
}

export function buildReport(
  state: AppState,
  today: DateKey = todayKey(),
  watch: WatchState = createEmptyWatchState(),
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

  const periodDailyLogs = ((state.dailyLogs ?? []) as any[]).filter(
    (d) => d && d.date >= startDate && d.date <= endDate,
  );
  const periodParentObservations = ((state.parentObservations ?? []) as any[]).filter(
    (o) => o && o.date >= startDate && o.date <= endDate,
  );

  const dailyLogByDate = new Map<DateKey, any>();
  for (const d of periodDailyLogs) {
    if (!dailyLogByDate.has(d.date)) {
      dailyLogByDate.set(d.date, d);
    }
  }

  const parentObsByDate = new Map<DateKey, any[]>();
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
      typeof rawBelly === "number" && rawBelly >= 0 && rawBelly <= 2 ? rawBelly : null;

    const rawEnergy = checkIn?.answers?.[QUESTION_IDS.energy];
    const energy =
      typeof rawEnergy === "number" && rawEnergy >= 0 && rawEnergy <= 2 ? rawEnergy : null;

    const rawPlayPace = checkIn?.answers?.[QUESTION_IDS.playPace];
    const playPace =
      typeof rawPlayPace === "number" && rawPlayPace >= 0 && rawPlayPace <= 2 ? rawPlayPace : null;

    const notToday = Boolean(checkIn?.notToday);
    const hadDiscomfort =
      (bellyComfort !== null && bellyComfort >= DISCOMFORT_THRESHOLD) || notToday;

    const daytimeBathroomCount =
      parentLog?.daytimeBathroomCount ??
      dailyLog?.daytimeBathroomCount ??
      dailyLog?.daytimeVisits ??
      (parentObsList.length > 0
        ? parentObsList.reduce(
            (max: number, o: any) =>
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
              (max: number, o: any) =>
                Math.max(
                  max,
                  o.nighttimeBathroomCount ??
                    o.nighttimeVisits ??
                    (o.stoolNight === "yes" ? 1 : o.valueNum ?? 0),
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
        (o: any) =>
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
        (o: any) =>
          Boolean(o.bloodVisible) ||
          o.stoolBlood === "visible" ||
          o.kind === "blood_visible",
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

  const periodParentLogs = (state.parentLogs ?? []).filter(
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

  const watchCorroboratedCount = completedMissions.filter(
    (m) => m.corroboration === "watch",
  ).length;
  const motionCorroboratedCount = completedMissions.filter(
    (m) => m.corroboration === "motion",
  ).length;
  const noneCorroboratedCount = completedMissions.filter(
    (m) => !m.corroboration,
  ).length;

  const byCorroboration: MissionCorroborationCount[] = [
    { method: "watch", label: "Watch verified", count: watchCorroboratedCount },
    { method: "motion", label: "Motion sensor verified", count: motionCorroboratedCount },
    { method: "none", label: "Self-reported only", count: noneCorroboratedCount },
  ];

  const discomfortDates = new Set<DateKey>(
    dayStrip.filter((d) => d.hadDiscomfort).map((d) => d.date),
  );

  const foodCounts = new Map<string, number>();
  for (const entry of state.foodEntries ?? []) {
    if (discomfortDates.has(entry.date)) {
      const text = entry.text.trim();
      if (text.length > 0) {
        foodCounts.set(text, (foodCounts.get(text) ?? 0) + 1);
      }
    }
  }

  const foodsOnDiscomfortDays: FoodCooccurrence[] = Array.from(foodCounts.entries())
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || a.text.localeCompare(b.text));

  const watchSection = buildWatchSection(watch, startDate, endDate);

  return {
    childNickname: state.child?.nickname ?? "Lucas",
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
        watch: watchCorroboratedCount,
        motion: motionCorroboratedCount,
        none: noneCorroboratedCount,
      },
    },
    foodsOnDiscomfortDays,
    crossComparison: compareChildWithWatch(dayStrip, watchSection.series),
    watch: watchSection,
    observed: buildObservedSection(periodParentLogs, periodDailyLogs, periodParentObservations),
    dayStrip,
    disclaimer: REPORT_DISCLAIMER,
  };
}
