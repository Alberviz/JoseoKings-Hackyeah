# Watch integration: collection, storage, analysis

Status: **approved direction** (Alberto, 2026-10-04 00:00): a smartwatch via Google Fit, a Supabase database and Vercel jobs. This replaces the "no server, no cron" design in §2 of `docs/proposals/WEARABLE_GOOGLE_FIT.md`; the rest of that proposal (variables, cleaning, statistics, what is removed from `BIOMEDICAL_ALGORITHMS.md`) still applies. The clinical evidence and the full algorithm catalogue are in `docs/research/CLINICAL_EVIDENCE_AND_ALGORITHMS.md`.

Working assumption for the MVP: the watch data is reliable. We still keep validity flags, because they cost nothing and the doctor will ask.

---

## 1. Pipeline

```
 Watch ──► phone app ──► Google Fit (parent's Google account)
                              │  OAuth refresh token (server secret)
                              ▼
  [1] COLLECT  watch-collector / Vercel job, every N min, re-reads last 48 h, idempotent upsert
                              ▼
  Supabase (EU, RLS on, service role only)
    watch_samples ◄─ raw minutes and sleep segments
    checkins, parent_logs, parent_observations, food_entries, missions_done, consultations ◄─ [2] INGEST from the PWA
                              ▼
  [3] DAILY     raw minutes → daily_metrics (local-time days, validity flags, algorithm_version)
                              ▼
  [4] ANALYSE   daily_metrics + child + parent data → analysis_runs (params, seed, results)
                              ▼
  [5] PRESENT   parent summary and doctor report read the latest analysis_run
```

| Step      | Where it runs                                                                 | Trigger                                       | Status                                     |
| :-------- | :---------------------------------------------------------------------------- | :-------------------------------------------- | :----------------------------------------- |
| 1 Collect | `watch-collector` (local Node, outside the repo) → `src/app/api/jobs/collect` | local loop now; scheduled later (§3)          | Built, waiting for Google credentials (W0) |
| 2 Ingest  | `src/app/api/ingest` (route handler)                                          | PWA posts after each check-in, log or mission | To do                                      |
| 3 Daily   | `src/lib/wearables/daily.ts`, called by `src/app/api/jobs/analyse`            | after each collect, or nightly                | To do                                      |
| 4 Analyse | `src/lib/wearables/statistics.ts`, same job                                   | nightly, and on demand before a consultation  | To do                                      |
| 5 Present | parent summary card, doctor report                                            | when opened                                   | To do                                      |

## 2. What I think (design notes)

1. **Google Fit is not real time, and that is fine.** Data reaches Google Fit when the phone app syncs (minutes to hours). "Real time" in our system means: poll often, re-read a window that covers late uploads (48 h), and upsert idempotently. The analysis is daily, so a few minutes of latency changes nothing in the results. For the demo we show the collector log updating live.
2. **Keep raw and derived separate.** `watch_samples` stores exactly what Google returned (one row per minute with data; a missing minute has no row). Daily numbers are recomputed from raw with a versioned algorithm. If we fix a bug, we recompute; we never edit raw data.
3. **Every reported number is reproducible.** `analysis_runs` stores the period, the parameters, the algorithm version and the random seed used by permutation tests and bootstrap. A doctor asking "where does this come from?" gets the same number again.
4. **Days are cut in the child's local time zone** (`subjects.timezone`), not UTC. Sleep belongs to the morning it ends.
5. **No AI and no filling of gaps** anywhere in the pipeline. Too few valid days returns "not enough data yet", not a guess.
6. **The PWA becomes a client of the database for the analysis.** Check-ins and the parent log stay in `localStorage` (the app keeps working offline) and are also posted to `/api/ingest`. Without accounts, each install gets a per-subject ingest token at setup (shown once as QR to the parent app). For the hackathon demo: one demo subject and one token in an env var.
7. **Privacy, now that data leaves the device.** Pseudonymous ids only (no names, emails or drug names), EU region (Frankfurt), RLS on with no public policies, service role key only in server code, `on delete cascade` from `subjects` so one delete erases a child's data. This is the answer to the jury's GDPR question; it is not a compliance certificate.
8. **Use a separate Supabase project.** The account has only DietAI today. A child's health data must not share a project with another product. A new project in organisation Atlas costs $0/month.

## 3. Scheduling options

| Option                                         | Frequency           | Cost | Notes                                                                                           |
| :--------------------------------------------- | :------------------ | :--- | :---------------------------------------------------------------------------------------------- |
| Local `npm run collect` (now)                  | every 2 min         | 0    | MVP and live demo. Needs a laptop running.                                                      |
| Vercel cron, Hobby                             | once a day, ±59 min | 0    | Enough for daily analysis thanks to the 48 h lookback. Not "live".                              |
| **Supabase `pg_cron` + `pg_net` → Vercel job** | every 1-5 min       | 0    | Recommended after the MVP: Postgres calls `POST /api/jobs/collect` with a `CRON_SECRET` header. |
| Vercel Pro                                     | every minute        | paid | Simplest if the team upgrades.                                                                  |

Every job endpoint checks `Authorization: Bearer ${CRON_SECRET}` (the vapexperience-pim cron routes do not, and should).

## 4. Data model (summary)

Full DDL: `watch-collector/sql/schema.sql`.

| Table                 | One row per                           | Written by |
| :-------------------- | :------------------------------------ | :--------- |
| `subjects`            | child (pseudonymous label, time zone) | setup      |
| `watch_samples`       | minute bucket or sleep segment        | collect    |
| `collector_runs`      | collect pass (window, counts, errors) | collect    |
| `checkins`            | child and local day                   | ingest     |
| `parent_logs`         | child and local day                   | ingest     |
| `parent_observations` | physical observation by a parent      | ingest     |
| `food_entries`        | food entry                            | ingest     |
| `missions_done`       | mission done                          | ingest     |
| `consultations`       | consultation date                     | ingest     |
| `daily_metrics`       | child and local day (derived)         | daily      |
| `analysis_runs`       | analysis run                          | analyse    |

## 5. Next steps, in order

1. **W0**: Google credentials → `npm run auth` → `npm run probe`. Gate for everything that uses real data.
2. Create the Supabase project and apply the schema.
3. `npm run collect` against Supabase; check `collector_runs`.
4. `daily.ts` + tests (valid-day rule, resting HR, sleep minutes, steps).
5. `statistics.ts` + synthetic generator + planted-effect and null tests.
6. `/api/ingest` and the PWA posting check-ins and logs.
7. `/api/jobs/collect` and `/api/jobs/analyse` on Vercel, then the scheduler.
8. Parent summary and doctor report sections.
