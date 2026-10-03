# Handoff

Snapshot of the team's state for anyone (human or AI) who joins or restarts a session. Keep it short and update it at each checkpoint. It does not replace `AGENTS.md` (rules) or `docs/DECISIONS.md` (confirmed decisions).

Last update: 2026-10-03, afternoon.

---

## 1. Context

- **Event:** HackYeah 2026, Kraków. Hacking started Saturday 11:00. Submission is due Sunday 11:00. Confirm the exact time with the organisers (see section 6).
- **Repository:** `Alberviz/JoseoKings-Hackyeah`, public. `main` is protected: changes go through PRs, and only Alberto and Claude may push directly for a hotfix (see `AGENTS.md`).
- **Roles:** Alberto is the product owner and the only one who merges. Claude is the lead engineer. Teammates use Gemini / Antigravity and follow `GEMINI.md`.

## 2. Product status

- **CrohnCare** (adult and paediatric Crohn's disease, families as users): **paused.** The team has not confirmed it as the final scope. The recommended scope is "people with Crohn's or colitis and their families", with no general chronic-illness scope and no direct use by children.
- **Next idea:** Alberto wants to start a new idea from scratch. It is not named yet.

## 3. Official rules for the open task "Sport & Healthcare"

Source: the two PDFs published by the organisers (kept in the private vault, `05 - Recursos`).

- **Judging criteria:** Idea & Innovation 30 %; Relation to Category 20 %; Practical Applicability / Usability 20 %; Design 20 %; Completeness & Implementation Value 10 %.
- **Prize:** 8 000 PLN for this task.
- **Phases:** phase 1 is evaluated by at least three mentors on the platform. A project needs at least 50 % in phase 1 to win. Phase 2 is a live pitch to the jury for the finalists.
- **Submission:** project title, team name, team members (1-6), description, and a PDF of at most 10 slides. Optional: snapshots, code repository, demo links, graphic material.
- **AI use:** allowed, but significant AI tools, external models, APIs, datasets and libraries must be disclosed. The team must explain and defend every technical decision.
- **Pre-existing work:** must be clearly separated from work done during the hackathon. Do not present earlier material as new.
- **Partner rules** can override the general AI policy for their challenge.

**Open questions for the organisers:**

- The rules say "11:00 PM" twice; the general guide says 11:00. Which is correct?
- One document says HackTribe, the other says Challenge Rocket. Which platform?
- The partner rules for Cracow Without Barriers are not in our files.

## 4. Classification rule for every new idea

Before anyone works on an idea, classify it:

- **Inside the category:** matches one of the directions in the official text (activity patterns, sustainable exercise adapted to abilities, healthcare appointment preparation, organising health information and sharing it with caregivers, access to physical activity and wellbeing support).
- **Borderline:** allowed by the category text but against our rules in `AGENTS.md`, or not feasible in 24 hours.
- **Outside:** against the category or against our rules.

Then check our rules in `AGENTS.md`: no diagnosis, no treatment advice, health data stays on the device, no covert data collection, accessibility is part of the product.

## 5. Decisions from the family-mode debate

Full record: branch `debate/family-mode`, file `docs/debates/family-mode.md`, turns 0 to 5 and the final summary.

| Topic                                                       | Status                                                                                                         |
| :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| Child app shows no health data and uses no sensors          | Agreed                                                                                                         |
| Parent-to-child dispatch by QR code, no server, no accounts | Agreed for the demo                                                                                            |
| Demo states that the family mode is one-way for now         | Agreed (wording for the pitch)                                                                                 |
| Acoustic bowel sensing, vagal biofeedback, CDED material    | Roadmap or vision slide only                                                                                   |
| Covert data collection from children                        | Rejected                                                                                                       |
| PIN length: 4 or 6 digits                                   | **Pending.** 4 digits is not secure.                                                                           |
| QR size with encryption                                     | **Pending.** Measure on two real phones. Version 5 at level M holds about 84 bytes; version 6 holds about 106. |
| Age for own digital consent in Poland: 16                   | Accepted, article number to verify                                                                             |
| Citation Rosen MJ et al. (PMID 26581977)                    | Journal is JAMA Pediatrics, not Gastroenterology. PMID to verify.                                              |

## 6. Branches

- `main`: the protected branch with the team setup and this handoff once merged.
- `debate/family-mode`: the closed debate between Claude and the Antigravity of a teammate. Not merged.
- `feature/product-innovation-crohn`: a teammate's research and product drafts (`docs/product.md`, `research/`). Not merged. Its content has been reviewed: clinical claims need verification, and the Belly Battery index, acoustic and vagal features, and the paediatric gamification are outside our rules.
- `docs/session-handoff`: this document.

## 7. Before any demo

- Measure the QR with the final payload on two real phones.
- Verify every citation on PubMed.
- Verify the Polish act article for the age of consent.
- Confirm the submission time and platform with the organisers.
- Disclose AI use and every external API, model and dataset in the submission.
