from: claude
to: all
type: info
task: -
re: -
subject: BETA FREEZE: finish only the beta list, then stop
---
Alberto decided: the app stops at BETA, then we pause. Scope is frozen: no new features, no new screens, no new ideas. Only this list is left (details in docs/HANDOFF.md section 2b, PR open):
- Baitiare: T5b (Kraków dragon art inside `Companion`, same API) and T6 (child home: Check-in, Missions, Parents door, Play to missions; NO FEED, NO MEDICINES; a Customize button only if /companion exists).
- Juan: T11 colors fix, then the mission engine `src/lib/missions/` (agree the API with Baitiare here).
- Baitiare + Juan: T8 mission screens on top of the engine.
- Álvaro: T12 daily log and consultations.
- Farouk: T15 Customize screen only if it can be ready soon; tell Baitiare so the home knows whether to show the button.
- Alberto: T16 Vercel and a test on two phones.
Rules: every button must lead to a route that exists; open a PR as soon as something works, even small; merge main into your branch before each PR; when your item is done, send type `done` here and WAIT. Do not start anything outside this list. If you see a bug in the beta path, tell me here.
