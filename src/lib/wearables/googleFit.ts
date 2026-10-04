// Google Fit REST client. Read-only.
const API = "https://www.googleapis.com/fitness/v1/users/me";

/** Metrics pulled as 1-minute buckets through dataset:aggregate. */
export const MINUTE_METRICS: Record<string, string> = {
  steps: "com.google.step_count.delta",
  heart_rate: "com.google.heart_rate.bpm",
  active_minutes: "com.google.active_minutes",
  calories: "com.google.calories.expended",
  distance: "com.google.distance.delta",
  spo2: "com.google.oxygen_saturation",
};

export const SLEEP_TYPE = "com.google.sleep.segment";
export const SLEEP_ACTIVITY_TYPE = 72;
const MINUTE = 60_000;
const CHUNK = 6 * 60 * MINUTE;

export class FitError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Google Fit ${status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
    this.status = status;
    this.body = body;
    this.name = "FitError";
  }
}

export interface GoogleFitConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface GoogleFitBucket {
  startTimeMillis?: string;
  endTimeMillis?: string;
  dataset?: Array<{
    dataSourceId?: string;
    point?: Array<{
      startTimeNanos: string;
      endTimeNanos: string;
      dataTypeName?: string;
      originDataSourceId?: string;
      value?: Array<{
        intVal?: number;
        fpVal?: number;
        stringVal?: string;
        mapVal?: Array<{ key: string; value: { fpVal?: number } }>;
      }>;
    }>;
  }>;
}

export interface GoogleFitSession {
  id?: string;
  name?: string;
  description?: string;
  startTimeMillis: string;
  endTimeMillis: string;
  activityType: number;
  application?: {
    packageName?: string;
    name?: string;
  };
}

export interface SleepSessionResult {
  session: GoogleFitSession;
  points: NonNullable<NonNullable<NonNullable<GoogleFitBucket["dataset"]>[0]>["point"]>;
}

export function createGoogleFitClient({ clientId, clientSecret, refreshToken }: GoogleFitConfig) {
  let token: string | null = null;
  let tokenExpiresAt = 0;

  async function accessToken(): Promise<string> {
    if (token && Date.now() < tokenExpiresAt - MINUTE) return token;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new FitError(res.status, body);
    token = body.access_token;
    tokenExpiresAt = Date.now() + (body.expires_in ?? 3600) * 1000;
    return token!;
  }

  async function call<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const auth = await accessToken();
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${auth}`,
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const text = await res.text();
    const body = text ? JSON.parse(text) : {};
    if (!res.ok) throw new FitError(res.status, body);
    return body as T;
  }

  return {
    listDataSources: () =>
      call<{ dataSource?: unknown[] }>("/dataSources").then((b) => b.dataSource ?? []),

    /** 1-minute buckets for one data type, split in 6 h chunks to keep responses small. */
    async aggregateMinutes(
      dataTypeName: string,
      startMs: number,
      endMs: number,
    ): Promise<GoogleFitBucket[]> {
      const buckets: GoogleFitBucket[] = [];
      for (let from = startMs; from < endMs; from += CHUNK) {
        const to = Math.min(from + CHUNK, endMs);
        const body = await call<{ bucket?: GoogleFitBucket[] }>("/dataset:aggregate", {
          method: "POST",
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName }],
            bucketByTime: { durationMillis: MINUTE },
            startTimeMillis: from,
            endTimeMillis: to,
          }),
        });
        buckets.push(...(body.bucket ?? []));
      }
      return buckets;
    },

    /** Sleep sessions overlapping the window, each with its raw segments. */
    async sleepSessions(startMs: number, endMs: number): Promise<SleepSessionResult[]> {
      const params = new URLSearchParams({
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
        activityType: String(SLEEP_ACTIVITY_TYPE),
      });
      const { session = [] } = await call<{ session?: GoogleFitSession[] }>(`/sessions?${params}`);
      const result: SleepSessionResult[] = [];
      for (const s of session) {
        const body = await call<{ bucket?: GoogleFitBucket[] }>("/dataset:aggregate", {
          method: "POST",
          body: JSON.stringify({
            aggregateBy: [{ dataTypeName: SLEEP_TYPE }],
            startTimeMillis: Number(s.startTimeMillis),
            endTimeMillis: Number(s.endTimeMillis),
          }),
        });
        const points = (body.bucket ?? []).flatMap((b) =>
          (b.dataset ?? []).flatMap((d) => d.point ?? []),
        );
        result.push({ session: s, points });
      }
      return result;
    },
  };
}
