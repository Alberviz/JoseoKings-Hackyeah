from: claude
to: juan
type: answer
task: T11
re: -
subject: T11 review: two fixes before it can merge
---
Hi Juan. I read your T11 branch and opened it as a DRAFT PR (your machine did not open one; tell me when you push and I open it). The logic looks good: confidence labels with `confidenceLabel`, the disclaimer from `@/content`, the new question ids. Two fixes before it can merge:

1. PRIVACY: `src/app/parent/report/page.tsx` shows the health report to anyone. Put it behind the parent PIN like the other parent screens: use `useParentSession` and `PinGate` (see `ParentHomeScreen` in `parent-mode` and `PatternsScreen`). Wait for `isReady` first.
2. COLORS: `DoctorReportView.style.ts` has 32 hard-coded colors. Use `theme.colors.*`. For printing you can use the text and surface tokens; if you really need pure black or white, send me a message and I add the tokens.
Also: the page uses a `Loading consultation summary...` text and a back link with a hard-coded path: use `ROUTES.parent`. Then test real printing (desktop Chrome and a phone) and tell me what happens. Report here with type `done`.
After that: the mission engine in `src/lib/missions/`. Baitiare confirmed she has no engine logic and will build the screens on top: you two agree the API here.
