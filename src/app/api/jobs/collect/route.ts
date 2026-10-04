import { NextResponse } from "next/server";
import {
  createGoogleFitClient,
  dedupe,
  FitError,
  getWearablesClient,
  MINUTE_METRICS,
  minuteBucketsToRows,
  sleepToRows,
  type WatchSampleRow,
  type WearableMetric,
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

async function runCollectPass() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    return NextResponse.json(
      {
        status: "error",
        message:
          "Missing Google Fit credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN)",
      },
      { status: 500 },
    );
  }

  const subjectId = process.env.WATCH_SUBJECT_ID || DEMO_SUBJECT_ID;
  const lookbackHours = Number(process.env.LOOKBACK_HOURS) || 48;
  const lookbackMs = lookbackHours * 3_600_000;
  const started = new Date();
  const endMs = started.getTime();
  const startMs = endMs - lookbackMs;

  const fit = createGoogleFitClient({ clientId, clientSecret, refreshToken });
  const store = getWearablesClient();

  const rows: WatchSampleRow[] = [];
  const errors: Record<string, string> = {};

  for (const [metric, type] of Object.entries(MINUTE_METRICS)) {
    try {
      const buckets = await fit.aggregateMinutes(type, startMs, endMs);
      rows.push(...minuteBucketsToRows(metric as WearableMetric, buckets, subjectId));
    } catch (e) {
      errors[metric] = e instanceof FitError ? `${e.status}` : (e as Error).message;
    }
  }

  try {
    const sessions = await fit.sleepSessions(startMs, endMs);
    rows.push(...sleepToRows(sessions, subjectId));
  } catch (e) {
    errors.sleep = e instanceof FitError ? `${e.status}` : (e as Error).message;
  }

  const unique = dedupe(rows);
  const counts: Record<string, number> = {};
  for (const r of unique) {
    counts[r.metric] = (counts[r.metric] ?? 0) + 1;
  }

  const written = await store.insertWatchSamples(unique);

  await store.insertCollectorRun({
    subject_id: subjectId,
    started_at: started.toISOString(),
    window_start: new Date(startMs).toISOString(),
    window_end: new Date(endMs).toISOString(),
    rows_written: written,
    counts,
    errors,
  });

  return NextResponse.json({
    status: "ok",
    subjectId,
    startedAt: started.toISOString(),
    windowStart: new Date(startMs).toISOString(),
    windowEnd: new Date(endMs).toISOString(),
    rowsExtracted: unique.length,
    rowsWritten: written,
    counts,
    errors,
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
    return await runCollectPass();
  } catch (err) {
    console.error("Collector job error:", err);
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
    return await runCollectPass();
  } catch (err) {
    console.error("Collector job error:", err);
    return NextResponse.json({ status: "error", message: (err as Error).message }, { status: 500 });
  }
}
