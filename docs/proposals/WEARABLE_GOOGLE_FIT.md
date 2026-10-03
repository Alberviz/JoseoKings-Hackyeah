# Proposal: Amazfit GTS 2 data via Google Fit, analysed on the device

Status: **proposal for Alberto's OK** (2026-10-03, 23:45). Author: Álvaro with his AI (Claude in Cursor). Nothing here is a decision until Alberto writes it in `docs/DECISIONS.md`. It reviews and corrects `docs/BIOMEDICAL_ALGORITHMS.md` (Juan and Farouk, branch `feat/t8-mission-engine`) and reuses the signal-processing ideas of Álvaro's Kinexis OS (MATLAB EMG project).

> **Update 2026-10-04:** Alberto approved a Supabase database and server jobs. §1 is approved and §2 ("no server, no cron") is replaced by [`docs/WATCH_INTEGRATION.md`](../WATCH_INTEGRATION.md). §3 to §6 still apply.

Goal: the parents connect the child's Amazfit GTS 2 (through Google Fit). The app crosses the watch data with the check-in and the daily log, with deterministic statistics only (no AI, no filling of gaps), and the doctor report shows what co-occurred, with the number of days behind every figure.

---

## 1. What this changes in the current rules

Today three rules forbid it. Each needs Alberto's explicit OK:

| Rule today                                                             | Where                                    | Proposed change                                                                                                                                             |
| :--------------------------------------------------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any smartwatch, health platform or sensor integration is out of scope. | `PRODUCT.md` §8, `TASKS.md` out-of-scope | Google Fit (read only) is in scope as an **optional** source, off by default.                                                                               |
| Activity is never presented as measured.                               | `PRODUCT.md` §5.3, `DECISIONS.md`        | Watch data is shown with its own source label, "From the watch (Google Fit)", next to the existing self-reported labels. Missions keep their social labels. |
| Scope frozen at beta.                                                  | `DECISIONS.md`                           | One exception, built in `src/lib/wearables/` and one report section, so it cannot break the beta loop.                                                      |

What **does not** change: health data stays on the device (§2 explains how), no medical advice, no predictions, no invented index, co-occurrence wording, the disclaimer.

## 2. Data path (no server, no cron)

```
Amazfit GTS 2 ──Bluetooth──► Zepp app ──► Google Fit (parent's Google account)
                                              │
                         parent taps "Sync watch" in parent mode
                                              ▼
              PWA in the browser: Google Identity Services token (read-only Fitness scopes)
                                              │  fetch https://fitness.googleapis.com/... (CORS)
                                              ▼
              daily aggregates ──zod──► localStorage ──► src/lib/wearables (pure) ──► report
```

- The browser calls the Fitness REST API directly with a short-lived access token. **Our server never sees the data or the token.** `PRODUCT.md` §5.1 holds as written: the data goes from Google, where the family already put it, to the device.
- Only one new public env var: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (a client id is not a secret). No client secret, no refresh token stored anywhere.

### Why not Vercel crons

`BIOMEDICAL_ALGORITHMS.md` §6 proposes two Vercel crons plus a GitHub Actions poller. It does not hold together:

1. **A cron runs on the server and has nowhere to put the data.** There is no database, and the results are meant for `localStorage`, which only exists in the browser. Making crons work needs a database with a child's health data and a stored refresh token: a backend for special-category data of a minor (GDPR art. 8 and 9). That is exactly the decision the team rejected on 2026-10-03.
2. Hobby plan: one run per day per cron, at any minute of the chosen hour ([Vercel docs](https://vercel.com/docs/cron-jobs/usage-and-pricing)). (The "maximum 2 cron jobs" limit in that document is outdated; since January 2026 it is 100 per project, still daily.)
3. A daily sync adds nothing for a summary that the parent reads when opening the app. Sync on open (the document's own "on-access" mode) gives the same freshness.

If the team still wants a cron for the pitch, the only coherent one is a non-health job. For health data: no.

### Risks to verify first (task W0, 20 minutes, blocks W3)

- **Google Fit API access.** New sign-ups have been closed since 1 May 2024 and support ends at the end of 2026, no exact date ([Google migration guide](https://developer.android.com/health-and-fitness/health-connect/migration/fit)). Before any code: with the team's Google Cloud project, get a token in the OAuth Playground for `fitness.activity.read`, `fitness.heart_rate.read`, `fitness.sleep.read` and call `users/me/dataSources`. If it fails, W3 is dropped and the engine runs on a CSV import or on demo data.
- **What Zepp writes for a GTS 2.** Check in the list of data sources that steps, heart rate samples and sleep segments from Zepp exist. If sleep is missing, the sleep variable is dropped, not estimated.
- **Pitch line.** Say it plainly: "Google Fit retires at the end of 2026; the engine is source-agnostic and the next source is Health Connect (on device) or the Google Health API." That answers the jury before they ask.

## 3. Variables we keep, and the evidence for each

Only what a GTS 2 can measure **and** what consumer wearables measure acceptably:

| Variable               | Definition (deterministic)                                                                                                    | Keep?  | Why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------- | :----- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `steps`                | Sum of `com.google.step_count.delta` for the local calendar day.                                                              | Yes    | Fewer daily steps during IBD flares in a 309-person wearable cohort ([Hirten 2025](https://consensus.app/papers/details/390f6a3543f850cc9372a84ca66e8cd5/)).                                                                                                                                                                                                                                                                                                                                                          |
| `sleepHours`           | Total asleep time of the main sleep session ending on that local morning (all non-awake segments).                            | Yes    | Two-state sleep/wake from wrist devices is valid for timing and duration ([Miller 2022](https://consensus.app/papers/details/c92d711de468535f96637a262fcedb76/)). Shorter sleep with disease activity in adolescents with IBD ([Breeden 2024](https://consensus.app/papers/details/37cae93098ec56b48da08b1b8c9357c1/)).                                                                                                                                                                                               |
| `restingHr`            | Lowest 30-minute rolling mean of heart-rate samples inside the main sleep session. Needs at least 20 samples in that session. | Yes    | Higher HR and resting HR during flares ([Hirten 2025](https://consensus.app/papers/details/390f6a3543f850cc9372a84ca66e8cd5/)). Wearable HR mean bias about ±3% ([Doherty 2024](https://consensus.app/papers/details/dbef972405915cc7b2e5a90c5b66af5d/)).                                                                                                                                                                                                                                                             |
| `WASO_min`             | Minutes awake after sleep onset.                                                                                              | **No** | Wrist devices over-estimate WASO by about 13 minutes on average ([Lee 2024 meta-analysis](https://consensus.app/papers/details/0b872df24dee516a8cfe9bdef248ce7e/)) and detect wake poorly (specificity 29–52%, [Schyvens 2025](https://consensus.app/papers/details/ba08f66ce96053fba8cad8ff68d05002/)).                                                                                                                                                                                                              |
| `DeepSleep_pct`        | Share of deep sleep.                                                                                                          | **No** | Sleep-stage agreement with polysomnography is only fair to moderate (kappa 0.20–0.53) ([Miller 2022](https://consensus.app/papers/details/c92d711de468535f96637a262fcedb76/), [Schyvens 2025](https://consensus.app/papers/details/ba08f66ce96053fba8cad8ff68d05002/)). In IBD, sleep architecture changed with inflammation and **not** with symptoms alone ([Hirten 2025, sleep](https://consensus.app/papers/details/f24ddab5196352a393c41221fb4be928/)), so it would not line up with the child's answers anyway. |
| HRV                    | —                                                                                                                             | **No** | It is the best-supported signal ([Yerushalmy-Feler 2022](https://consensus.app/papers/details/9258cfc4c7f85420a8ef673c1995fc7b/), paediatric), but the GTS 2 does not export it to Google Fit.                                                                                                                                                                                                                                                                                                                        |
| `Active_min > 100 cpm` | —                                                                                                                             | **No** | "Counts per minute" are research-actigraph units; Google Fit does not provide them.                                                                                                                                                                                                                                                                                                                                                                                                                                   |

The child side stays as it is: `belly-comfort`, `energy`, `play-pace` (0 to 2), and the parent log (`school`, `sleepHours`, `medicationTaken`). Each child item is analysed **on its own**; we do not add them into a "discomfort index" (§5).

Population caveat for the pitch: the wearable cohorts are adults; paediatric evidence is smaller (actigraphy, 25 youths aged 10–18: longer sleep onset went with next-day pain, [Szabo 2023](https://consensus.app/papers/details/f470f55df0ed5c489e669c4bf250ea90/)). We say "studied in adults; we describe, we do not predict".

## 4. The engine (`src/lib/wearables/`, pure TypeScript, no dependencies)

Ideas taken from Kinexis OS (`Kinexis.m`, `simulador_datos_EMG.m`) and kept as concepts, not numbers (EMG ran at about 2 kHz; this is one value per day):

| Kinexis (EMG)                                                                  | Here (daily series)                                                                                                                                                                                                                                                                                |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENAL_MIN`: no calibration if the signal is too weak.                         | **Valid-day rule.** A watch day counts for steps and resting HR only if it has heart-rate samples in at least 10 different waking hours (the usual 10-hour wear-time rule in accelerometry; needs all-day HR on in Zepp), and for sleep only if a sleep session exists. Otherwise it is `missing`. |
| Calibration phase: record the user's own maximum before acting (`MaximosEMG`). | **Baseline phase.** No deviation is shown until there are 14 valid days; until then the UI says "Collecting the first 14 days".                                                                                                                                                                    |
| Stateful IIR filters across windows (`filter(..., z)`).                        | Rolling windows computed over the full stored series, so a new sync never changes past values unless the source changed them.                                                                                                                                                                      |
| Hysteresis 70% to avoid flicker.                                               | Not needed: one value per day does not flicker.                                                                                                                                                                                                                                                    |
| `simulador_datos_EMG.m` to test without the device.                            | **Synthetic generator with a planted effect** to prove the engine (§6).                                                                                                                                                                                                                            |

Pipeline, per variable:

1. **No imputation.** A missing or invalid day stays `null` and is excluded from every window and every pair. (Juan's Stage 1 forward-filled with the 14-day median and interpolated steps: that creates data that was never measured, so it is removed.)
2. **Hampel filter** (kept from Juan's doc): window of 7 valid days centred, replace when `|x − median| > 3 × 1.4826 × MAD`. The report states how many points were replaced.
3. **Personal baseline:** rolling median and IQR of the previous 14 valid days (trailing, never centred, so a day is never compared with its own future).
4. **Robust deviation:** `(x − median₁₄) / (0.7413 × IQR₁₄)`. It is an internal number. **It is never shown as a score**; the UI only says "above / within / below the child's usual range".

## 5. Crossing the data, honestly

- **Pairs:** watch variable on day `t − lag` with child answer on day `t`, lag ∈ {0, 1, 2} days only (sleep of the night before, activity of the day before). Pairs where either side is missing are dropped; "I don't feel like it today" is missing, not zero.
- **Spearman's ρ** (ordinal answers, no normality assumed).
- **Minimum 14 valid pairs.** Below that, the engine returns `insufficient-data` and the UI says so. At n = 14, ρ must be above about 0.54 to reach p < 0.05; we show n next to every number so the reader can judge.
- **Multiple comparisons.** 3 watch variables × 3 child items × 3 lags = 27 tests. Significance comes from a **permutation test on the maximum |ρ| across all 27** (10,000 shuffles of the day labels, seeded so results are reproducible). That keeps the chance of any false alarm at 5% for the whole table, not per cell.
- **Bootstrap 95% interval** for every ρ that is shown (2,000 resamples, seeded).
- **Output in words, never as a cause or a forecast.** Example: "On 5 of the 7 days the child marked belly discomfort, the watch logged less sleep than usual the night before (n = 21 paired days)." No "lead warning", no "post-episode fatigue", no tiers.

Removed from Juan's document, with the reason:

| Removed                                                                    | Reason                                                                                                                                                                              |
| :------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Biometric Stability Index (0–100, weights 0.40 / 0.35 / 0.25, three tiers) | An invented index with uncited weights and clinical-looking tiers ("Active Vulnerability Window… flagged for clinical review"). Breaks `PRODUCT.md` §5.4 and §8 and `DECISIONS.md`. |
| Composite S(t) = belly + energy + play pace                                | Adding ordinal items invents a scale nobody validated.                                                                                                                              |
| "Lead Warning Indicator", "predict weeks before"                           | Predictions are out of scope; the 7-week finding is a 309-adult cohort with lab markers, not one child.                                                                             |
| Mechanism paragraphs (vagal pathway, tight junctions, myokines)            | Not needed to describe co-occurrence, and "supports gentle missions" reads as a treatment claim.                                                                                    |
| Citations "Kolovos 2022", "Geva 2020", "Ward 2020"                         | Not found in Consensus (220 M papers). Replaced by the verified sources in §3. Do not cite them in the pitch.                                                                       |

## 6. How we prove it to the jury (instead of "great correlations")

With one child and a few days of data, a strong ρ is noise. What we can prove is that **the engine is correct**:

1. **Planted-effect test.** The synthetic generator makes 60 days where sleep the night before lowers the next-day answer with a known strength, plus realistic gaps (15% missing days) and spikes. The test asserts the engine finds that lag and no other.
2. **Null test.** 1,000 generated datasets with no effect: the engine reports a significant result in at most about 5% of them (the false-alarm rate we promise).
3. **Gap test.** Data with gaps gives the same ρ as the same data with the gap days removed (proof that nothing is filled in).
4. **Unit tests** for Hampel, rolling median/IQR, Spearman with ties, permutation and bootstrap with fixed seeds.

All in Vitest, run by `pnpm check`. The demo shows the planted-effect result on screen with the **"Demo data"** label.

## 7. Tasks if approved

| Id  | Task                                                                                                                       | Folders                                                                          | Deps                  | Time   |
| :-- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------- | :-------------------- | :----- |
| W0  | Verify Google Fit access and the Zepp data sources (§2).                                                                   | none                                                                             | none                  | 20 min |
| W1  | `dsp.ts` (valid-day rule, Hampel, trailing median/IQR, robust deviation) + tests.                                          | `src/lib/wearables/`                                                             | none                  | 1.5 h  |
| W2  | `statistics.ts` (Spearman with ties, seeded permutation max-statistic, bootstrap) + synthetic generator + the tests in §6. | `src/lib/wearables/`                                                             | none                  | 2 h    |
| W3  | Google Fit client in the browser (token, daily aggregates, zod schema, store).                                             | `src/lib/wearables/`, `src/types/` (shared, Claude), `src/lib/storage/`          | none (GIS script tag) | 2 h    |
| W4  | Parent "Watch" card (connect, sync, last sync, source label) and the report section with the §5 sentences and n.           | `src/components/features/parent-mode/`, `src/components/features/doctor-report/` | none                  | 2 h    |

W1 and W2 do not depend on W0 and can start now. If W0 fails, W1, W2 and W4 still ship on demo data and on a later source.

## 8. Decisions Alberto needs to take

1. Approve the three rule changes in §1 (or not).
2. Approve "no crons for health data" (§2).
3. Approve removing the BSI and the other items in §5 from `BIOMEDICAL_ALGORITHMS.md`.
