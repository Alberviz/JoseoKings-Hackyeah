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

  const dayStrip: DayStripEntry[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const day = addDays(startDate, i);
    const checkIn = checkInByDate.get(day);
    const parentLog = parentLogByDate.get(day);

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

    dayStrip.push({
      date: day,
      hasCheckIn: Boolean(checkIn),
      notToday,
      bellyComfort,
      energy,
      playPace,
      hadMissions: missionDates.has(day),
      hadDiscomfort,
      hasParentLog: Boolean(parentLog),
      ...(parentLog?.sleepHours !== undefined ? { sleepHours: parentLog.sleepHours } : {}),
      ...(parentLog ? { schoolImpacted: isSchoolImpacted(parentLog.school) } : {}),
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
    },
    foodsOnDiscomfortDays,
    crossComparison: compareChildWithWatch(dayStrip, watchSection.series),
    watch: watchSection,
    observed: buildObservedSection(periodParentLogs),
    dayStrip,
    disclaimer: REPORT_DISCLAIMER,
  };
}
