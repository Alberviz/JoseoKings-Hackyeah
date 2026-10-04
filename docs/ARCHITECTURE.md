# Architecture

How the product in [`PRODUCT.md`](PRODUCT.md) is built. Rules for code style are in [`AGENTS.md`](../AGENTS.md). This file is the contract between tasks: if you need to change a type, a route or a folder owner listed here, ask Alberto or Claude first.

---

## 1. Shape of the app

- One Next.js 16 PWA. **No backend for check-ins, the parent log or the food diary.** Route handlers exist only if task W1 (watch data, section 8c) needs them, under `src/app/api/watch/`.
- One `AppState` object, stored in `localStorage` under one key, validated on every read.
- Two modes on the same device: **child mode** (default) and **parent mode** (PIN). At setup the device gets a role (child, parent or both); two phones can exchange data only through the family QR link (section 8b).
- Pure logic lives in `src/lib/<topic>/` (no React, unit-tested). UI lives in `src/components/features/<feature>/`. Static content (questions, missions, disclaimers) lives in `src/content/`.

```
              src/content/        src/types/
                   \                 /
                    v               v
 localStorage <-> src/lib/storage  (validate, migrate, backup)
                         |
                  useAppState hook  (src/hooks/)
                         |
   +---------+-----------+-------------+-------------+
   v         v           v             v             v
 child-    companion/  parent-mode/  patterns/   doctor-report/
 mode/     missions/   (PIN, logs)   (calendar,  (print view)
 (check-in)            |             charts)          ^
                       +---- src/lib/patterns, src/lib/report ----+
```

## 2. The data model

The types are in `src/types/` and are the contract. Summary:

| Type             | What it is                                                                                                                                                                                |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AppState`       | Everything. Has `schemaVersion`, `isDemo`, `child`, `settings`, `companion` and the lists.                                                                                                |
| `CheckIn`        | One per day. `answers` keyed by question id, `notToday`, optional `childNote`.                                                                                                            |
| `MissionLog`     | One per mission run. `status` (`completed` or `rest`), `company`, `confirmedBy`.                                                                                                          |
| `ParentLog`      | One per day. Sleep, activity, school, medication taken (yes/no only), note.                                                                                                               |
| `FoodEntry`      | Free text from a parent, optionally linked to a check-in.                                                                                                                                 |
| `Consultation`   | A date. The report covers the time since the previous consultation.                                                                                                                       |
| `CompanionState` | Points, team stars, badges. Only ever goes up.                                                                                                                                            |
| `EconomyState`   | Fire (0-100), coins, inventory, equipped wearables, rewards from home (`src/types/economy.ts`).                                                                                           |
| `WatchDay`       | One per day with watch data: steps, heart rate (min, average, max), sleep minutes by stage, `source`, `syncedAt` (task W1, `src/types/watch.ts`). Descriptive values only, never a score. |

Note on names: "wearables" in `EconomyState` are the dragon's accessories (glasses, t-shirt, hat). Data from a smartwatch is a different thing and is always called "watch data" (`WatchDay`).

Rules for the data:

- `WatchDay` data is **measured by the watch** and labelled so. Mission records (`MissionLog`) stay socially confirmed and are never presented as measured. Never merge the two into one number.
- Watch data is never an input of `src/lib/rewards/` or `src/lib/economy/`. A test proves it.
- A day without watch data has no `WatchDay`; it is shown as "No watch data yet". Never fill or interpolate.
- Dates are **local calendar days** as `"YYYY-MM-DD"` (`DateKey`). Never compare UTC timestamps for "the same day".
- IDs are `crypto.randomUUID()` (demo data uses fixed readable ids).
- Day arithmetic uses `src/lib/dates` (`todayKey`, `addDays`, `daysBetween`, `weekdayIndex`). Do not write your own date maths.
- Question, mission, item and badge ids are fixed in `src/config/content-ids.ts`. Content files and the demo data both use them.
- Never store drug names, doses, surnames, birth dates, addresses or any real identifier.
- Add a field only by changing `src/types`, bumping `schemaVersion` and adding a migration in `src/lib/storage`. Ask first.

## 3. Folders and owners

| Folder                                            | Owner                                 | Notes                                                                                                       |
| :------------------------------------------------ | :------------------------------------ | :---------------------------------------------------------------------------------------------------------- |
| `src/types/`, `src/config/`, `src/theme/`         | Alberto + Claude                      | Shared. Changes by request only.                                                                            |
| `src/components/ui/`, `src/components/providers/` | Alberto + Claude                      | Shared. Ask for a new primitive instead of building one.                                                    |
| `src/lib/storage/`, `src/hooks/useAppState.ts`    | Juan                                  | T1                                                                                                          |
| `src/lib/demo-data/`                              | Alberto                               | T2                                                                                                          |
| `src/lib/rewards/`, `src/lib/pin/`                | Alberto                               | T3                                                                                                          |
| `src/lib/patterns/`                               | Juan                                  | T9                                                                                                          |
| `src/lib/economy/`                                | Claude                                | V1. Coins, fire, shop, rewards from home                                                                    |
| `src/lib/link/`, `src/components/features/link/`  | Álvaro's AI                           | L1, L3. Family QR link                                                                                      |
| `src/lib/report/`                                 | Juan                                  | T11                                                                                                         |
| `src/lib/wearables/`, `src/app/api/watch/`        | Álvaro                                | W1. Google Health API client, mapping to `WatchDay`, sync. Route handlers only if the design needs a server |
| `src/components/features/parent-mode/WatchCard/`  | Álvaro                                | W1. Parent watch card (connect, consent, summary)                                                           |
| `src/content/`                                    | Farouk (with Álvaro)                  | T4. Typed data files, with sources in comments.                                                             |
| `src/components/features/companion/`              | Baitiare                              | T5                                                                                                          |
| `src/components/features/child-mode/`             | Baitiare (home) and Álvaro (check-in) | T6, T7                                                                                                      |
| `src/components/features/missions/`               | Baitiare                              | T8                                                                                                          |
| `src/components/features/parent-mode/`            | Álvaro                                | T10, T12, T13                                                                                               |
| `src/components/features/patterns/`               | Farouk                                | T14                                                                                                         |
| `src/components/features/doctor-report/`          | Juan                                  | T11                                                                                                         |
| `src/app/` (routes)                               | Whoever owns the feature screen       | `page.tsx` renders **one** screen. Routes are predefined below.                                             |
| `docs/`, `README.md`                              | Claudia (docs), Claude (rules)        | `AGENTS.md`, `PRODUCT.md`, `ARCHITECTURE.md` need Alberto's OK.                                             |

The restroom map and the menu reader were removed from the tree on 2026-10-03 (paused product). They are in git history if the team ever returns to them.

## 4. Routes

Defined in `src/config/app.ts` (`ROUTES`). Do not hard-code paths.

| Route              | Screen                                                              | Mode   |
| :----------------- | :------------------------------------------------------------------ | :----- |
| `/`                | Child home: companion, today's check-in, mission entry, parent door | child  |
| `/check-in`        | Check-in flow                                                       | child  |
| `/missions`        | Mission list (enabled missions only)                                | child  |
| `/missions/[id]`   | Guided mission, company choice, confirmation                        | child  |
| `/companion`       | Accessories, colours, badges                                        | child  |
| `/parent`          | PIN gate, then the summary card                                     | parent |
| `/parent/setup`    | First run: nickname, PIN, enabled missions                          | parent |
| `/parent/log`      | Daily log                                                           | parent |
| `/parent/foods`    | Reactive food diary                                                 | parent |
| `/parent/patterns` | Calendar and weekly charts                                          | parent |
| `/parent/report`   | Doctor report view and print                                        | parent |
| `/parent/settings` | Enabled missions, PIN, backup export and import, consultations      | parent |
| `/parent/link`     | Family link: show the pairing QR, scan the child's data QR          | parent |
| `/share`           | Child side of the link: scan the pairing QR, show the data QR       | child  |

The v2 child routes (Play flow, Shop, Food, Customize) are planned in `docs/V2-CHILD-PLAN.md` and will be added to `ROUTES` with it.

First run: if `AppState.child` is `null`, `/` redirects to `/parent/setup`.

## 5. State and access to it

- `src/lib/storage/` exports pure functions: `loadState()`, `saveState(state)`, `createEmptyState()`, `migrate(raw)`, `exportBackup(state)`, `importBackup(json)`. Validation with `zod` (dependency approved for T1). **A corrupt or unknown value never crashes the app**: it falls back to an empty state and keeps the raw value under a backup key.
- `src/hooks/useAppState.ts` exposes the state and **typed actions** (`addCheckIn`, `addMissionLog`, `saveParentLog`, `addFoodEntry`, `addConsultation`, `equipItem`, `setSettings`, `loadDemo`, `clearAll`). Components never touch `localStorage` directly.
- The provider is mounted once in `AppProviders`. Until it merges, build screens against the types and a local mock; do not wait.
- Parent mode unlock state lives **in memory only**, never in `localStorage`.

## 6. Parent PIN

- 4 digits. Hash with PBKDF2 (`crypto.subtle`) and a random salt, stored in `settings`.
- Lock after 5 wrong tries for 30 seconds. Auto-lock after 90 seconds without interaction. Lock when leaving parent mode.
- The PIN is a **barrier between two modes on a shared device**, like a kids profile. It is not protection against someone who can read the device storage. Say so plainly in docs and in the pitch; never call it "secure" or "encrypted".

## 7. Rewards

Two layers. Both follow `PRODUCT.md` section 5.2: the reward never depends on an answer or on the mission kind, nothing is punished.

### 7.1 Companion progress (existing)

Pure functions in `src/lib/rewards/`, with tests. The numbers are constants in one place so they are easy to tune. It stays for **badges and the companion**; wearables moved to the shop (7.2).

- Check-in answered: `+CHECK_IN_POINTS`. "Not today": `+NOT_TODAY_POINTS` (smaller). Mission `completed`: `+MISSION_POINTS`. Mission `rest`: `+REST_POINTS` (same as not today).
- **The reward never depends on the value of an answer or on the mission kind.** There is a test that proves it.
- A `completed` mission with `company` of `family` or `other` adds `+1` to `teamStars`. This never changes `points`. A `rest` session never gives a star.
- `syncCompanion(state)` recomputes points, stars and badges from the logs. It is monotonic (never takes anything away) and idempotent. **Call it after every check-in or mission is saved** (T1 does this inside the actions), so a check-in that is replaced the same day is never counted twice.
- `nextUnlock(companion, track)` feeds the progress bar. `confidenceLabel(company)` gives the neutral labels of `PRODUCT.md` section 5.3.
- "Care days" is the number of distinct days with a check-in or a rest or completed mission. It only goes up. Never expose a streak that resets.

### 7.2 Coins, fire and the shop (v2)

Pure functions in `src/lib/economy/`, constants in `src/config/economy.ts`, types in `src/types/economy.ts`. Plan: `docs/V2-CHILD-PLAN.md`.

- **Coins** are earned by the act: check-in 5, "not today" 3, mission completed 12, rest 6. Coins from the logs are derived (idempotent, like `syncCompanion`); spending is stored. Coins never go below zero.
- The coins buy **food and wearables** (glasses, t-shirt, hat) in the shop. This replaces the item unlocks by points of the old layer.
- **Fire** is 0 to 100. It is raised by feeding the dragon, never decays, and goes down only when the child chooses to spend it on a reward from home.
- **Rewards from home** are created by parents (name and fire price). A claim is a request the parents confirm when it happens. Parents cannot reject a claim or refund fire. Prices never depend on answers.

## 8. Mission flow

1. The child picks one of the missions in `settings.allowedMissionIds`.
2. The child chooses company: alone, with a parent or carer, or with someone else.
3. The companion guides the steps with a timer. The **Stop** button is always visible.
4. At the end:
   - alone: the child taps "I did it" (`confirmedBy: "child"`),
   - someone else: that person taps "Confirm" (`confirmedBy: "other-tap"`),
   - parent or carer: the parent enters the PIN (`confirmedBy: "parent-pin"`).
5. Stopping early saves a `rest` log. The completion button is not shown before the timer ends.
6. The reward and the confidence label come from `src/lib/rewards/` and the label mapping in `PRODUCT.md` section 5.3.

## 8b. Family link

In scope (it was a stretch goal). One PWA, no server. The pairing QR goes from the parent phone to the child phone, and the child's data goes back as an encrypted QR (AES-GCM). Code: `src/lib/link/` (pure, tested) and `src/components/features/link/`. Dependencies `qrcode` and `jsqr` are approved. Health data still never reaches a server.

## 8c. Watch data (W1)

Decided on 2026-10-04 (`docs/DECISIONS.md`); product rules in `PRODUCT.md` section 5.6.

**Source path** (proved with an Amazfit GTS 2): watch, Zepp app, Health Connect (Android), Google Health app, Google Health API v4 (`health.googleapis.com`, read-only scopes `googlehealth.activity_and_fitness`, `googlehealth.health_metrics_and_measurements`, `googlehealth.sleep`). Google Fit is not used. Health Connect on the device and CSV import may be added later under the same rules.

**Data flow, by design option.** Álvaro chooses between them in W1; the rules below hold for both.

```
Option A (default)                          Option B (only if needed)
parent phone --OAuth, read-only--> Google   Google --> server pipeline (EU) --> store
parent phone <-- JSON ------------ Health   parent phone <-- pseudonymous data -- store
       |                                            |
 src/lib/wearables  (map to WatchDay)         src/lib/wearables (same mapping)
       |                                            |
 localStorage (on the device)                 localStorage (on the device) + server copy
```

- **Option A:** the parent's device talks to the Google Health API and keeps `WatchDay` records on the device. No server.
- **Option B:** a server pipeline stores the data. It must use an EU region, pseudonymous ids (no names, emails or drug names), service-role access only, no analytics or third parties, and delete on request. Only watch data goes there. Check-ins, parent log, food diary and mission records are never sent unless Alberto approves it separately.
- **Secrets** (client secret, refresh tokens) live only in `.env.local` or the server environment, are listed by name in `.env.example`, and never reach the repo, issues, backups or client code. Backup export (`exportBackup`) never includes tokens.
- `src/lib/wearables/` is pure TypeScript with tests: request building, response validation with `zod`, mapping to `WatchDay`, and daily aggregation (totals, averages, ranges). Network calls are isolated behind one small function so they can be mocked.
- Validate every API response before trusting it. A failed or empty sync shows "No watch data yet", never a guessed value.
- The watch card (`parent-mode/WatchCard/`) and the report section render only descriptive values labelled "From the watch (Google Health)". The child interface never imports watch data.
- Disconnecting in parent mode removes the stored tokens and, on request, the stored watch data.

## 9. Doctor report

- `src/lib/report/buildReport(state, today)` returns a plain object (period, by default since the last consultation, and parents may choose From and To; day strip, counts, food entries on discomfort days, sleep and school summary, active days with confidence labels, and an optional watch section built from `WatchDay` records: totals, averages and ranges, labelled as measured by the watch, gaps shown as "No watch data yet"). It has tests.
- The view in `doctor-report/` renders it for A4 portrait and uses print CSS (`@media print`, `@page`) so that `window.print()` produces a clean page and "Save as PDF" works on the device. **No PDF library.**
- Test printing in desktop Chrome and on a real phone, including the installed PWA on iPhone, because `window.print()` may behave differently there. Log findings in `ERRORS.md`.

## 10. Demo data

- `src/lib/demo-data/buildDemoState()` returns a complete `AppState` with `isDemo: true`: about 90 days, two consultations, one flare and its recovery, plausible sleep and school, no drug names. Deterministic (seeded), so the demo is repeatable.
- The "Load demo" and "Clear data" actions live in parent settings. When `isDemo` is true, every screen shows a visible "Demo data" label.

## 11. Companion drawing

- One SVG, animated with CSS keyframes inside styled-components. No Lottie, no canvas, no animation library.
- States: idle, breathe, stretch, balance, strength (one pose per `poseKey` used by missions), cheer.
- It never shows a sad, sick or disappointed pose.

## 12. Dependencies

Approved for the project: `zod` (T1), `qrcode` and `jsqr` (family link). W1 (watch data) may need an OAuth or server helper; Álvaro proposes it in the W1 issue and Alberto approves it before it is added. Anything else needs approval, as in `AGENTS.md`. No charting library (charts are small SVG components), no PDF library, no animation library, no Tailwind.

## 13. Content files (`src/content/`)

Typed data, written by the biomedical team, English only:

- `check-in-questions.ts` → `CheckInQuestion[]`.
- `missions.ts` → `Mission[]`. Gentle, no impact, no jumping.
- `disclaimers.ts` → the report and patterns disclaimers.

Each item names its source in a comment. If there is no source, write `// source: to verify` and the item is not shown in the demo until verified.

## 14. Testing

- Vitest next to the code. Required for everything in `src/lib/`.
- `pnpm check` before every push. Test at 360 px wide.
- Before the demo: the full flow on two real phones, offline after one online visit, and the print view.
