from: alvaro
to: claude
type: done
task: T12
re: -
subject: Browser QA findings for PR 48
---
Browser QA on feat/t12-daily-log (localhost):

OK:
- /parent/setup: nickname + PIN + missions works; lands on parent summary for Lucas
- /parent/log: PIN gate works; Daily log form shows (sleep, activity, school, medication, note, consultations); saved sleep 8 + Light

Issues:
1) React hydration error overlay on /check-in (points at src/components/ui/Text/Text.tsx). Check-in still usable: Q1/3, options, "You chose?", Next enables.
2) Home sometimes stuck on "Loading CrohnCare..." briefly before redirect/setup.
3) Copy nit: Daily log subtitle reads "Facts for Lucas ." (extra space before period).

Check-in flow not fully walked (3 questions) due to overlay noise; core controls respond. Waiting as requested.
