import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getWearablesClient,
  type CheckinRow,
  type FoodEntryRow,
  type MissionDoneRow,
  type ParentLogRow,
  type ParentObservationRow,
} from "@/lib/wearables";

export const dynamic = "force-dynamic";

const DEMO_SUBJECT_ID = "2facc395-3e2d-4afe-8a6b-80da5a5a6c61";

// Ingest validation schemas matching PWA LocalStorage models
const dateKeyRegex = /^\d{4}-\d{2}-\d{2}$/;

const checkInSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD"),
  answers: z.record(z.string(), z.union([z.number(), z.literal("skipped")])),
  notToday: z.boolean().default(false),
  childNote: z.string().optional(),
  createdAt: z.string().optional(),
});

const parentLogSchema = z.object({
  date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD"),
  sleepHours: z.number().min(0).max(24).optional().nullable(),
  activity: z.enum(["none", "light", "moderate", "high"]).optional().nullable(),
  school: z.enum(["attended", "left-early", "missed", "no-school"]).optional().nullable(),
  medicationTaken: z.enum(["yes", "partly", "no", "not-applicable"]).optional().nullable(),
  note: z.string().optional().nullable(),
});

const observationSchema = z.object({
  date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD").optional(),
  local_date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD").optional(),
  observed_at: z.string().optional(),
  kind: z.string().min(1),
  value_num: z.number().optional().nullable(),
  value_text: z.string().optional().nullable(),
});

const missionLogSchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD"),
  missionId: z.string().min(1),
  status: z.enum(["completed", "rest"]),
  company: z.enum(["alone", "family", "other", "someone"]),
  confirmedBy: z.string().optional(),
  createdAt: z.string().optional(),
});

const foodEntrySchema = z.object({
  id: z.string().optional(),
  date: z.string().regex(dateKeyRegex, "Date must be YYYY-MM-DD"),
  text: z.string(),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().optional(),
});

const ingestBodySchema = z.object({
  subjectId: z.string().uuid().optional(),
  checkins: z.array(checkInSchema).optional(),
  parentLogs: z.array(parentLogSchema).optional(),
  observations: z.array(observationSchema).optional(),
  missions: z.array(missionLogSchema).optional(),
  foodEntries: z.array(foodEntrySchema).optional(),
});

function isAuthorized(req: Request): boolean {
  const secret = process.env.INGEST_SECRET || process.env.CRON_SECRET;
  if (!secret) return true; // Open in demo mode if secret not set
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return false;
  const [type, token] = authHeader.split(" ");
  return type?.toLowerCase() === "bearer" && token === secret;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Missing or invalid Authorization header." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ingestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 422 },
    );
  }

  const data = parsed.data;
  const subjectId = data.subjectId || process.env.WATCH_SUBJECT_ID || DEMO_SUBJECT_ID;
  const store = getWearablesClient();

  const results = {
    checkinsWritten: 0,
    parentLogsWritten: 0,
    observationsWritten: 0,
    missionsWritten: 0,
    foodEntriesWritten: 0,
  };

  // 1. Process Check-ins
  if (data.checkins && data.checkins.length > 0) {
    const checkinRows: CheckinRow[] = data.checkins.map((c) => {
      const comfortVal = c.answers["belly-comfort"] ?? c.answers["bellyComfort"];
      const energyVal = c.answers["energy"];
      const playPaceVal = c.answers["play-pace"] ?? c.answers["playPace"];

      const isSkipped =
        c.notToday ||
        comfortVal === "skipped" ||
        energyVal === "skipped" ||
        playPaceVal === "skipped";

      return {
        subject_id: subjectId,
        local_date: c.date,
        belly_comfort: typeof comfortVal === "number" ? comfortVal : null,
        energy: typeof energyVal === "number" ? energyVal : null,
        play_pace: typeof playPaceVal === "number" ? playPaceVal : null,
        skipped: isSkipped,
        answered_at: c.createdAt || new Date().toISOString(),
      };
    });

    results.checkinsWritten = await store.upsertCheckins(checkinRows);
  }

  // 2. Process Parent Logs & auto-generate activity observations
  const observationsToInsert: ParentObservationRow[] = [];

  if (data.parentLogs && data.parentLogs.length > 0) {
    const parentLogRows: ParentLogRow[] = data.parentLogs.map((p) => {
      if (p.activity) {
        observationsToInsert.push({
          subject_id: subjectId,
          observed_at: new Date().toISOString(),
          local_date: p.date,
          kind: "activity_level",
          value_text: p.activity,
        });
      }
      return {
        subject_id: subjectId,
        local_date: p.date,
        sleep_hours: p.sleepHours ?? null,
        school: p.school ?? null,
        medication_taken: p.medicationTaken ?? null,
        note: p.note ?? null,
      };
    });

    results.parentLogsWritten = await store.upsertParentLogs(parentLogRows);
  }

  // 3. Process explicit observations
  if (data.observations && data.observations.length > 0) {
    for (const obs of data.observations) {
      observationsToInsert.push({
        subject_id: subjectId,
        observed_at: obs.observed_at || new Date().toISOString(),
        local_date: obs.local_date || obs.date || new Date().toISOString().slice(0, 10),
        kind: obs.kind,
        value_num: obs.value_num ?? null,
        value_text: obs.value_text ?? null,
      });
    }
  }

  if (observationsToInsert.length > 0) {
    results.observationsWritten = await store.insertParentObservations(observationsToInsert);
  }

  // 4. Process Completed Missions
  if (data.missions && data.missions.length > 0) {
    const missionRows: MissionDoneRow[] = data.missions.map((m) => {
      const companyVal: "alone" | "someone" | "family" =
        m.company === "other" ? "someone" : (m.company as "alone" | "someone" | "family");

      return {
        subject_id: subjectId,
        done_at: m.createdAt || new Date().toISOString(),
        local_date: m.date,
        mission_id: m.missionId,
        company: companyVal,
        stopped_early: m.status === "rest",
      };
    });

    results.missionsWritten = await store.insertMissionsDone(missionRows);
  }

  // 5. Process Food Entries
  if (data.foodEntries && data.foodEntries.length > 0) {
    const foodRows: FoodEntryRow[] = data.foodEntries.map((f) => ({
      subject_id: subjectId,
      local_date: f.date,
      text: f.text,
      tags: f.tags ?? [],
      created_at: f.createdAt || new Date().toISOString(),
    }));

    results.foodEntriesWritten = await store.insertFoodEntries(foodRows);
  }

  return NextResponse.json({
    status: "ok",
    subjectId,
    synced: results,
  });
}
