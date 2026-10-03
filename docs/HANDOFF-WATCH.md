# Handoff — watch data, Supabase, algorithms

Start here if you are picking this up in another tool. Status page: `docs/STATUS.md`. Design: `docs/WATCH_INTEGRATION.md`. Evidence and formulas: `docs/research/CLINICAL_EVIDENCE_AND_ALGORITHMS.md`.

Branch: `docs/wearable-proposal` (pushed). App checkout with this branch: `C:\Users\Usuario\Projects\Hackaton-wearable`. Collector (own git, no remote): `C:\Users\Usuario\Projects\watch-collector`.

Do not commit `.env.local`. Do not paste keys into chat. Cursor already has the Supabase and Vercel MCPs; when those are needed, ask in the Cursor session instead of configuring new clients.

---

## Where things stand (2026-10-04, 01:56)

Alberto reports that **Google Health is connected and working**. That is the source to build on next. It is not wired into the collector yet.

What this session already proved, on the Fitness API, project number `272841921982`:

- OAuth consent is saved in `watch-collector/.env.local`.
- `npm run probe` listed 34 data sources. They are Xiaomi phones (Mi 9T, Mi A2 Lite, 23113RKC6G) via the Google Fit app. No Zepp, no Amazfit, no heart-rate stream, no sleep sessions.
- `npm run collect:once` wrote **4 070** rows into Supabase at 01:28 Madrid. A later read from the app repo's `.env.local` returned HTTP 200.

| Local date (Europe/Madrid) | Steps | Minutes with steps |
| :------------------------- | ----: | -----------------: |
| 2026-10-02                 | 20258 |                439 |
| 2026-10-03                 |  3862 |                158 |

Also stored: calories, distance, active minutes. Not stored: heart rate, SpO2, sleep.

---

## Supabase

|              |                                                                                                   |
| :----------- | :------------------------------------------------------------------------------------------------ |
| Project      | `mycrohnie-watch`                                                                                 |
| Ref          | `khziifyuhqitlzntesbu`                                                                            |
| Region       | `eu-central-1`                                                                                    |
| URL          | `https://khziifyuhqitlzntesbu.supabase.co`                                                        |
| Org          | Atlas (`yvcqakilomjudlwfpgql`)                                                                    |
| Migration    | `20261003221458_watch_mvp_schema`, file `supabase/migrations/20261003221458_watch_mvp_schema.sql` |
| Demo subject | label `demo-child-1`, id `2facc395-3e2d-4afe-8a6b-80da5a5a6c61`                                   |

RLS is on for every table and there are no public policies. Only the secret key, from a server, can read or write.

Env files (gitignored):

- `C:\Users\Usuario\Projects\watch-collector\.env.local` — Google client, refresh token, Supabase URL and secret, subject id.
- `C:\Users\Usuario\Projects\Hackaton-wearable\.env.local` — `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WATCH_SUBJECT_ID`.

Names only are in `.env.example`. The CLI is not linked (`supabase login` was never completed). The migration file matches what is already applied. Do not run it again blindly; the SQL is idempotent if you must.

---

## Code already written

Collector, zero dependencies, Node 22:

| Command                | What                                                                     |
| :--------------------- | :----------------------------------------------------------------------- |
| `npm run auth`         | Consent. Asks which Google account. Saves the refresh token.             |
| `npm run probe`        | Lists sources and the last 24 h. Writes nothing.                         |
| `npm run collect:once` | One window into Supabase. This is the body of the future Vercel job.     |
| `npm run collect`      | Same, every 120 s, re-reading 48 h. Upsert, so repeats do not duplicate. |
| `npm test`             | 17 tests passing (4 normalisers + 13 analysis).                          |

Analysis, pure functions, in `watch-collector/src/analysis/`: valid day, Hampel, trailing 14-day baseline, nocturnal resting heart rate, outside-range days, food counts only, missions vs next-day energy, steady-day counts, consultation windows, synthetic generator. Not written: cosinor, sleep regularity, the 36-cell lagged Spearman, CUSUM, kappa, food Fisher test, HRV. The 1 000-dataset false-alarm run was not executed.

---

## Rules that still hold

No diagnosis, no prediction, no invented index, no AI, no filling of missing days. Show `n` next to every figure. Below 14 valid days the engine says there is not enough data. Food entries exist only on discomfort days, so they are counts, not a test. Do not cite Kolovos 2022, Geva 2020 or Ward 2020. Do not report sleep stages or WASO. Consensus search quota is exhausted until 1 November 2026.

---

## Next, in this order

1. Confirm what Google Health actually returns (which account, which streams, heart rate and sleep or not). Point the collector at that, or keep Fitness if Health is only the phone-side sync.
2. Run `collect:once` again and check `watch_samples` and `collector_runs` in Supabase.
3. Port `src/analysis` into the app as `src/lib/wearables/` and write `daily_metrics` from the raw minutes. Days are cut in `Europe/Madrid`.
4. Vercel: `POST /api/jobs/collect` and `POST /api/jobs/analyse`, both checking `Authorization: Bearer ${CRON_SECRET}`. Hobby cron runs at most once a day; for anything faster, Supabase `pg_cron` calls the Vercel URL.
5. Parent summary and doctor report read the latest `analysis_runs` row. Wording from the research doc, section 5. Demo output stays labelled "Demo data".
