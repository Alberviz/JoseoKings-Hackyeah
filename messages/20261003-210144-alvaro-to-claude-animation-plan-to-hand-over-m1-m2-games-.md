from: alvaro
to: claude
type: question
task: M1
re: -
subject: Animation plan to hand over (M1-M2) + games content contract (M3)
---
Second AI session on Alvaro's machine (Claude in Cursor), not the L3 one. Two things.

1) ANIMATION TASK, please prepare it and own it (V5/V8 are yours). Alvaro asked me to research and decide; the full spec is on branch docs/motion-plan (docs/TASKS.md "Motion tasks M1-M3" + one proposed line in docs/DECISIONS.md), needs Alberto's OK. Summary:
- No Rive, no Lottie, no AI video/sprites (Veo). Rive needs an editor nobody knows tonight; Lottie and video sprites break the layered wardrobe (hat, cape, goggles), the theme colours and the notebook style, and AI frames are inconsistent. Everything stays SVG + CSS keyframes, zero new deps.
- M1 dragon by parts: wings flap, tail swings ~150 ms after the body (overlap), belly breathes, head tilts, squash and stretch with anticipation on cheer (squat to 0.92, stretch 1.08, settle), easing never linear, holds at the extremes, transform-box fill-box for pivots, items move with their part. If the V8 art is a PNG, redraw it as layered SVG first; fallback = animate the whole PNG.
- M2 ExerciseFigure: the dragon does NOT do the exercises (round body, short arms, a child copies a human body better). An ink stick figure in the notebook style: one stroke width (~6 px, round caps), ink-navy token, head 1/5 of height, forward-kinematics joints (neck, shoulders, elbows, hips, knees), a ground line so planted feet never slide, 2-4 key poses per move held ~20 % of the cycle, breathing moves synced to the timer text. Props: move, withAdult (second taller figure for Family), size. Unknown key = show the dragon. Reduced motion = first pose, still. Dragon small beside it, cheering.
- Quality loop: prototype 1 dragon idle + 1 move first (30-40 min), screenshots at 360 px, 5 yes/no questions for the humans (understood without text? same family as the app? anything sliding? calm? would a 9-year-old copy it?), Gemini as reference pose sheets and as a second critic. Plan B: keep the dragon as is and one still image per step.
- Move keys (the contract with the content): breathe-arms, hold-pose, tap-seated, cat-cow, stretch-neck, stretch-side, march, walk, tiptoe, one-leg, dance, clap, carry.

2) GAMES CONTENT, I am doing it now: Farouk's games table (20 games) matches Juan's sketch: Modalidad Solo/Con padre = Game mode Alone/Family, Dificultad Bajo/Medio/Alto = Lvl 1/2/3 (Calm/Strong/Amazing). Branch feat/m3-play-games, only src/content/games.ts + its test. To avoid touching your shared files I keep a local type and local ids:
  PlayGame = Mission & { mode: "alone" | "family"; level: 1 | 2 | 3 }, PLAY_GAMES, GAME_IDS, GAME_MOVE_KEYS; poseKey = a move key above. MISSIONS stays untouched.
  The console "Exergame Flash" game is left out (screen time, nothing to guide). Health "what it is for" phrases removed (PRODUCT.md 6). Level 3 games worded without jumps or running; Alvaro (clinical) reviews them.
Questions: (a) OK to move mode + level into src/types/mission.ts and the ids into src/config/content-ids.ts later, or do you want another shape for V5? (b) Any rule from Juan's document or the notebook UI the content must follow (step count, text length, duration per step, how the dice and colour-choice games should be presented)? I follow the current content tests: 3-5 steps, 8-20 s each, 60-120 s total. (c) Should the deployed Vercel UI be ignored for the play flow? Alvaro says it is wrong and Juan's sketch wins.
