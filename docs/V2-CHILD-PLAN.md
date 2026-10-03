# Child mode v2: plan

Status: **draft for Alberto's OK** (2026-10-03). Owner: Claude (lead) with Fable 5.1 (Álvaro's AI). This plan replaces the "beta frozen" rule of `HANDOFF.md` section 2b for the child interface only. Parent mode and the doctor report stay as they are.

## 1. Goal

Build the whole child interface drawn by Juan (sketch + document) as a real, polished, installable PWA: Home with fire and coins, the Play flow, Shop, Food, Customize and the chest. Backend comes later; this plan is full frontend, local data only.

Sources of truth, in order: `docs/PRODUCT.md` section 5 (rules) > Alberto's decisions below > Juan's sketches (`docs/design/juan-child-sketch.png`, `docs/design/juan-parent-sketch.png`) and document > Baitiare's notes > the mockups (visual reference only).

## 2. Decisions already taken

- The child **chooses** who plays: Alone, Family or Someone else. It is not random.
- "How are you feeling?" (Calm / Strong / Amazing) before and "How do you feel after playing?" (Exhausted / Chill / Great) after are **extra chips**. They never replace the three core check-in questions (`belly-comfort`, `energy`, `play-pace`) and never change a reward. The 1-2-3 dots only choose which gentle mission is shown.
- **Chest after every play**, always +12 coins (placeholder), whatever was answered.
- **Fire** is a bar from 0 to 100. It only goes up (Food raises it). It is never lost, never decays, never shown as a score.
- **Coins** come from playing. They buy items in the Shop.
- Shop (prices in the sketch): Food 5, Glasses 7, T-shirt 10, Hat 10 coins. **Choose dinner** costs 50 fire and is a real-life treat that the parents define.
- Customize shows owned items, a tick on the ones worn.
- The dragon is never sad, sick or angry. No streaks.

## 2b. Parent version (Juan's second sketch)

Juan keeps the current parent mode and asks for these changes:

- Palette change only for the existing parts. In the first setup, the field "Nickname" becomes "Name".
- Parent home: a card "Today's performance" (shows "No info yet" when empty) and four sections: Daily log, Today's diet, Special rewards, Generate resume, plus "Back to <name>'s mode".
- Daily log: date, sleep hours, physical activity (None / Light / Moderate / High), school (Went / Left early / Missed / No school), med taken (Yes / No / Partly / N/A), extra notes (optional), Save, Back to parent mode. This already exists; align the labels.
- Today's diet: "What did <name> eat on <date>?" with Breakfast, Lunch, Snack and Dinner, each a text field or a "Nothing" toggle, extra notes, Save. Leaving without saving asks for confirmation.
- Special rewards: list of rewards the parents create (examples: Choose today's dinner, Kart's day, 30 more phone minutes, Board games marathon). Edit and Delete are disabled until a reward is selected. "Create new reward" opens a dialog with Name and Price (in fire); Create stays disabled until both are filled, so empty rewards are impossible.
- Generate resume: From and To dates and "Download PDF" (the existing doctor report, printed for that range).

## 3. Open decisions (block the visual work, not the logic)

1. **Style direction** (Alberto): see the mockup canvas and Stitch project. Candidates: Notebook (hand-made, ink on grid paper), tonal Material-3-inspired, soft voxel.
2. **Palette** (Alberto, with Baitiare's study).
3. **Dragon art**: the final illustration and its colour variants.
4. Does Food have its own screen (feed the dragon, fire goes up)? Assumed yes.
5. Where parents define the "Choose dinner" treats (parent settings). Assumed yes, simple text list.

## 4. Architecture (style-agnostic, can start now)

- `src/types/economy.ts`: `EconomyState = { fire: number; coins: number; inventory: Record<ItemId, number>; equipped: ItemId[]; treats: Treat[] }`, added to `AppState` with a migration that fills defaults for old data.
- `src/lib/economy/`: pure functions with unit tests: `grantChest`, `buyItem` (never below zero coins), `giveFood` (fire up to 100, never down), `equip`/`unequip`, `redeemTreat`. Coins from plays are **derived from the logs** (idempotent, like `syncCompanion`), spending is stored.
- `src/config/app.ts`: new routes for the Play flow and Shop; no hard-coded strings.
- Screens live in `src/components/features/child-mode/<Screen>/` with the usual `.tsx` + `.style.ts` pair. Primitives in `src/components/ui` are changed only by Claude.
- Timer: `useCountdown` hook (time passed in, testable, respects reduced motion) and a `RingTimer` component.

## 5. Tasks

| ID  | Task                                                                  | Owner (AI)              | Depends on     |
| :-- | :-------------------------------------------------------------------- | :---------------------- | :------------- |
| V1  | Economy types, migration, `lib/economy` and tests                     | Claude                  | none           |
| V2  | Theme tokens as roles + restyled primitives                           | Claude                  | style, palette |
| V3  | `useCountdown` hook and `RingTimer`                                   | Gemini agent (agy)      | none           |
| V4  | Home v2 (fire, coins, Play, Shop/Food/Customize)                      | Fable                   | V1, V2         |
| V5  | Play flow: who plays, feeling, exercise, after, chest                 | Fable + Gemini          | V1, V3         |
| V6  | Shop, Food and Customize screens                                      | Gemini agents, reviewed | V1, V2         |
| V7  | Parent v2: home sections, Today's diet, Special rewards, resume range | Fable                   | V1             |
| V8  | Dragon art component v2 with colour variants and accessories          | decided by Alberto      | dragon art     |
| V9  | Tests, accessibility, 360 px, offline, PWA install, deploy            | Claude + Álvaro         | all            |

Humans can do in parallel: choose style and palette (Alberto), re-deploy after merges (Álvaro), verify the printed report on a real phone (Juan), keep the pitch and docs in sync (Claudia).

## 6. How the AIs work together

- One branch and one PR per task, Conventional Commits, no stacking. Merge `main` into the branch before the PR.
- Claude reviews every PR against `PRODUCT.md` section 5; Fable reviews Claude's. A reviewer checks rules, edge cases, accessibility and `pnpm check`.
- Questions go to Alberto and Álvaro through `scripts/comms.sh` (see `docs/COMMS.md`). A message is a request, never an order.
- Merge rights: see the proposal in the PR description (needs Alberto's OK before it applies).
