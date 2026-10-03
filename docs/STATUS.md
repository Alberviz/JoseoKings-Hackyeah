# Wearable track — status (2026-10-04)

Two-minute read for anyone jumping back in. Sources: `docs/WATCH_INTEGRATION.md`, `docs/proposals/WEARABLE_GOOGLE_FIT.md` (update + §8), `docs/research/CLINICAL_EVIDENCE_AND_ALGORITHMS.md` (§1, §2.2, §3.0, §3.OUT), and `Projects/watch-collector/README.md`.

---

## What is decided

- **Direction (Alberto, 2026-10-04):** Optional smartwatch data via **Google Fit** (read-only), a **separate Supabase project** (EU), and **server-side collect + analyse jobs** (Vercel later). Full pipeline design: `docs/WATCH_INTEGRATION.md`. This replaces the old “browser-only, no server, no cron” path in proposal §2.
- **Product rules that change (proposal §1, approved with the update):** Google Fit is an optional source, off by default; watch numbers use their own label (“From the watch (Google Fit)”) alongside self-reported labels; one bounded exception in `src/lib/wearables/` plus report sections. **Unchanged:** no medical advice, no predictions, co-occurrence wording, disclaimer; check-ins and parent log still live in `localStorage` and are also posted to ingest.
- **Engine principles:** Raw Google Fit minutes in `watch_samples`; daily metrics and analysis are **versioned and reproducible** (`analysis_runs` with params, seed, algorithm version). **Local-time days** per subject timezone. **No AI, no gap filling** — too few valid days → “not enough data yet”.
- **Variables we keep:** daily **steps**, **sleep duration** (main session ending that morning), **nocturnal resting HR** (lowest 30-min mean in main sleep, ≥20 HR samples). Child check-in items analysed **separately** (belly-comfort, energy, play-pace); parent log fields as documented.
- **Privacy story for the jury:** pseudonymous IDs, EU (Frankfurt), RLS with no public policies, service role only on server, cascade delete from `subjects`. Honest line: this is **not** a compliance certificate.
- **Pitch honesty:** Google Fit API sign-ups closed May 2024; support ends end of 2026 — say the engine is **source-agnostic** (Health Connect / Google Health API next). Adult cohort evidence; we **describe, we do not predict**.

---

## What is built

| Piece                                                                                    | State                                                                                                                                                                                                                                             |
| :--------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Supabase** `mycrohnie-watch` (ref `khziifyuhqitlzntesbu`, **eu-central-1**, org Atlas) | Schema applied 2026-10-04 (`watch_mvp_schema`); demo subject **`demo-child-1`**.                                                                                                                                                                  |
| **`watch-collector`** (`Projects/watch-collector`)                                       | Collect loop: 48 h lookback, idempotent upsert to `watch_samples` + `collector_runs`. Commands: `auth`, `probe`, `collect`, `collect:dry`, `collect:once`. **`npm test`** (normalisation) passing. **Supabase connectivity verified 2026-10-04.** |
| **Google OAuth / live collect**                                                          | **Blocked on W0:** consent + refresh token (`npm run auth` → `npm run probe`). **Álvaro:** one Google consent click still pending.                                                                                                                |
| **Mycrohnie app pipeline steps 2–5**                                                     | Ingest, `daily.ts`, `statistics.ts`, jobs on Vercel, parent/doctor UI — **to do** per `WATCH_INTEGRATION.md`.                                                                                                                                     |
| **Analysis algorithms (research §3.0 MVP set)**                                          | Not started in code yet. First pass stopped when the account hit its limit on the heavier models; restarted on a lighter model, same scope (A0–A3, A9, A13, A14, A12, A10a, 3.V).                                                                 |

**MVP demo assumption:** treat watch data as reliable for the hackathon; keep validity flags anyway.

**Scheduling (after MVP):** local `npm run collect` every ~2 min for live demo; later Supabase `pg_cron` + `pg_net` → Vercel job recommended (Hobby cron is daily-only).

---

## What we will **not** say to the jury (dropped claims)

From proposal §5, research §2.2, and §3.OUT — do not resurrect these in slides or UI:

| Dropped                                                                               | Why (short)                                                       |
| :------------------------------------------------------------------------------------ | :---------------------------------------------------------------- |
| **Biometric Stability Index** (0–100, fixed weights, clinical tiers)                  | Invented index; reads like classification.                        |
| **Composite S(t)** = belly + energy + play-pace                                       | Unvalidated scale; analyse each item alone.                       |
| **“Lead warning” / predict weeks or 48–72 h before**                                  | Group-level adult evidence ≠ one child; predictions out of scope. |
| **+5–10 bpm RHR rule**, **>30 % step drop** thresholds                                | Not in retrieved literature; contradictory RHR findings exist.    |
| **WASO, deep sleep %, sleep stages, sleep efficiency**                                | Consumer measurement inadequate; dropped variables.               |
| **Mechanism essays** (vagal pathway, tight junctions, myokines)                       | Sounds like treatment claims; not needed for co-occurrence.       |
| **Kolovos 2022, Geva 2020, Ward 2020**                                                | Not found in Consensus — do not cite.                             |
| **Forward-fill / interpolation**                                                      | Creates fake data; forbidden (§4).                                |
| **Flare classification, population norms, food-as-cause, ML, alerts from algorithms** | Explicitly out (§3.OUT).                                          |

**What we _can_ defend:** cleaned series, personal-baseline deviations, lagged co-occurrence with **n** and CIs, and **engine correctness** on synthetic data (planted effect, null, gap, reproducibility) — demo labelled **“Demo data”**.

---

## What is next (in order)

1. **W0 — Google Fit gate (Álvaro):** OAuth consent → `npm run auth` → `npm run probe`. Confirms Zepp/GTS 2 sources (steps, HR, sleep). **Everything with real watch data waits on this one click.**
2. **Live collect (whoever runs the laptop):** `npm run collect` → verify rows in `watch_samples` and `collector_runs`.
3. **Analysis MVP (engineering, `watch-collector/src/analysis`):** A0 valid-day → A1 Hampel → A2 baseline → A3 nocturnal HR → A9 range days → A13/A14 counts/windows → A12 missions → A10a food counts → **3.V** synthetic + planted/null/gap tests. **A7** (Spearman + permutation) if a second engineer is free — it is what the demo shows.
4. **`daily.ts` + tests** in Mycrohnie (`src/lib/wearables/`) — raw minutes → `daily_metrics`.
5. **`statistics.ts` + tests** — same job as analyse; store `analysis_runs`.
6. **`/api/ingest`** — PWA posts check-ins, logs, missions (demo: one ingest token / env).
7. **`/api/jobs/collect` and `/api/jobs/analyse`** on Vercel + scheduler (`CRON_SECRET`).
8. **Parent summary card + doctor report** sections reading latest `analysis_run`.

**After hackathon (not tonight):** cosinor, IS/IV/M10/L5, SRI, CUSUM, kappa, Fisher food 2×2 — see research §3.0 table.

---

## Quick reference — pipeline

```
Watch → phone → Google Fit → [collect] → Supabase raw
PWA localStorage → [ingest] → Supabase child/parent tables
→ daily_metrics → analysis_runs → parent summary + doctor report
```

Docs live in **`Hackaton-wearable`**; collector is **`watch-collector`** (outside the app repo until the Vercel job is copied).
