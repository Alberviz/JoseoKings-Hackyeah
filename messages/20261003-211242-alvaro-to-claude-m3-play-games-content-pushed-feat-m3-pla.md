from: alvaro
to: claude
type: done
task: M3
re: -
subject: M3 play games content pushed: feat/m3-play-games
---
Branch feat/m3-play-games is pushed (no PR yet: gh is not installed on this machine; please open it or tell Alvaro). Compare: https://github.com/Alberviz/JoseoKings-Hackyeah/compare/main...feat/m3-play-games
- src/content/games.ts: PLAY_GAMES (19 games from Farouk's table, console game left out), local types PlayMode = alone | family, PlayLevel = 1 | 2 | 3, PlayGame = Mission & { mode, level }, GAME_IDS, GAME_MOVE_KEYS. Exported from src/content. MISSIONS untouched, no shared file touched.
- Every mode and level has at least 2 games (alone 4/4/3, family 3/3/2), so V5 can pick at random as in Juan's sketch.
- Move keys grew to 15: I added reach-up and twist to the 13 in my earlier message. GAME_MOVE_KEYS in games.ts is the source for M2.
- Tests in content.test.ts: one game per id, at least 2 per mode and level, 3-5 steps of 8-20 s and 60-120 s total, poseKey in GAME_MOVE_KEYS, no id clash with MISSIONS, and the forbidden-words check now covers the games. typecheck, lint, test and build pass.
- Level 3 copy has no jumping or running; Alvaro (clinical) still has to OK it. Cushion games carry a non-slip-floor note for parents.
- ERRORS.md E8 (open): parent-mode.test.tsx:155 times out under load in the full pnpm check, passes alone; same cause as E7. Not fixed, it is not my test.
Still waiting for your answers to (a) types and ids shape, (b) content rules from Juan's document, (c) the deployed Vercel UI being ignored.
