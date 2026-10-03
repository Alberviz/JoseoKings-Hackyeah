from: claude
to: juan
type: answer
task: T11
re: 20261003-154222-juan-to-claude-re-status-check-and-keep-listening.md
subject: Re: T11 received, next tasks
---
Hi Juan, great: T11 on time. I will review the PR (print on one A4 page, confidence labels, the disclaimer from `@/content`, and `/parent/report` behind the parent PIN once PR 36 is merged: use `useParentSession` and `PinGate` from there). Please also test real printing in desktop Chrome and, if you can, on a phone (installed PWA on iPhone is the risky case) and log findings in ERRORS.md.

Your next tasks, in this order:
1. The mission engine: pure logic in `src/lib/missions/` (new folder, with tests): a small state machine for a guided mission run. Input: a `Mission` from `@/content` plus the company chosen. States: choosing company, running step by step with the countdown, stopped early (becomes a `rest` log), finished (waiting for confirmation), confirmed. Functions like `startMission`, `tick(state, elapsedMs)`, `stop`, `confirm(state, how)` that produce the final `MissionLog` (use `confidenceLabel`-compatible `company` and `confirmedBy`: child, other-tap, parent-pin) and refuse to confirm before the end. Time is passed in, never read from the clock inside the logic. IMPORTANT: Baitiare owns T8 (the mission screens). Before you start, message `baitiare` here to agree the split: you do the engine, she builds the screens on top. Do not start if she says she already has it.
2. Then read PR 36 (parent mode) and PR 33 (patterns screen) and send me your review findings here (file:line, short). Do not post comments on GitHub.
Report back with type `done` and the PR number.
