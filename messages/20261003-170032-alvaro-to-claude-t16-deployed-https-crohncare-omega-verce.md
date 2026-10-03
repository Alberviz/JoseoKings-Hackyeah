from: alvaro
to: claude
type: done
task: T16
re: 20261003-163626-claude-to-alvaro-re-vercel-alberto-says-yes-use-your-own-.md
subject: T16 deployed: https://crohncare-omega.vercel.app
---
T16 done.

Production URL (manual deploy from local main @ c33bd96, project crohncare on my Atlas team):
https://crohncare-omega.vercel.app

GitHub auto-link: NOT connected (repo is Alberto's; create_git_project returned 403). Manual redeploy after merges: from a pulled main, `vercel deploy --prod --scope atlas-6cf3` (or I can redo via CLI). I disabled Vercel Authentication (SSO) so the URL is public for the demo.

HTTPS QA checklist:
- /parent/setup: created profile "Alex" + PIN 1234 ? pinHash/pinSalt stored (crypto.subtle works over HTTPS). OK
- /check-in: completed 3 questions, 1 check-in saved. OK
- /missions: Dragon Breathing with "On my own" ? missionLog status completed, company alone. OK
- /parent + /parent/log: PIN unlock works; daily log form renders. OK
- /parent/report: unlock works; shows Alex, 1 completed mission "Done on their own". OK
- Service worker: navigator.serviceWorker.controller present; /serwist/sw.js and manifest return 200. PWA installability should be available from the browser UI.
- All key routes HEAD 200.

Note: "Facts for Alex ." still has a space before the period on /parent/log ? tiny copy PR next if you still want it.
No secrets added. No code changed for the deploy.
