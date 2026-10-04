# Serverless Jobs Scheduling: Vercel Cron & Supabase pg_cron

This document details the configuration and operational setup for running backend jobs in CrohnCare (`Hackaton-wearable`):

1. **Collector Job (`/api/jobs/collect`)**: Pulls Google Fit smartwatch data from the past 48 hours and idempotently upserts samples into Supabase `watch_samples` and logs runs to `collector_runs`.
2. **Analysis Job (`/api/jobs/analyse`)**: Aggregates raw minute buckets into `daily_metrics` (cut in child's local timezone `Europe/Madrid`), computes personal baselines, Hampel filter cleaning, outside-range flags, period counts, food co-occurrences, and saves reproducible results to `analysis_runs`.
3. **Ingest Endpoint (`/api/ingest`)**: PWA endpoint for syncing local storage check-ins, parent logs, physical observations, and completed missions to Supabase.

---

## 1. Authentication & Security

All job endpoints are protected by a shared secret:

- Request header: `Authorization: Bearer ${CRON_SECRET}`
- Vercel Cron automatically injects this authorization header when `CRON_SECRET` is configured in the Vercel project environment variables.
- In local development (`NODE_ENV === "development"`), requests are permitted if `CRON_SECRET` is not yet set.

---

## 2. Option A: Vercel Cron (Daily Triggers)

Vercel Hobby projects allow cron jobs configured via `vercel.json` with a frequency of up to once per day.

Configuration in [`vercel.json`](file:///C:/Users/Usuario/Projects/Hackaton-wearable/vercel.json):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/jobs/collect",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/jobs/analyse",
      "schedule": "30 2 * * *"
    }
  ]
}
```

- **Collect**: Runs at `02:00 UTC` daily. Because it queries a 48-hour lookback window, daily execution is sufficient to capture all delayed syncs from Google Fit.
- **Analyse**: Runs at `02:30 UTC` daily, shortly after collection finishes, processing the new samples into `daily_metrics` and updating `analysis_runs`.

---

## 3. Option B: Supabase `pg_cron` + `pg_net` (Every 5 Minutes)

For real-time collection or live demonstrations without requiring Vercel Pro, Supabase's native PostgreSQL extensions `pg_cron` and `pg_net` can trigger the Vercel serverless endpoint every 5 minutes.

### Setup Instructions

Execute the following SQL statements in the Supabase SQL Editor (`mycrohnie-watch` project):

```sql
-- 1. Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Store secrets securely or replace placeholders below
-- Set your Vercel deployment domain and secret token:
-- Vercel URL: https://<your-project>.vercel.app
-- CRON_SECRET: <your-cron-secret>

-- 3. Schedule near-real-time collection every 5 minutes
select cron.schedule(
  'watch-collect-every-5-min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://crohncare.vercel.app/api/jobs/collect',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- 4. Schedule daily analysis every night at 03:00 Madrid time (01:00 or 02:00 UTC)
select cron.schedule(
  'watch-analyse-nightly',
  '0 2 * * *',
  $$
  select net.http_post(
    url := 'https://crohncare.vercel.app/api/jobs/analyse',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
  $$
);

-- 5. To monitor pg_cron execution status:
select * from cron.job_run_details order by start_time desc limit 20;

-- 6. To unschedule if needed:
-- select cron.unschedule('watch-collect-every-5-min');
```

---

## 4. Environment Variables Checklist

Add these to Vercel and local `.env.local`:

```ini
# Supabase Service Role Key (Server-only, bypasses RLS)
SUPABASE_URL=https://khziifyuhqitlzntesbu.supabase.co
SUPABASE_SECRET_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
WATCH_SUBJECT_ID=2facc395-3e2d-4afe-8a6b-80da5a5a6c61

# Cron Authorization Secret
CRON_SECRET=super-secret-cron-token

# Google Fit API (OAuth refresh token)
GOOGLE_CLIENT_ID=272841921982-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REFRESH_TOKEN=1//0xxx
LOOKBACK_HOURS=48
```
