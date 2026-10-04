# MyCrohnie

**A Progressive Web App for families with a child aged 8 to 12 who has inflammatory bowel disease (Crohn's disease or ulcerative colitis).** The child plays with a companion and tells how they feel without being questioned; parents and the doctor get that information in an organised, honest form.

- **Live demo:** https://mycrohnie.vercel.app (open it on a phone, or a desktop browser at phone width)
- **Event:** HackYeah 2026, Kraków, category **Sport & Healthcare**
- **Team:** JoseoKings

## How to try it in 2 minutes

No account and no setup needed: sample data is built in.

1. Open https://mycrohnie.vercel.app. On the first visit the app opens the **Parent mode setup**. Tap **Quick Start: Load demo data & explore**. This loads 90 days of fictional data, clearly labelled "Demo data". The demo PIN is `1234`.
2. **Child mode** (the home screen): tap **How are you today?** to answer the daily check-in with drawings (or "not today"). Then tap **PLAY** to do a short, gentle exercise with the dragon companion and open the reward chest.
3. **Parent mode**: tap the padlock at the top right of the home screen and enter the PIN `1234`. Browse **Summary**, **Log**, **Food**, **Patterns** and **Report**.
4. **Doctor report**: open **Report**, then tap **Save as PDF / Print** for a one-page summary since the last consultation.

You can also create your own profile and PIN with **Complete setup** instead of the demo. To remove everything, use **Clear all data** in parent Settings (the gear icon).

## Features

**Child mode**

- Daily check-in made of drawings, with almost no text. "Not today" is always an option.
- A dragon companion and short guided movement games, alone or with family. No impact exercise.
- Coins and rewards for showing up, never for what was answered. No streaks, no punishment, and the dragon is never sad.

**Parent mode (behind a PIN, optional Face ID / fingerprint)**

- Summary of what the child marked, a daily log, and a reactive food diary.
- Patterns: a colour calendar and weekly charts.
- Family rewards that parents create and confirm.
- Backup export and import, consultations, and a demo data loader.

**Doctor report**

- One page since the last consultation, printable or saved as PDF on the device (browser print, no PDF library).

**Optional wearable (Google Health)**

- After the parent connects their Google account and gives consent, read-only data from the child's wearable (steps, heart rate, sleep) shows in parent mode and in the report, labelled "From the wearable (Google Health)". Gaps show "No wearable data yet".
- Connecting a real wearable needs a Google test account added by the team (the OAuth app is in testing mode). Judges can use the demo data instead, which includes labelled demo wearable data.
- The child never sees these numbers. They never change rewards.

## Privacy and safety

- **Health data stays on the device.** Check-ins, mission records, the parent log, the food diary and wearable data are stored in the browser's `localStorage`. No accounts, no analytics, no third parties.
- **No medical advice.** The app records and summarises what the family entered and what the wearable measured. It does not diagnose, predict, score or suggest treatment, and it never says why something happened.
- **Rewards never depend on answers**, on the kind of activity or on wearable data.
- **Honest data.** Activity done in games is never presented as measured. Demo data is always labelled "Demo data".
- No drug names, doses or personal identifiers in the code, the demo data or the UI.
- Accessibility: touch targets of at least 48 px, visible focus, labels on every control, readable at 360 px wide, works offline after the first visit.

## Tech stack

| Concern         | Choice                                                                  |
| :-------------- | :---------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack), React 19, TypeScript strict         |
| Styling         | styled-components 6, design tokens in `src/theme/theme.ts`              |
| PWA / offline   | Serwist service worker, web app manifest                                |
| Validation      | zod for everything read from `localStorage`                             |
| Storage         | `localStorage` through typed helpers in `src/lib/storage`               |
| Report          | Browser print with print CSS                                            |
| Wearable        | Google Health API, read-only, called from the parent's browser          |
| Tests           | Vitest + Testing Library                                                |
| Quality gate    | ESLint, Prettier, TypeScript, Husky pre-commit hooks, GitHub Actions CI |
| Package manager | pnpm                                                                    |
| Hosting         | Vercel                                                                  |

AI tools (Claude Code, Gemini CLI, Antigravity) were used to build this project, under the rules in [`AGENTS.md`](AGENTS.md).

## Quick start

Requirements: Node 20.9 or newer (22 recommended) and pnpm.

```sh
pnpm install
cp .env.example .env.local   # optional: the app needs no keys to run
pnpm dev                     # http://localhost:3000
pnpm check                   # typecheck + lint + test + build
```

The service worker is only registered in production builds: run `pnpm build && pnpm start` to test offline.

## Project structure

```
src/
  app/                  # routes only (/, /check-in, /play, /shop, /food, /customize, /parent/...)
  components/
    ui/                 # shared primitives
    features/           # child-mode, companion, missions, parent-mode, patterns, doctor-report
  lib/                  # pure, unit-tested logic: storage, economy, rewards, pin, patterns, report, wearables, demo-data
  content/              # check-in questions, games and disclaimers
  hooks/ types/ config/ theme/
docs/                   # product, architecture, decisions, tasks
```

Every component is a `.tsx` file made only of components, plus a sibling `.style.ts` with its styled-components.

## Docs

- Rules and workflow (humans and AI agents): [`AGENTS.md`](AGENTS.md)
- Product definition: [`docs/PRODUCT.md`](docs/PRODUCT.md)
- Architecture and data model: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Wearable integration: [`docs/WEARABLES_INTEGRATION.md`](docs/WEARABLES_INTEGRATION.md)
- Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md) · Tasks: [`docs/TASKS.md`](docs/TASKS.md) · Team: [`docs/TEAM.md`](docs/TEAM.md)
- Known errors and fixes: [`ERRORS.md`](ERRORS.md)
