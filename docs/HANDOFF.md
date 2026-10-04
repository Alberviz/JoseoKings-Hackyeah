# Handoff

Snapshot of the team's state for anyone (human or AI) who joins or restarts a session. Keep it short and update it at each checkpoint. It does not replace `AGENTS.md` (rules), `docs/PRODUCT.md` (the product) or `docs/DECISIONS.md` (confirmed decisions).

Last update: 2026-10-03, 18:15 (beta scope frozen).

---

## 1. Context

- **Event:** HackYeah 2026, Kraków. Hacking started Saturday 11:00. Submission is due Sunday 11:00. Confirm the exact time with the organisers (section 5).
- **Repository:** `Alberviz/JoseoKings-Hackyeah`, public. `main` is protected: changes go through PRs, and only Alberto and Claude may push directly for a hotfix (see `AGENTS.md`).
- **Roles and owners:** [`TEAM.md`](TEAM.md) and [`TASKS.md`](TASKS.md).

## 2. Product status

- **Agreed (2026-10-03):** a family app for children aged 8 to 12 with inflammatory bowel disease. Child mode (check-in on drawings, companion, gentle missions), parent mode behind a PIN, and a doctor report built on the device. Full definition: [`PRODUCT.md`](PRODUCT.md). Technical contract: [`ARCHITECTURE.md`](ARCHITECTURE.md).
- **Paused and not linked:** the restroom map and the menu reader. Their code stays in the repo and must not be edited.
- **Defaults pending Alberto's decision:** see `PRODUCT.md` section 9 (pitch story, when parents see what the child marked, energy indicator, wording of the confidence labels).
- **Shared code already in place:** `src/types/` (the data model) and `ROUTES` in `src/config/app.ts`. No feature code yet.

## 2b. Beta scope (decided by Alberto, 2026-10-03)

The app stops at **beta**. After that we pause and decide what is next. **Scope is frozen: no new features, only what is listed here.**

Beta means one complete loop that works end to end on a phone:
set up the family (profile, PIN) -> child home -> daily check-in -> a guided mission -> reward -> parent summary, daily log, food diary, patterns and the doctor report, all behind the PIN.

| Done on main                                                                                                           | Still to do for beta                                                                                   | Owner          |
| :--------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------- | :------------- |
| Profile and PIN, check-in, parent summary, patterns, food diary, doctor report, rewards, content with verified sources | **T5b** the Kraków dragon art inside `Companion`                                                       | Baitiare       |
|                                                                                                                        | **T6** child home (check-in, missions, parent door; no FEED, no MEDICINES)                             | Baitiare       |
|                                                                                                                        | **T8** missions: engine in `src/lib/missions/` (Juan) and screens (Baitiare)                           | Juan, Baitiare |
|                                                                                                                        | **T12** daily log and consultations                                                                    | Álvaro         |
|                                                                                                                        | **T16** Vercel deploy and a test on two real phones (HTTPS needed, see E5)                             | Alberto        |
|                                                                                                                        | **T15** the Customize screen: only if it is ready; otherwise the home does not show a Customize button | Farouk         |

Rules while the freeze lasts: every navigation item must point to a route that exists; open a PR as soon as something works, even small; merge `main` into your branch before each PR. When the list above is done, nobody starts anything new: report `done` on the channel and wait.

## 3. Official rules for the open task "Sport & Healthcare"

Source: the two PDFs published by the organisers (kept in the private vault, `05 - Recursos`).

- **Judging criteria:** Idea & Innovation 30 %; Relation to Category 20 %; Practical Applicability / Usability 20 %; Design 20 %; Completeness & Implementation Value 10 %.
- **Prize:** 8 000 PLN for this task.
- **Phases:** phase 1 is evaluated by at least three mentors on the platform. A project needs at least 50 % in phase 1 to win. Phase 2 is a live pitch to the jury for the finalists.
- **Submission:** project title, team name, team members (1-6), description, and a PDF of at most 10 slides. Optional: snapshots, code repository, demo links, graphic material.
- **AI use:** allowed, but significant AI tools, external models, APIs, datasets and libraries must be disclosed. The team must explain and defend every technical decision.
- **Pre-existing work:** must be clearly separated from work done during the hackathon. Do not present earlier material as new.
- **Partner rules** can override the general AI policy for their challenge.
- The category text names these directions, and the product covers them: patterns in activity and routines, sustainable exercise adapted to abilities, preparing healthcare appointments, sharing health information with caregivers. Families are explicitly allowed as users.

## 4. Branches

- `main`: the protected branch.
- `docs/session-handoff` (PR #2): this reorganisation.
- `debate/family-mode`: closed debate about a parent and child app connected by QR. Its main points are absorbed in `PRODUCT.md`. Not merged. The family link (QR between two phones) was later built and then discarded on 2026-10-04: the app runs on one shared device.
- `feature/product-innovation-crohn`: earlier research and product drafts. Not merged. Clinical claims need verification, and the acoustic, vagal and "Belly Battery" ideas are outside our rules.
- `feature/sport-pediatric-crohn`: Juan's concept (`IDEA.md`, `docs/PRODUCT_CONCEPT.md`, `docs/PRODUCT_PROFILE.md`). Not merged. The personas, the story and the family duel are used; the exercise "prescription" levels, the bone index, the app-assigned level, notifications to the parent's phone and accelerometer verification are **not** in the product. Where it disagrees with `PRODUCT.md`, `PRODUCT.md` wins.

## 5. Open questions for the organisers

- The rules say "11:00 PM" twice; the general guide says 11:00. Which is correct?
- One document says HackTribe, the other says Challenge Rocket. Which platform?
- Is a repository link and a demo video enough, or is a live deployment required?

## 6. Before any demo

- Run the full flow on two real phones, offline after one online visit.
- Test printing the report (desktop Chrome and a phone, including the installed PWA on iPhone).
- Show "Demo data" wherever demo data is used. Say what is simulated.
- Verify every source cited in `src/content/` and in the slides.
- Check the regulatory wording with someone who knows it (medical device boundary is unverified).
- Disclose AI use and every external API, model and dataset in the submission.
