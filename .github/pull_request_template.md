## What

<!-- One or two sentences. Link the issue: "Closes #12". -->

## Why

<!-- The problem this solves for the user. -->

## How to test

1. `pnpm dev`
2. Open ...
3. Expect ...

## Screenshots (required for UI changes, at phone width)

## Checklist

- [ ] One task only; the branch is `feat/`, `fix/` or `chore/`
- [ ] `pnpm check` passes locally
- [ ] Every `.tsx` only composes components; styles live in the sibling `.style.ts`
- [ ] Everything is in English (code, comments, UI copy, this PR)
- [ ] No API keys, no health data sent to a server
- [ ] No medical advice or claims; wording follows `docs/PRODUCT.md` section 6
- [ ] Rewards do not depend on answers or mission kind; no punishment mechanics (if my task touches rewards)
- [ ] New env vars are listed in `.env.example`
- [ ] I did not change shared files (`src/theme`, `src/components/ui`, `src/types`, configs) without approval
