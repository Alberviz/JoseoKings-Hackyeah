# ERRORS.md

Shared log of errors found while building the app: what broke, why, and how it was fixed.
**Every agent and every human adds an entry here** when they hit an error that took more than 10 minutes, could happen again, or affects someone else.

Before debugging something, search this file first: it may already be solved.

## Rules

- **Append only.** Add new entries at the **end** of the file. Never edit or delete someone else's entry; if it is wrong or outdated, add a new entry that references it.
- Commit the entry **in the same PR** as the fix (or in the PR where you found it, if it is not fixed yet).
- English only. No API keys, tokens or personal data in logs you paste.
- Unfixed errors use status `open`. When someone fixes one, they add a new entry with status `fixed` and `Refs: E<n>`.
- Number entries in order (`E1`, `E2`...). If two PRs pick the same number, the second one to merge renumbers.

## Template

```md
### E<n> · <short title>

- **Date:** YYYY-MM-DD HH:MM
- **Who:** <name> (<tool: Claude / Gemini / Antigravity / human>)
- **Task:** T<n> or "setup"
- **Status:** open | fixed | workaround
- **Symptom:** exact error message or behaviour
- **Cause:** why it happened (or "unknown")
- **Fix:** what solved it, with file paths
- **Refs:** related entries, PR or issue numbers
```

---

## Log

### E1 · pnpm 11 ignores dependency build scripts

- **Date:** 2026-10-03 11:30
- **Who:** Alberto (Claude)
- **Task:** setup
- **Status:** fixed
- **Symptom:** `ERR_PNPM_IGNORED_BUILDS: Ignored build scripts: @swc/core, esbuild`
- **Cause:** pnpm 11 does not run dependency install scripts unless they are approved.
- **Fix:** `allowBuilds` in `pnpm-workspace.yaml` sets `esbuild: true` and `"@swc/core": true` (Serwist needs them to bundle the service worker). Do not run `pnpm approve-builds` with other packages without approval.
- **Refs:** -

### E2 · `Cannot find name 'LayoutProps'` when running `tsc`

- **Date:** 2026-10-03 11:32
- **Who:** Alberto (Claude)
- **Task:** setup
- **Status:** fixed
- **Symptom:** `src/app/layout.tsx: error TS2304: Cannot find name 'LayoutProps'.`
- **Cause:** Next.js 16 generates route types (`LayoutProps`, `PageProps`) into `.next/types`; a clean `tsc` does not have them.
- **Fix:** always use `pnpm typecheck`, which runs `next typegen && tsc --noEmit`. Never call `tsc` directly.
- **Refs:** -

### E3 · `next dev` modifies `AGENTS.md`

- **Date:** 2026-10-03 11:35
- **Who:** Alberto (Claude)
- **Task:** setup
- **Status:** fixed
- **Symptom:** `AGENTS.md` shows as modified after running `pnpm dev`.
- **Cause:** Next.js 16 inserts a `nextjs-agent-rules` block into `AGENTS.md` if it is missing.
- **Fix:** the block is already at the top of `AGENTS.md`. Do not remove it.
- **Refs:** -

### E4 · Service worker not registered in development

- **Date:** 2026-10-03 11:40
- **Who:** Alberto (Claude)
- **Task:** setup
- **Status:** workaround
- **Symptom:** offline mode does not work with `pnpm dev`.
- **Cause:** expected: the service worker is only built for production.
- **Fix:** test offline with `pnpm build && pnpm start`. On a phone it also needs HTTPS (use the Vercel preview URL).
- **Refs:** T10

### E5 · `crypto.subtle` is undefined when testing on a phone over local Wi-Fi

- **Date:** 2026-10-03 17:05
- **Who:** Alberto (Claude, from a Gemini review)
- **Task:** T3, T10, T16
- **Status:** open
- **Symptom:** creating or checking the parent PIN fails on a phone that opens `http://192.168.x.x:3000`. `createPinRecord` and `verifyPin` need `crypto.subtle`.
- **Cause:** `crypto.subtle` only exists in a secure context (HTTPS or `localhost`). Plain HTTP on the local network is not secure. Unverified on a real device: to confirm.
- **Fix:** test on phones with the Vercel HTTPS URL (production or preview), or with USB port forwarding (`adb reverse tcp:3000 tcp:3000`, then open `localhost:3000` on the phone). The PIN screens should show a clear message if `crypto.subtle` is missing instead of crashing.
- **Refs:** E4, T16

### E6 · A4 print media verification and narrow viewport table handling

- **Date:** 2026-10-03 18:20
- **Who:** Juan (Antigravity)
- **Task:** T11
- **Status:** fixed
- **Symptom:** On narrow mobile viewports (< 400px), tables require horizontal scrolling on screen, which could clip content if printed without `@media print` overrides.
- **Cause:** Table columns exceed 390px on small screens.
- **Fix:** `DoctorReportView.style.ts` uses `@media print` with `@page { size: A4 portrait; margin: 10mm; }`, disables container clipping (`overflow-x: visible !important`), hides action buttons via `.no-print`, and adopts `theme.colors.*` design tokens. Tested real printing on desktop Chrome and phone-sized viewport (emulated 390x844; real physical phone test remains for Alberto in T16).
- **Refs:** T11, T16

### E7 · Missions test fails at random in CI: "expected [] to have a length of 1"

- **Date:** 2026-10-03 22:40
- **Who:** Alberto (Claude, fix by a Gemini agent)
- **Task:** T8
- **Status:** fixed
- **Symptom:** `family mission rejects wrong PIN and accepts correct PIN to save log once` passes locally and sometimes fails in GitHub Actions.
- **Cause:** the mission log is saved in a `useEffect` after the "Nice work!" text appears, and the PIN check (PBKDF2) is slow on CI runners. The test read `localStorage` right after the text appeared, before the effect ran.
- **Fix:** wait for the saved log with `waitFor` (timeout 5 s) and give the PIN `findByText` calls a 5 s timeout. The test still checks wrong PIN rejected, correct PIN accepted and the log saved exactly once. Rule for new tests: after an async PIN check, never read storage synchronously; wait for it.
- **Refs:** T8

### E8 · Parent PIN gate test times out when the machine is busy

- **Date:** 2026-10-03 23:07
- **Who:** Álvaro (Claude in Cursor), fixed by Alberto (Antigravity)
- **Task:** M3 / feat/device-role-setup
- **Status:** fixed
- **Symptom:** `src/components/features/parent-mode/parent-mode.test.tsx:155`: `expect(mockPush).toHaveBeenCalledWith(ROUTES.parent)` fails inside `waitFor` during the full `pnpm check`. The same file passes when run alone. In a second full run, `DailyLog/DailyLogScreen.test.tsx` "saves a daily log and a consultation date" failed the same way and passed alone.
- **Cause:** same as E7: the PIN check (PBKDF2) is slow under load and `waitFor` uses the default 1 s timeout.
- **Fix:** applied 5 s timeout (`{ timeout: 5000 }`) to `waitFor` in `parent-mode.test.tsx` and `DailyLog/DailyLogScreen.test.tsx`.
- **Refs:** E7, T10

### E9 · `comms-local is already used by worktree` when running comms.sh

- **Date:** 2026-10-03 23:50
- **Who:** Alberto (Antigravity)
- **Task:** comms
- **Status:** fixed
- **Symptom:** `fatal: 'comms-local' is already used by worktree at '/tmp/claude-1000/...'` and `comms: cannot create /home/alberviz/JoseoKings-Hackyeah/.comms`.
- **Cause:** `scripts/comms.sh` created its worktree with a fixed branch name (`-B comms-local`). When an agent or user had another worktree open with that branch checked out, Git refused to attach the same branch to `.comms`.
- **Fix:** `scripts/comms.sh` now attaches the worktree in detached HEAD state (`git worktree add -q --detach "$DIR" "origin/$BRANCH"`) and pushes commits via `HEAD:$BRANCH`. Detached HEAD allows multiple concurrent worktrees without local branch name collisions.
- **Refs:** -

### E10 · Comms channel migrated from Git branch to GitHub Issues inboxes

- **Date:** 2026-10-04 00:14
- **Who:** Alberto (Antigravity)
- **Task:** comms
- **Status:** fixed
- **Symptom:** High token consumption, context bloat (Claude ran out of tokens earlier), 118+ git commits polluting remote objects, and worktree collisions.
- **Cause:** Using a git branch (`comms`) with 1 commit per message and verbose text cards created repo overhead and filled agent context buffers.
- **Fix:** Replaced Git branch backend in `scripts/comms.sh` with GitHub Issues personal inboxes (#70-#75) and broadcast (#76). Reading inboxes consumes < 50 tokens with zero git commits.
- **Refs:** E9

### E11 · Google Health API 400s: interval filter on heart rate, `dataSourceFamily` on sleep

- **Date:** 2026-10-04 07:10
- **Who:** Claude (Claude Code)
- **Task:** W1
- **Status:** fixed
- **Symptom:** `GET .../dataTypes/heart-rate/dataPoints?filter=heart_rate.interval.start_time...` returned 400, and requests with `dataSourceFamily=users/me/dataSourceFamilies/all-sources` returned 400 for sleep. Heart rate and sleep came back empty, so `restingHr` and `sleepMinutes` stayed null.
- **Cause:** heart rate is a sample type, so it is filtered by `heart_rate.sample_time.physical_time`, not by an interval. `dataSourceFamily` is not needed (the default is all sources) and is invalid for sleep. The code also read a non-existent `device.displayName`, so devices could not be told apart.
- **Fix:** `src/lib/wearables/browserGoogleHealth.ts` filters heart rate by `heart_rate.sample_time.physical_time` from the first call and never sends `dataSourceFamily`; `googleHealthV4.ts` uses the real `dataSource` fields; Google's error reason and message now reach the watch card. Reference in `docs/WEARABLES_INTEGRATION.md`.
- **Refs:** W1
