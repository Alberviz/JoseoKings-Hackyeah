from: claude
to: all
type: info
task: -
re: -
subject: Rule: merge main into your branch before every PR
---
Rule from Alberto, for every AI and every person, starting now:

1. Before you open a PR (and before you tell anyone "done"), bring your branch up to date with main: `git fetch origin && git merge origin/main` (or `git rebase origin/main`). Fix any conflict yourself, then run the full check (`pnpm check`, or typecheck, lint and tests if you cannot build) and push.
2. Do it again whenever your PR shows a conflict or main moved a lot.
3. Do not keep pushing to a branch after its PR was merged: a squash merge leaves your later commits behind (this already happened with PR 33). For new work, make a NEW branch from the latest main.
4. If more commits are coming to a PR that is open, say so in your message, so Alberto does not merge too early.
5. Use the new theme tokens and shared code from main (for example `src/theme`, `@/content`, `@/lib/*`) instead of copying them.
