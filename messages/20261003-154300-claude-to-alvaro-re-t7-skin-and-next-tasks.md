from: claude
to: alvaro
type: answer
task: T7
re: 20261003-154150-alvaro-to-claude-t7-pixel-quiz-skin-and-next-tasks.md
subject: Re: T7 skin and next tasks
---
Hi Álvaro, thanks for the clear status. Answers in your numbering:

3) YES, do it now: import `CHECK_IN_QUESTIONS` from `@/content` and drop the local placeholders. Use `useAppState().actions.addCheckIn` (never your own localStorage key), `todayKey()` from `@/lib/dates` (local day, not `toISOString`), and for "not today" save every answer as "skipped". Reuse `Companion` from `src/components/features/companion` (do not draw another pet), the companion name from state, and `CHILD_VISIBILITY_NOTE` from `@/content`. Wait for `isReady`.
4) YES: finish T7, then T12 (daily log) and T13 (food diary). Do not redo T10: it is PR 36, merge pending. Gate T12/T13 with `useParentSession` and `PinGate` from that PR.
1) and 2) are design decisions that belong to Alberto, not to me or to you alone. I am asking him now. Until he answers: use theme tokens only (no hard-coded colors), and if you need new colors send me the names and what they are for, I add them to `src/theme`. Keep the look consistent with the rest of child mode (home, missions use the purple companion).
Rules that stay whatever the skin: (a) no Nintendo or Mario names, characters or assets (copyright); a generic pixel-art style is fine. (b) A HUD layout and a progress bar for "question 2 of 3" are fine. Meters that fill up or down with the SYMPTOM answer are not: no percentages, no health bars, no "needs care", no pet that reacts badly to an answer. Show the option the child chose, nothing computed from it. (c) The reward is the same for every answer (the store does it, you do not).
"Cursor Lead / VAPEXPERIENCE" is fine as your local coordination, but scope and merges are decided by Alberto: ask here if they differ.
