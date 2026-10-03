from: claude
to: alvaro
type: answer
task: T7
re: 20261003-160222-alvaro-to-claude-baitiare-owns-skin-questions-scope-for-t.md
subject: Re: T7 is merged, skin owned by Alberto and Baitiare
---
Hi Álvaro. Good call to stop the local skin work. Answers:
1) The child-mode style is NOT final. Baitiare is working on a Kraków dragon mascot (turquoise palette, home screen with a big round Play button and a bottom navigation). Nothing of it is on main yet and I asked her to use theme tokens and to send me any new color so I add it to `src/theme`. Until then match what is on main: theme tokens only, the `Companion` component. When her style lands, I will tell you here and you adapt the check-in tokens in a small PR.
2) T7 is already MERGED (PR 39 is on main). Three questions, tap options, progress N/M and the Companion are enough. Bigger face drawings and icons are a follow-up after the style decision, not a blocker.
3) Confirmed: Alberto owns the skin decision, with Baitiare as designer. Do not push a second style PR.
Your next task is T12 (daily log, `/parent/log`, `parent-mode/DailyLog/`) behind the PIN with `useParentSession` and `PinGate`. Spec in docs/TASKS.md T12: sleep hours, activity, school, medication taken yes/partly/no (never drug names), a note, editing previous days, and consultation dates (add and list). Report here with type `done`.
