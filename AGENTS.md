<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

The rules for every AI agent and every human in this repository.
`CLAUDE.md` and `GEMINI.md` import this file and only add role notes. If something here is unclear, **ask; do not guess**.

---

## 1. The project

**CrohnCare** (working name) is a Progressive Web App for people living with Crohn's disease, built at HackYeah 2026 (Kraków, 3-4 October 2026). Hacking ends **Sunday 4 October, 11:00**.

What we build (and nothing else):

- **Pillar A, urgent restroom map**: nearest accessible restroom by walking time, walking route, 2/4/6-minute rings, offline, plus an access card in Polish.
- **Pillar B, menu reader**: photo of a restaurant menu, then a traffic light per dish based on the trigger foods the user marked in their local profile.

The task list with the folders each task may touch is in [`docs/TASKS.md`](docs/TASKS.md). Team decisions are in [`docs/DECISIONS.md`](docs/DECISIONS.md). Known errors and their fixes are in [`ERRORS.md`](ERRORS.md).

### Domain rules (never break these)

- **Health data stays on the device.** Symptoms, trigger foods, needs and location history are never sent to our server or any analytics. The only things that leave the phone are: a menu photo (to the analysis endpoint) and coordinates (to the routing endpoint), never linked to a user.
- **No medical advice.** No diagnosing, no treatment suggestions, no "this will make you sick". We say "contains X, which you marked".
- **No accounts, no login.**
- **Accessibility is part of the product**: touch targets at least 48 px, visible focus, labels on every control, readable at 360 px wide.

---

## 2. Stack

| Concern         | Choice                                                                                               |
| :-------------- | :--------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack) + React 19 + TypeScript strict                                    |
| Styling         | styled-components 6, theme in `src/theme/theme.ts`                                                   |
| PWA             | Serwist (`@serwist/turbopack`): service worker in `src/app/sw.ts`, manifest in `src/app/manifest.ts` |
| Map             | MapLibre GL JS + OpenStreetMap data (task T2)                                                        |
| Routing         | OpenRouteService through our route handlers (tasks T3, T4)                                           |
| Menu analysis   | Gemini API through our route handler (task T8)                                                       |
| Local storage   | `localStorage` via typed helpers in `src/lib/`                                                       |
| Tests           | Vitest + Testing Library (`*.test.ts(x)` next to the code)                                           |
| Quality gate    | ESLint + Prettier + TypeScript, run on staged files before each commit, and in CI on each PR         |
| Package manager | **pnpm** (never npm or yarn; never commit another lockfile)                                          |
| Hosting         | Vercel                                                                                               |

---

## 3. How code is written here

### 3.1 Everything in English

Identifiers, file names, folder names, comments, UI copy, commit messages, branch names, PR text, docs. The only non-English text allowed is Polish UI copy for the access card.

### 3.2 Components and `.style.ts` files (the main rule)

Every component lives in its own folder with two files:

```
src/components/ui/Button/
  Button.tsx        # React component: logic + JSX made ONLY of components
  Button.style.ts   # styled-components: every styled element of this component
  Button.test.tsx   # optional test
```

In `.tsx` files **you may not write** (ESLint fails the commit):

- raw HTML tags in lowercase: `<div>`, `<span>`, `<button>`, `<img>`, `<p>`...
- `style={{ ... }}`
- `className`
- imports of `.css` or `.scss` files

Instead, create the element in the `.style.ts` file and use it:

```ts
// RestroomCard.style.ts
import styled from "styled-components";

export const CardContainer = styled.article`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.lg};
`;

export const DistanceLabel = styled.span<{ $isClose: boolean }>`
  color: ${({ theme, $isClose }) => ($isClose ? theme.colors.success : theme.colors.textMuted)};
`;
```

```tsx
// RestroomCard.tsx
"use client";

import { Heading } from "@/components/ui";
import { CardContainer, DistanceLabel } from "./RestroomCard.style";

type RestroomCardProps = {
  name: string;
  walkingMinutes: number;
};

export function RestroomCard({ name, walkingMinutes }: RestroomCardProps) {
  return (
    <CardContainer>
      <Heading level={3}>{name}</Heading>
      <DistanceLabel $isClose={walkingMinutes <= 3}>{walkingMinutes} min walk</DistanceLabel>
    </CardContainer>
  );
}
```

Rules that go with it:

- **`"use client"` at the top of every `.tsx` component** that renders styled components (styled-components needs the browser runtime). Pages in `src/app` stay server components and just render one feature screen.
- **Use the theme**, never hard-coded colors, sizes or spacing: `theme.colors.*`, `theme.spacing.*`, `theme.radius.*`, `theme.fontSize.*`.
- **Props that only drive styles start with `$`** (`$variant`, `$isClose`) so they do not reach the DOM.
- **Reuse the primitives** in `src/components/ui` (`Screen`, `Stack`, `Heading`, `Text`, `Button`, `LinkButton`, `Card`) before creating a new styled element. Import them from `@/components/ui`.
- Use semantic elements in `.style.ts`: `styled.button` for actions, `styled.nav`, `styled.article`, `styled.ul`... not `styled.div` everywhere.
- One component per file, named export, PascalCase file name equal to the component name.
- Only `src/app/layout.tsx` may contain `<html>` and `<body>`.

### 3.3 Where things go

```
src/
  app/                       # routes only. page.tsx renders ONE feature screen. route handlers in app/api/
  components/
    ui/                      # shared primitives (owned by Alberto + Claude)
    providers/               # theme, styled-components registry, service worker (owned by Alberto + Claude)
    features/<feature>/      # one folder per feature: restroom-map, menu-reader, profile, access-card...
      <Component>/<Component>.tsx + .style.ts
  lib/<topic>/               # pure TypeScript logic, no React. Unit-tested.
  hooks/                     # React hooks (useSomething.ts)
  types/                     # shared types (owned by Alberto + Claude)
  config/                    # app constants and routes
  theme/                     # design tokens and global style (owned by Alberto + Claude)
scripts/                     # one-off Node scripts (data download)
public/                      # icons, static data
docs/                        # TASKS.md, DECISIONS.md
```

### 3.4 TypeScript

- No `any` (ESLint error). Type props, API responses and anything read from storage.
- Validate external data (API responses, `localStorage`) before trusting it.
- Prefer `type` over `interface` for props.

### 3.5 API keys and server code

- Keys live in `.env.local` (git-ignored). Names are documented in `.env.example`.
- A key without the `NEXT_PUBLIC_` prefix may only be read in route handlers under `src/app/api/`. Never import server code into a `"use client"` file.

---

## 4. Workflow

### Who does what

| Who       | Tool                     | Role                                                            |
| :-------- | :----------------------- | :-------------------------------------------------------------- |
| Alberto   | Claude Code              | Product owner. Approves scope. **Reviews and merges every PR.** |
| Claude    | Claude Code              | Lead engineer with Alberto: architecture, shared code, reviews. |
| Teammates | Gemini CLI / Antigravity | Implement tasks from `docs/TASKS.md`, one at a time.            |

### The flow for every change

1. **Take a task**: assign yourself the GitHub issue (`T1`, `T2`...). Read its spec in `docs/TASKS.md`.
2. **Update and branch**:
   ```sh
   git switch main && git pull
   git switch -c feat/t2-map-view
   ```
   Branch prefixes: `feat/`, `fix/`, `chore/`, `docs/`. Lowercase, hyphens, task ID first.
3. **Implement** only inside the task's folders. Run `pnpm dev` and check it at 360 px wide.
4. **Commit small and often** with Conventional Commits (the `commit-msg` hook rejects anything else):
   ```
   feat(restroom-map): show restrooms colored by confidence
   fix(menu-reader): handle photos larger than 5 MB
   ```
5. **Pre-commit check ("prelint")** runs automatically on staged files: ESLint with auto-fix, Prettier, and a TypeScript check. If it fails, **fix the cause**. Never use `git commit --no-verify`, never add `eslint-disable` to get past the main rule.
6. **Before pushing**, run `pnpm check` (typecheck + lint + test + build). It must pass.
7. **Push and open a PR** to `main`:
   ```sh
   git push -u origin feat/t2-map-view
   gh pr create --fill
   ```
   Fill the PR template. Write `Closes #<issue>`. Add a phone-width screenshot for UI changes.
8. **CI** runs the same checks on GitHub. A red PR is not reviewed.
9. **Review**: Alberto reviews (with Claude). Answer comments with new commits on the same branch; do not open a new PR.
10. **Merge**: only Alberto merges, with squash. Then delete the branch and go back to step 1.

Every 3-4 hours: integration checkpoint. Merge what is green, post three lines in the team chat: done / next / blocked.

### Errors: `ERRORS.md`

[`ERRORS.md`](ERRORS.md) is the shared error log. It is mandatory:

1. **Before debugging**, search `ERRORS.md` for the error message. It may already be solved.
2. **When you hit an error** that took more than 10 minutes, can happen again, or affects other people (build, deps, config, APIs, hooks, CI, deploy), **add an entry at the end of the file** using the template there. If it is not fixed yet, use status `open` so others know.
3. **Commit the entry in the same PR** as the fix (`docs(errors): add E7 maplibre SSR crash` or inside your fix commit).
4. Append only: never edit or delete other people's entries.

This is the one shared file anyone may edit without approval, as long as they only append.

### What you can do without asking

- Create, edit and delete files inside your task's folders.
- Add components, hooks, `lib` functions and tests for your task.
- Add the dependencies listed for your task in `docs/TASKS.md` (with `pnpm add`).
- Append entries to `ERRORS.md`.

### What needs Alberto's approval first (ask in the issue or PR)

- Touching shared code: `src/components/ui`, `src/components/providers`, `src/theme`, `src/types`, `src/config`, `src/app/layout.tsx`.
- Touching config: `package.json` scripts, `eslint.config.mjs`, `tsconfig.json`, `next.config.ts`, `.github/`, `.husky/`, `lint-staged.config.mjs`.
- Any dependency not listed in your task.
- Changing the scope or the UX of another feature.
- Renaming or moving files you did not create.

If you need a new UI primitive or shared type, propose it in your PR description and keep a local version in your feature folder until it is approved.

### Never

- Push to `main` or merge your own PR.
- Commit `.env.local`, API keys, tokens or real personal data.
- Use `--no-verify`, `git push --force` on shared branches, or rewrite `main` history.
- Use npm or yarn, or add a second lockfile.
- Disable ESLint rules, add `any`, or use `@ts-ignore` to make checks pass.
- Send health data to a server, add analytics or tracking.
- Write medical claims in UI copy.
- Invent results: if a command fails or you could not test something, say it in the PR.
- Hide an error: if you hit one worth logging, it goes in `ERRORS.md`.

### Definition of done

- [ ] `pnpm check` passes locally and CI is green.
- [ ] Works at 360 px wide, no horizontal scroll, no console errors.
- [ ] Every `.tsx` only composes components; styles in the sibling `.style.ts`.
- [ ] Pure logic in `src/lib` has unit tests.
- [ ] New env vars are listed in `.env.example`.
- [ ] Errors you hit during the task are logged in `ERRORS.md`.
- [ ] The PR template is filled, with a screenshot for UI changes.

---

## 5. Commands

| Command                         | What it does                                           |
| :------------------------------ | :----------------------------------------------------- |
| `pnpm install`                  | Install dependencies and the git hooks                 |
| `pnpm dev`                      | Dev server on http://localhost:3000                    |
| `pnpm typecheck`                | Generate route types and run `tsc --noEmit`            |
| `pnpm lint`                     | ESLint over the whole project, zero warnings allowed   |
| `pnpm test` / `pnpm test:watch` | Unit tests once / in watch mode                        |
| `pnpm format`                   | Prettier over the whole project                        |
| `pnpm build`                    | Production build (also builds the service worker)      |
| `pnpm check`                    | typecheck + lint + test + build: run before every push |

The service worker is only registered in production builds; to test offline, run `pnpm build && pnpm start`.

---

## 6. Setup for a new teammate

```sh
git clone git@github.com:Alberviz/JoseoKings-Hackyeah.git
cd JoseoKings-Hackyeah
pnpm install            # also installs the pre-commit hooks
cp .env.example .env.local   # then ask Alberto for the keys
pnpm dev
```

Requirements: Node 20.9 or newer (22 recommended), pnpm 11, `gh` CLI logged in.
