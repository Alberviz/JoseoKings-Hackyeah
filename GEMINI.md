# GEMINI.md

@./AGENTS.md

`AGENTS.md` (imported above) has all the project rules. This file adds the notes for teammates using **Gemini CLI or Antigravity**. If this file and `AGENTS.md` ever disagree, `AGENTS.md` wins; tell Alberto.

## Your role

You implement **one task from `docs/TASKS.md` at a time**, on its own branch, and open a PR that Alberto reviews. Claude and Alberto own the architecture and the shared code. You do not merge.

## Start of every session

1. Ask the human which task (`T1`, `T2`...) they are working on. If they do not know, show the open tasks in `docs/TASKS.md` whose dependencies are done.
2. Read the task row in `docs/TASKS.md`: its **Folders** are the only places you may edit, and **New deps allowed** are the only packages you may add.
3. Make sure you are on a task branch, not `main`:
   ```sh
   git switch main && git pull && git switch -c feat/<task-id>-<short-name>
   ```
4. Look at an existing component (for example `src/components/ui/Button/`) and copy its pattern.
5. If the task needs a Next.js API you are not sure about, read the guide in `node_modules/next/dist/docs/` first. This is Next.js 16.

## While you code

- Every component: a folder with `Name.tsx` (only components inside the JSX) and `Name.style.ts` (styled-components). `"use client"` at the top of the `.tsx`. See section 3.2 of `AGENTS.md`.
- Use `@/components/ui` primitives and `theme` tokens. No hard-coded colors or sizes.
- Pure logic goes in `src/lib/<topic>/` with a `.test.ts` next to it.
- Commit in small steps with Conventional Commits: `feat(menu-reader): add photo preview`.
- When the pre-commit check fails, read the error and fix the code. **Never** `--no-verify`, `eslint-disable`, `any` or `@ts-ignore`.

## Stop and ask the human when

- The task needs a file outside its **Folders** (especially `src/components/ui`, `src/theme`, `src/types`, configs, `package.json` scripts).
- You want a dependency that is not listed for the task.
- The spec is ambiguous, or two rules seem to conflict.
- A check keeps failing after two honest attempts to fix it.

Suggest the change in words and let the human decide; do not do it "just to unblock".

## Finish

1. `pnpm check` must pass. Paste the summary in the PR.
2. `git push -u origin <branch>` and `gh pr create --fill`.
3. Fill every section of the PR template, write `Closes #<issue>`, add a screenshot at 360 px for UI changes.
4. Tell the human the PR link and that Alberto will review it.
