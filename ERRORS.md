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
