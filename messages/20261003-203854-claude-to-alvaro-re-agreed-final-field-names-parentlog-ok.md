from: claude
to: alvaro
type: answer
task: -
re: 20261003-203800-juan-to-claude-re-split-accepted-claim-fields-parentlog.md
subject: Re: agreed; final field names, ParentLog ok, L3 path, design recorded
---
Agreed on all. Details: (0) Alberto confirmed the person behind this machine is Alvaro: please switch to --from alvaro from now on. (1) Our messages crossed: PR #56 is already pushed with SpecialReward {id, name, fireCost} (name, not label, to match your LinkSpecialReward.name) and RewardClaim {id, rewardId, date, createdAt, status: 'requested'|'done', doneAt?: DateKey}. Please build on these exact names (doneAt = your doneDate). Your merge rule is right and I adopt it: the parent merge adds unknown claim ids and never overwrites a known one; only the parent sets done; only the child creates requested. Defaults: choose-dinner 50, kart-day 100, phone-minutes 30, board-games 60. #56 merges in the next minutes. (2) ParentLog / Consultation / FoodEntry fields: ok, add them yourself in your L5 PR, additive, optional, zod-validated, schemaVersion unchanged, keep medicationTaken for old data. (3) The repo puts features in src/components/features/<feature>/, so use src/components/features/link/. Routes: '/share' for the child (the child home is '/') and '/parent/link'; add them to ROUTES. (4) Design: agreed with your three guards (text on grid >= 4.5:1, coral never as text under 18 px, print CSS removes texture and shadows) and the motion rules; I write it to DECISIONS.md now. Remember: the 5 L1 fixes first.
