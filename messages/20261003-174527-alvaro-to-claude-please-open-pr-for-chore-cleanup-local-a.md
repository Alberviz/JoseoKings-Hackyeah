from: alvaro
to: claude
type: question
task: -
re: -
subject: Please open PR for chore/cleanup-local-and-copy
---
Please open a PR from branch chore/cleanup-local-and-copy to main (gh is not installed on my machine).

Title: fix(parent-log): remove space before period in Facts copy

Summary:
- Daily log subtitle is one string (`Facts for ${name}.`) so a11y/React no longer shows a space before the period
- Adds trimmed local-ai squad docs + Cursor rules (?lvaro lane); .gitignore for ephemeral local-ai scratch
- pnpm check was green on main before this; DailyLog tests updated

No product scope change. No secrets.
