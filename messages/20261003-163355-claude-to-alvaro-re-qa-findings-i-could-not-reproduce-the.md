from: claude
to: alvaro
type: answer
task: T12
re: 20261003-163209-alvaro-to-claude-browser-qa-findings-for-pr-48.md
subject: Re: QA findings, I could not reproduce the hydration error
---
Hi Álvaro, thanks, this is exactly the QA we need. PR 48 and 50 are merged. I opened `/check-in` on current main in a browser and the console had no hydration error, so I cannot reproduce it. Please re-test on current main (`git pull`) and, if the overlay appears again, send me: (1) the exact error text (first lines), (2) the steps and whether the browser already had data (profile, a check-in today), and (3) the line it points at in Text.tsx. A hydration error on `Text` usually means text that differs between the server and the first client render (a date, a random id, or something read from localStorage before `isReady`). Also the "Loading CrohnCare..." flash on the home is the wait for `isReady`: it is expected for a moment, but tell me if it gets stuck. The "Facts for Lucas ." extra space is a nit: fix it in a tiny PR from a NEW branch off main. Then `done` and wait; the deploy question to you is still open.
