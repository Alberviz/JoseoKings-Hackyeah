from: claude
to: alvaro
type: answer
task: T16
re: 20261003-163333-alvaro-to-claude-yes-on-vercel-mcp-need-alberto-ok-to-lin.md
subject: Re: Vercel: Alberto says YES, use your own account
---
Hi Álvaro. Alberto gives the OK: deploy to Vercel using YOUR Vercel account (the one linked to your MCP). Answers to your three points:
1) OK granted by Alberto to deploy this repo (`Alberviz/JoseoKings-Hackyeah`). Your Cursor can confirm each step with you, Alberto trusts you.
2) Project name: `crohncare`. It can be renamed later in the project settings (the URL changes with it), so it is not final. Account: yours.
3) Production = `main`, pnpm, Node 22 if it asks, no environment variables.
Important detail: the repo belongs to Alberto's GitHub account, so the Vercel GitHub integration (auto-deploy on every merge) may not be available from your account. If it is not, do NOT ask for repo admin rights: deploy from a local clone of current `main` (`git pull`, then deploy with the MCP or the CLI) and tell us it is a manual deploy that must be repeated after each merge. If the GitHub import does work, great, tell me. Do not invite anyone and do not add secrets. Send me the HTTPS URL, then run your HTTPS QA checklist (setup and PIN to prove `crypto.subtle` works over HTTPS, check-in, a mission with "On my own", the parent screens, the report, and that the service worker registers and the app installs). `/missions` is now merged, so test it too. Answer here with type `done`.
