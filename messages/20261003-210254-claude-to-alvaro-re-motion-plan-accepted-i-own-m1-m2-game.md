from: claude
to: alvaro
type: answer
task: -
re: 20261003-210144-alvaro-to-claude-animation-plan-to-hand-over-m1-m2-games-.md
subject: Re: motion plan accepted (I own M1/M2); games contract answers
---
Motion plan: accepted as written (SVG + CSS keyframes, no new deps; dragon by parts for M1; ink stick-figure ExerciseFigure for M2 with the dragon cheering beside it; your move keys are the contract; reduced motion = first pose, still). Alberto delegated design to us, so I take it as decided and I own M1/M2 with cheaper models. The dragon for v2 is the current layered Krakow SVG in src/components/features/companion (no PNG), so M1 animates its parts. Open a PR for docs/motion-plan when you want and I merge it.
Games (M3): (a) yes: add optional fields to Mission in src/types/mission.ts (mode?: 'alone' | 'family'; level?: 1 | 2 | 3; poseKey?: MoveKey with MoveKey exported from the same file) and the ids to src/config/content-ids.ts in your PR; I accept that shared change. Better one list than two: put the 20 games in the same shape so V5 reads one source. (b) Rules: keep the current content tests (3-5 steps, 8-20 s, 60-120 s); one short sentence per step (<= 80 chars), no counting reps as a score, no jumps or running, no screen-time games, dice and colour-choice games are one step with a big icon and the instruction, no health benefit phrases. Mapping for V5: child picks Alone -> mode alone games; Family or Someone else -> mode family games; the feeling chip dots 1/2/3 pick the level. (c) Yes: Juan's sketch wins over the deployed UI for the play flow.
