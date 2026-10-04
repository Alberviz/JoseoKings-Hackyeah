import type {
  AnalysisRunRow,
  CheckinRow,
  CollectorRunRow,
  ConsultationRow,
  DailyMetricRow,
  FoodEntryRow,
  MissionDoneRow,
  ParentLogRow,
  ParentObservationRow,
  WatchSampleRow,
} from "./types";

export interface SupabaseConfig {
  url?: string;
  serviceKey?: string;
}

const BATCH_SIZE = 500;

export class SupabaseWearablesClient {
  private url: string;
  private serviceKey: string;

  constructor(config?: SupabaseConfig) {
    const rawUrl = config?.url ?? process.env.SUPABASE_URL;
    const rawKey =
      config?.serviceKey ??
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.url = rawUrl ? rawUrl.replace(/\/+$/, "") : "";
    this.serviceKey = rawKey ?? "";
  }

  private ensureConfigured(): void {
    if (!this.url || !this.serviceKey) {
      throw new Error(
        "Supabase client is not configured. Missing SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
      ...extra,
    };
  }

  private async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    this.ensureConfigured();
    const url = `${this.url}/rest/v1${path}`;
    const headers = this.headers(init.headers as Record<string, string>);
    const res = await fetch(url, { ...init, headers });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Supabase ${res.status} on ${path}: ${text}`);
    }
    return (text ? JSON.parse(text) : null) as T;
  }

  /**
   * Query raw watch samples for a subject.
   */
  async queryWatchSamples(params: {
    subjectId: string;
    metric?: string;
    startAtGte?: string;
    endAtLte?: string;
    limit?: number;
    order?: "asc" | "desc";
  }): Promise<WatchSampleRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    if (params.metric) {
      query.set("metric", `eq.${params.metric}`);
    }
    if (params.startAtGte) {
      query.set("start_at", `gte.${params.startAtGte}`);
    }
    if (params.endAtLte) {
      query.set("end_at", `lte.${params.endAtLte}`);
    }
    const orderDir = params.order ?? "asc";
    query.set("order", `start_at.${orderDir}`);
    if (params.limit) {
      query.set("limit", String(params.limit));
    }
    return this.request<WatchSampleRow[]>(`/watch_samples?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Idempotent: re-reading the same window updates rows instead of duplicating them.
   * Upsert on (subject_id, metric, source, start_at).
   */
  async insertWatchSamples(rows: WatchSampleRow[]): Promise<number> {
    let written = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const chunk = rows.slice(i, i + BATCH_SIZE);
      await this.request("/watch_samples?on_conflict=subject_id,metric,source,start_at", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Records a collector run summary in collector_runs.
   */
  async insertCollectorRun(run: CollectorRunRow): Promise<void> {
    await this.request("/collector_runs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(run),
    });
  }

  /**
   * Idempotent daily metrics upsert on (subject_id, local_date).
   */
  async insertDailyMetrics(metrics: DailyMetricRow[]): Promise<number> {
    let written = 0;
    for (let i = 0; i < metrics.length; i += BATCH_SIZE) {
      const chunk = metrics.slice(i, i + BATCH_SIZE);
      await this.request("/daily_metrics?on_conflict=subject_id,local_date", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Reads checkins for a subject within an optional date range.
   */
  async readCheckins(params: {
    subjectId: string;
    startDate?: string;
    endDate?: string;
    order?: "asc" | "desc";
  }): Promise<CheckinRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    if (params.startDate) {
      query.set("local_date", `gte.${params.startDate}`);
    }
    if (params.endDate) {
      query.append("local_date", `lte.${params.endDate}`);
    }
    const orderDir = params.order ?? "asc";
    query.set("order", `local_date.${orderDir}`);
    return this.request<CheckinRow[]>(`/checkins?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Saves an analysis run record in analysis_runs.
   */
  async writeAnalysisRun(run: AnalysisRunRow): Promise<void> {
    await this.request("/analysis_runs", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(run),
    });
  }

  /**
   * Upsert checkins from PWA ingest on (subject_id, local_date).
   */
  async upsertCheckins(checkins: CheckinRow[]): Promise<number> {
    let written = 0;
    for (let i = 0; i < checkins.length; i += BATCH_SIZE) {
      const chunk = checkins.slice(i, i + BATCH_SIZE);
      await this.request("/checkins?on_conflict=subject_id,local_date", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Upsert parent logs from PWA ingest on (subject_id, local_date).
   */
  async upsertParentLogs(logs: ParentLogRow[]): Promise<number> {
    let written = 0;
    for (let i = 0; i < logs.length; i += BATCH_SIZE) {
      const chunk = logs.slice(i, i + BATCH_SIZE);
      await this.request("/parent_logs?on_conflict=subject_id,local_date", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Insert physical parent observations.
   */
  async insertParentObservations(observations: ParentObservationRow[]): Promise<number> {
    if (observations.length === 0) return 0;
    let written = 0;
    for (let i = 0; i < observations.length; i += BATCH_SIZE) {
      const chunk = observations.slice(i, i + BATCH_SIZE);
      await this.request("/parent_observations", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Insert completed missions.
   */
  async insertMissionsDone(missions: MissionDoneRow[]): Promise<number> {
    if (missions.length === 0) return 0;
    let written = 0;
    for (let i = 0; i < missions.length; i += BATCH_SIZE) {
      const chunk = missions.slice(i, i + BATCH_SIZE);
      await this.request("/missions_done", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Insert food entries.
   */
  async insertFoodEntries(entries: FoodEntryRow[]): Promise<number> {
    if (entries.length === 0) return 0;
    let written = 0;
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const chunk = entries.slice(i, i + BATCH_SIZE);
      await this.request("/food_entries", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(chunk),
      });
      written += chunk.length;
    }
    return written;
  }

  /**
   * Read parent logs for a subject.
   */
  async readParentLogs(params: {
    subjectId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ParentLogRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    if (params.startDate) query.set("local_date", `gte.${params.startDate}`);
    if (params.endDate) query.append("local_date", `lte.${params.endDate}`);
    query.set("order", "local_date.asc");
    return this.request<ParentLogRow[]>(`/parent_logs?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Read food entries for a subject.
   */
  async readFoodEntries(params: {
    subjectId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<FoodEntryRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    if (params.startDate) query.set("local_date", `gte.${params.startDate}`);
    if (params.endDate) query.append("local_date", `lte.${params.endDate}`);
    query.set("order", "local_date.asc");
    return this.request<FoodEntryRow[]>(`/food_entries?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Read missions done for a subject.
   */
  async readMissionsDone(params: {
    subjectId: string;
    startDate?: string;
    endDate?: string;
  }): Promise<MissionDoneRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    if (params.startDate) query.set("local_date", `gte.${params.startDate}`);
    if (params.endDate) query.append("local_date", `lte.${params.endDate}`);
    query.set("order", "done_at.asc");
    return this.request<MissionDoneRow[]>(`/missions_done?${query.toString()}`, {
      method: "GET",
    });
  }

  /**
   * Read consultations for a subject.
   */
  async readConsultations(params: { subjectId: string }): Promise<ConsultationRow[]> {
    const query = new URLSearchParams();
    query.set("subject_id", `eq.${params.subjectId}`);
    query.set("order", "local_date.asc");
    return this.request<ConsultationRow[]>(`/consultations?${query.toString()}`, {
      method: "GET",
    });
  }
}

export function createWearablesClient(config?: SupabaseConfig): SupabaseWearablesClient {
  return new SupabaseWearablesClient(config);
}

let defaultClient: SupabaseWearablesClient | null = null;
export function getWearablesClient(): SupabaseWearablesClient {
  if (!defaultClient) {
    defaultClient = new SupabaseWearablesClient();
  }
  return defaultClient;
}
