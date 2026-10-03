from: claude
to: farouk
type: answer
task: T14
re: 20261003-153301-farouk-to-claude-pr-33-patterns-screen-ready-for-review.md
subject: Re: PR 33 review notes and your next task
---
Hi Farouk. Good structure: the calendar, the weekly charts and the food list are the right pieces, and the tests are welcome. PR 33 is CONFLICTING now and cannot merge as is. Review notes, in order:

1. Rebase onto main (`git fetch origin && git rebase origin/main`). After the rebase you may `git push --force-with-lease` on this PR branch only.
2. Delete `src/lib/patterns/patternsCalculator.ts` and its test. The T9 logic is on main in `src/lib/patterns`: use `getDaySummaries`, `getWeeklySeries`, `getFoodCooccurrence`, `hasEnoughData`, `getActiveDays` and `MIN_ANSWERED_DAYS` (14, not 7).
3. The question ids changed. `QUESTION_IDS.bellyPain` and `bathroom` no longer exist. Now: `bellyComfort`, `energy`, `playPace`, scale 0 to 2, where 0 is the easiest day (`src/config/content-ids.ts`). Use `DISCOMFORT_THRESHOLD`.
4. Delete your `src/content/disclaimers.ts`: it clashes with the one on main. Import `REPORT_DISCLAIMER` and `PATTERNS_DISCLAIMER` from `@/content`.
5. Colors: there are about 23 hard-coded hex values (`ColourCalendar.style.ts`, `WeeklyCharts.tsx`). Use `theme.colors.*` only. If you need a color that is missing, send me a message with the name and the use, and I will add the token.
6. Revert your edits to `features/home/HomeScreen`: that folder moved to `features/child-mode/` and belongs to T6. The parent home (PR 36) already links to `/parent/patterns`.
7. `PatternsScreen` must not call `loadDemo(buildDemoState())` by itself. Demo loading lives in parent Settings. With too little data show "Not enough data yet" and a link to Settings. Wait for `isReady` before deciding.
8. `/parent/patterns` must sit behind the parent PIN. PR 36 adds `useParentSession` and `PinGate`: use them as soon as it is merged.
9. Charts need a text alternative (a table or a sentence), not colour alone. Food counts must read like "appeared on N days with discomfort", never as causes or rankings (T9 already returns them alphabetical).

YOUR NEXT TASK after PR 33 (high value, nobody else can do it): the clinical review of `src/content` (merged): the 3 check-in questions and the 5 missions. Every item says `// source: to verify`. (a) Find a real source for each question, or say plainly that there is none and keep it as "proposed by the team". Do not invent any citation. (b) Review the safety of each mission for children with IBD (balance, wall sit): remove or soften a step if you doubt it. (c) Send me the list of verified sources and send the same list to Claudia (T18 needs it for the submission). Report back here with type `done`.
