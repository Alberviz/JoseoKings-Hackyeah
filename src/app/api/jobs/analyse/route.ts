import { NextResponse } from "next/server";
import {
  ALGORITHM_VERSION,
  computeDailyMetrics,
  DEFAULT_TIMEZONE,
  evaluateParentStatus,
  foodCooccurrence,
  getWearablesClient,
  hampel,
  missionsVsEnergy,
  outsideUsualRange,
  periodCounts,
  personalBaseline,
  S_MIN,
  type DailyMetricRow,
  type DailyParentInput,
  type DayForCounts,
} from "@/lib/wearables";

export const dynamic = "force-dynamic";

const DEMO_SUBJECT_ID = "2facc395-3e2d-4afe-8a6b-80da5a5a6c61";

function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret && process.env.NODE_ENV === "development") {
    return true;
  }
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const [type, token] = authHeader.split(" ");
  return type?.toLowerCase() === "bearer" && token === cronSecret;
}

async function runAnalysisPass() {
  const subjectId = process.env.WATCH_SUBJECT_ID || DEMO_SUBJECT_ID;
  const timeZone = process.env.TIMEZONE || DEFAULT_TIMEZONE;
  const lookbackDays = Number(process.env.ANALYSE_LOOKBACK_DAYS) || 90;
  const startDate = new Date(Date.now() - lookbackDays * 86_400_000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  const store = getWearablesClient();

  // 1. Fetch raw watch samples and check-ins
  const [samples, checkins, parentLogs, foodEntries, missions] = await Promise.all([
    store.queryWatchSamples({
      subjectId,
      startAtGte: `${startDate}T00:00:00Z`,
    }),
    store.readCheckins({ subjectId, startDate }),
    store.readParentLogs({ subjectId, startDate }),
    store.readFoodEntries({ subjectId, startDate }),
    store.readMissionsDone({ subjectId, startDate }),
  ]);

  // 2. Aggregate raw minutes into daily_metrics
  const dailyMetrics = computeDailyMetrics(samples, subjectId, timeZone);
  let dailyWritten = 0;
  if (dailyMetrics.length > 0) {
    dailyWritten = await store.insertDailyMetrics(dailyMetrics);
  }

  // 3. Prepare data series for statistical and clinical analysis
  const metricsByDate = new Map<string, DailyMetricRow>();
  for (const m of dailyMetrics) {
    metricsByDate.set(m.local_date, m);
  }

  const checkinsByDate = new Map<string, (typeof checkins)[0]>();
  for (const c of checkins) {
    checkinsByDate.set(c.local_date, c);
  }

  const foodByDate = new Map<string, Array<{ text?: string; tags?: string[] }>>();
  for (const f of foodEntries) {
    let list = foodByDate.get(f.local_date);
    if (!list) {
      list = [];
      foodByDate.set(f.local_date, list);
    }
    list.push({ text: f.text ?? undefined, tags: f.tags });
  }

  const missionsByDate = new Map<string, Array<(typeof missions)[0]>>();
  for (const m of missions) {
    let list = missionsByDate.get(m.local_date);
    if (!list) {
      list = [];
      missionsByDate.set(m.local_date, list);
    }
    list.push(m);
  }

  // Build combined date list
  const allDates = new Set<string>();
  for (const d of metricsByDate.keys()) allDates.add(d);
  for (const d of checkinsByDate.keys()) allDates.add(d);
  for (const p of parentLogs) allDates.add(p.local_date);
  const sortedDates = [...allDates].sort();

  const periodStart = sortedDates[0] || startDate;
  const periodEnd = sortedDates[sortedDates.length - 1] || today;

  // Build days for periodCounts and food co-occurrence
  const daysForCounts: DayForCounts[] = sortedDates.map((date) => {
    const c = checkinsByDate.get(date);
    const f = foodByDate.get(date) ?? [];
    const m = missionsByDate.get(date) ?? [];
    return {
      date,
      bellyComfort: c ? (c.skipped ? "notToday" : c.belly_comfort) : null,
      energy: c ? (c.skipped ? "notToday" : c.energy) : null,
      playPace: c ? (c.skipped ? "notToday" : c.play_pace) : null,
      foodEntries: f,
      missionRecords: m,
      missions: m.length,
    };
  });

  const periodCountsResult = periodCounts(daysForCounts);
  const foodResult = foodCooccurrence(daysForCounts);

  const seed = 42; // Deterministic seed for reproducible analysis runs
  let missionsVsEnergyResult = null;
  try {
    missionsVsEnergyResult = missionsVsEnergy(daysForCounts, seed);
  } catch {
    // Insufficient pairs or data
  }

  // 4. Hampel cleaning, personal baselines and outsideUsualRange
  const stepsSeries = sortedDates.map((d) => metricsByDate.get(d)?.steps ?? null);
  const cleanedSteps = hampel(stepsSeries);
  const stepsBaseline = personalBaseline(cleanedSteps.values, {
    sMin: S_MIN.steps,
  });
  const stepsDeviations = stepsBaseline.map((b) => (b && b.kind === "value" ? b.d : null));
  const stepsOutside = outsideUsualRange(stepsDeviations);

  const sleepSeries = sortedDates.map((d) => metricsByDate.get(d)?.sleep_minutes ?? null);
  const cleanedSleep = hampel(sleepSeries);
  const sleepBaseline = personalBaseline(cleanedSleep.values, {
    sMin: S_MIN.sleepMinutes,
  });
  const sleepDeviations = sleepBaseline.map((b) => (b && b.kind === "value" ? b.d : null));
  const sleepOutside = outsideUsualRange(sleepDeviations);

  const hrSeries = sortedDates.map((d) => metricsByDate.get(d)?.resting_hr ?? null);
  const cleanedHr = hampel(hrSeries);
  const hrBaseline = personalBaseline(cleanedHr.values, {
    sMin: S_MIN.nocturnalHr,
  });
  const hrDeviations = hrBaseline.map((b) => (b && b.kind === "value" ? b.d : null));
  const hrOutside = outsideUsualRange(hrDeviations);

  // 5. Evaluate parent orientation status
  const parentInputs: DailyParentInput[] = sortedDates.map((date) => {
    const c = checkinsByDate.get(date);
    const m = metricsByDate.get(date);
    return {
      date,
      bellyComfort: c ? (c.skipped ? "notToday" : c.belly_comfort) : null,
      energy: c ? (c.skipped ? "notToday" : c.energy) : null,
      playPace: c ? (c.skipped ? "notToday" : c.play_pace) : null,
      steps: m?.steps ?? null,
      sleepMinutes: m?.sleep_minutes ?? null,
      restingHr: m?.resting_hr ?? null,
      daytimeValid: m?.valid_activity ?? false,
      nightValid: m?.valid_sleep ?? false,
    };
  });

  const parentStatus = evaluateParentStatus(parentInputs, {
    targetDate: periodEnd,
  });

  // 6. Record run in analysis_runs
  const analysisRunPayload = {
    subject_id: subjectId,
    run_at: new Date().toISOString(),
    period_start: periodStart,
    period_end: periodEnd,
    algorithm_version: ALGORITHM_VERSION,
    seed,
    params: {
      timeZone,
      lookbackDays,
      sMin: S_MIN,
    },
    results: {
      totalDays: sortedDates.length,
      dailyMetricsCount: dailyMetrics.length,
      periodCounts: periodCountsResult,
      foodCooccurrence: foodResult,
      missionsVsEnergy: missionsVsEnergyResult,
      deviations: {
        steps: stepsDeviations,
        sleep: sleepDeviations,
        restingHr: hrDeviations,
      },
      outsideRangeFlags: {
        steps: stepsOutside,
        sleep: sleepOutside,
        restingHr: hrOutside,
      },
      parentStatus: {
        status: parentStatus.status,
        label: parentStatus.label,
        color: parentStatus.color,
        headline: parentStatus.headline,
        confidenceScore: parentStatus.confidenceScore,
      },
    },
  };

  await store.writeAnalysisRun(analysisRunPayload);

  return NextResponse.json({
    status: "ok",
    subjectId,
    periodStart,
    periodEnd,
    algorithmVersion: ALGORITHM_VERSION,
    dailyMetricsDerived: dailyMetrics.length,
    dailyMetricsWritten: dailyWritten,
    checkinsCount: checkins.length,
    parentStatus: {
      status: parentStatus.status,
      label: parentStatus.label,
      confidence: parentStatus.confidenceScore.score,
    },
    summary: {
      calendarDays: periodCountsResult.calendarDays,
      answeredDays: periodCountsResult.answeredDays,
      steadyDays: periodCountsResult.steadyDays,
      discomfortDays: periodCountsResult.discomfortDays,
    },
  });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid Authorization header." },
      { status: 401 },
    );
  }

  try {
    return await runAnalysisPass();
  } catch (err) {
    console.error("Analyse job error:", err);
    return NextResponse.json({ status: "error", message: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid Authorization header." },
      { status: 401 },
    );
  }

  try {
    return await runAnalysisPass();
  } catch (err) {
    console.error("Analyse job error:", err);
    return NextResponse.json({ status: "error", message: (err as Error).message }, { status: 500 });
  }
}
