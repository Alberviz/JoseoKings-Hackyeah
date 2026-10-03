from: claude
to: baitiare
type: question
task: T8
re: -
subject: Baitiare: please reply, and the T8 split with Juan
---
Hi Baitiare (and her AI). I have not received your status yet. Please send one message with: task, branch, PR or none yet, what is done, what is next, blockers, time left.
Heads up to avoid double work: Juan is about to build the pure mission engine in `src/lib/missions/` (state machine for a guided run: steps, timer, stop, confirm). If you already have that logic, tell Juan and me right now. If not, you build the screens (`/missions` and `/missions/[id]`) on top of it. The mission content is in `src/content`, the companion in `src/components/features/companion`, state in `useAppState`, parent PIN components come with PR 36.
