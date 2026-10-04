# Product

What we are building and the rules it follows. This is the source of truth for the product. If another file (a draft, an `IDEA.md`, a research note) disagrees with this one, **this file wins**. Changes go through a PR approved by Alberto. How it is built is in [`ARCHITECTURE.md`](ARCHITECTURE.md).

Status: agreed by Alberto on 2026-10-03. Items marked **Default** are provisional choices so the team can start; Alberto may change them (section 9).

---

## 1. In one sentence

A Progressive Web App for families with a child aged 8 to 12 who has inflammatory bowel disease (Crohn's disease or ulcerative colitis). The child plays with a companion and tells how they feel without being questioned; parents and the doctor get that information in an organised, honest form.

Working name: **Mycrohnie** (previous name CrohnCare). The name may change; do not hard-code it outside `src/config/app.ts`.

Hackathon category: **Sport & Healthcare** (open task).

## 2. The problem

Four communication problems, all in the same family:

1. **Child to parents.** Children often do not say how they feel. They are embarrassed (the bathroom), do not want to worry anyone, do not want to miss things, or lack the words. Parents compensate by asking all the time ("does your tummy hurt? did you go to the bathroom?"), and the child feels watched and closes up. We call this **interrogation fatigue**.
2. **Memory in the consultation.** Visits are months apart. When the doctor asks "how have these three months been?", nobody remembers.
3. **Context the child cannot see.** Sleep, school, activity, what was eaten before a bad day. Parents hold scattered facts and do not see the relationship.
4. **Movement.** Fear of pain leads to avoiding activity, and families do not know what gentle movement looks like. A game that families do together makes it easy to start.

## 3. Who it is for

| Person                                | What they need                                                                                  |
| :------------------------------------ | :---------------------------------------------------------------------------------------------- |
| **The child (8 to 12)**               | To feel like a normal kid, to have fun, to tell how they are without a talk about illness.      |
| **The parents or carers**             | To know how their child is without interrogating them, and to bring useful notes to the doctor. |
| **The paediatric gastroenterologist** | One clear page that covers the time since the last visit.                                       |

Scope of disease: **inflammatory bowel disease** (Crohn's and ulcerative colitis). Same flows, wider audience. Children aged 8 to 12 only in v1. Adolescent privacy is roadmap.

## 4. How the app works

One installable PWA. One device, **two modes**: child mode (default) and parent mode (protected by a PIN). Everything is stored on the device by default. The same device is used by the child and the parent; the PIN separates the two modes.

Optionally, a parent can connect the child's **wearable** (section 5.6, task W1). That is the only data source that does not come from the family typing or tapping.

### 4.1 Child mode

1. **Daily check-in.** A few taps on drawings. The exact questions are written by the biomedical team from real sources and live in `src/content/check-in-questions.ts`. The check-in always includes **"I don't feel like it today"**, which is a valid answer.
2. **The companion.** A character that does the movement mission _together with the child_ and shows the exercise on screen. It is not a pet to look after: it never gets sick, sad or hungry, and it never loses anything. It only gains things.
3. **Missions.** Short (1 to 2 minutes), gentle (breathing, stretching, balance, wall sit), guided step by step by the companion. **No impact and no jumping in v1.** All missions are available to the child. The child can do a mission:
   - **alone**,
   - **with a parent or carer**, or
   - **with someone else** (sibling, grandparent, friend).
     Team missions are **cooperative, never competitive**: either both win or both lose. A visible **Stop** button is always available.
4. **Rewards.** Badges for steadiness and, in the shop, wearables (glasses, t-shirt, hat) and food bought with coins. Coins come from checking in, doing a mission or resting, and the chest after play.
5. **Shop, fire and rewards from home.** Feeding the dragon raises its fire (0 to 100). Fire never decays; it goes down only when the child spends it on a reward from home, which the parents created (name and fire price). A claim is a request the parents confirm when it happens. See section 5.2.

### 4.2 Parent mode (PIN)

- **Summary card** of what the child did and marked today, as plain facts. No interpretation, no advice.
- **Daily log:** sleep hours, physical activity, school (went, left early, missed), medication taken (yes / partly / no, **never drug names or doses**).
- **Reactive food diary:** only when the child marked discomfort, the parents are prompted to write what the child ate. It goes into the doctor report.
- **Patterns:** a colour calendar, weekly charts, and a list of foods that appeared on days with discomfort (counts only, never causes).
- **Wearable card (only when a wearable is connected):** steps, heart rate and sleep stages read from the child's wearable, shown as plain totals, averages and ranges and always labelled "From the wearable (Google Health)". Days without data show "No wearable data yet". No interpretation, no advice, no alerts. Rules in section 5.6.
- **Consultations:** parents mark the date of each visit; the report covers the time since the previous one.
- **Settings:** change the PIN, export or import a backup file.

### 4.3 Doctor report

- One page, built on the device, covering **the time since the last consultation** by default; parents can choose From and To dates.
- Shown on screen in a clean view, or saved as PDF through the browser print dialog (`window.print()` with print CSS). No PDF library.
- English only in v1.
- Contains: the period, a day-by-day colour strip, pain and energy as the child marked them, days with discomfort, food entries on those days, sleep and school summary, medication-taken yes/no, active days, and, when a wearable is connected, a **wearable section** (steps, heart rate and sleep as totals, averages and ranges for the period, labelled as measured by the wearable, with gaps shown as "No wearable data yet").
- Every mission record carries its **confidence label** (section 5.3). Wearable figures carry the wearable label instead (section 5.6).
- Always ends with the disclaimer in section 6.3.

## 5. Product rules (never break these)

### 5.1 Privacy

- **Health data stays on the device by default.** Check-ins, mission records, the parent log, the food diary and wearable data are kept on the device, with no analytics and no third parties.
- **No accounts or login for the family.** The only sign-in is the parent's Google consent when connecting a wearable (section 5.6).
- **Check-ins, the parent log and the food diary are never sent to a server** unless Alberto approves it separately.
- A server copy of **wearable data** exists only if the W1 design needs it (Álvaro decides), and then only under the guardrails in section 5.6.
- The report leaves the device only when a parent saves, prints or shares it.
- Demo data is fictional and always shows a visible **"Demo data"** label.

### 5.2 Rewards and honesty

- **Reward the act of checking in, never the answer.** "Pain 4" and "pain 0" give exactly the same reward, and the child is told so.
- **"I don't feel like it today" is valid.** It gives a slightly smaller reward than a full check-in and shows in the report as a day without answers.
- **No punishment.** No streaks that break, no sad or sick companion, no countdown pressure. Progress only goes up. Use "care days" (a running total) and a streak that pauses instead of resetting.
- **Rewards never depend on wearable data.** Steps, heart rate and sleep never change coins, fire, badges or any reward. No step goals, no streaks and no targets for the child, and the child is not shown these numbers. Reward the act, never the numbers.
- **All mission kinds give the same main reward.** A bed stretch is worth the same as a wall sit. The only extra is a separate **team track** (stars, a team badge) for missions done with someone. It never speeds up main progress, so a child with nobody around is not penalised.
- **Stop early is rest, not failure.** It is logged as a rest session and gives the smaller reward.
- **Fixed, predictable rewards.** No random loot boxes.
- Rewards belong to the child (items, colours, a room). Parents never "give" them.
- **Coins and fire (child interface v2).** Coins come from the act: a check-in (including "not today"), a mission (including rest) and the chest after play. They buy food and accessories in the shop. Fire rises when the child feeds the dragon. It never decays and the app never takes it away; it only goes down when the child chooses to spend it.
- **Rewards from home** are a separate, optional layer that the family defines together: the parents create them (name and price in fire), the child can claim one, and a claim is a request the parents confirm when it happens. Prices never depend on what the child answered. The companion's items stay the child's and parents cannot touch them. Parents cannot reject a claim or refund fire; if a reward does not suit the family, they edit or remove it from the list before the child claims it.

### 5.3 Confidence labels on missions

The app does not measure mission movement, and it does not try to. Every mission record says how it was confirmed, with neutral wording:

| Company                | Confirmed by                                  | Label shown to parents and in the report |
| :--------------------- | :-------------------------------------------- | :--------------------------------------- |
| Alone                  | The child taps "I did it" at the end          | "Done on their own"                      |
| With someone else      | That person taps "Confirm" on the same device | "Done with someone"                      |
| With a parent or carer | The parent enters the parent PIN              | "Done with family"                       |

Labels are about how the record was made, not about trust. Never write "declared", "unverified" or "cheated" in the UI. A mission is **never presented as measured**, even when a wearable is connected: wearable data is shown separately and labelled as such (section 5.6).

### 5.4 No medical advice

- No diagnosis, no treatment suggestions, no predictions ("tomorrow he will be tired"), no scores or indexes that look clinical, no claims that exercise treats or prevents anything (bones, inflammation, flares).
- The app **never answers a health question** and never assigns exercise by symptom. All missions are available to the child.
- The app records, shows and summarises what the family entered. It describes ("on 4 of the 6 days with discomfort, a dairy entry was logged") and never explains why.
- Food entries show **co-occurrence only**, as a count, never ranked as causes.
- Wearable data gets **no risk scores, no alerts, no predictions and no clinical thresholds** (no "normal range", no "too high"). Summaries are descriptive: totals, averages and ranges. The app never claims that the wearable detects flares or any condition.
- Every parent screen with patterns and the doctor report carry the disclaimer in section 6.3.

### 5.5 Accessibility and design

- Touch targets at least 48 px, visible focus, a label on every control, readable at 360 px wide.
- Child mode: large drawings, almost no text, reading level of an 8-year-old, calm colours, nothing flashing.
- The companion must look right for 8 to 12: more "hero or creature" than "plush toy". It must never look disappointed.
- No streak counters in red, no timers that shame.

### 5.6 Wearable data (wearables)

Decided by Alberto on 2026-10-04 (`DECISIONS.md`). A test with an Amazfit GTS 2 proved the path: Zepp app, Health Connect (Android), Google Health app, then the Google Health API v4 (`health.googleapis.com`) returned steps, heart rate and sleep stages.

1. **Allowed, with consent.** Data from the child's wearable can be read through the Google Health API with **read-only scopes** (`googlehealth.activity_and_fitness`, `googlehealth.health_metrics_and_measurements`, `googlehealth.sleep`), only after the parent connects their Google account and consents. Google Fit is not used (closed). Other sources (Health Connect on the device, CSV import) are allowed later under the same rules.
2. **Privacy.** By default the parent's device reads the API and keeps the data on that device, like all other data. A server copy is allowed only if the W1 design needs it (Álvaro decides) and then: EU region, pseudonymous ids (no names, emails or drug names), service-role access only, no analytics or third parties, deletable on request. Check-ins, the parent log and the food diary are **not** sent to the server unless Alberto approves it separately. Secrets (client secret, refresh tokens) live only in `.env.local` or the server environment, never in the repo, in issues or in client code.
3. **Honest data.** Wearable data is labelled as measured by the wearable, for example **"From the wearable (Google Health)"**. Mission records stay socially confirmed with their neutral labels (section 5.3) and are never presented as measured. A day or period without data shows **"No wearable data yet"**: never fill, estimate or guess a gap.
4. **No medical use.** No diagnosis, predictions, risk scores, alerts or clinical thresholds from wearable data. Summaries are descriptive (totals, averages, ranges) for the family and the doctor. No claim that the wearable detects flares.
5. **Rewards unchanged.** Rewards never depend on wearable data (section 5.2). No step goals or streaks for the child.
6. **Child view.** The child is not shown heart rate or sleep scores. Wearable data lives in parent mode and in the doctor report.

## 6. Words we use

### 6.1 Use

"The family logged", "the child marked", "on days with discomfort", "co-occurs", "done with family", "summary for the consultation", "talking points", "self-reported", "From the wearable (Google Health)", "recorded by the wearable", "No wearable data yet", "average", "range", "total".

### 6.2 Do not use

"Treats", "prevents", "protects bones", "clinical objective", "therapy", "prescription", "diagnosis", "risk score", "energy level optimal", "trigger" (as a conclusion), "verified", "unverified", "proves", "detects" or "predicts" (about the wearable), "flare warning", "alert", "normal range", "abnormal", "healthy heart rate", "sleep score", "first-ever", "fully functional" (unless it is true and tested).

### 6.3 Disclaimer for the report and the patterns screens

> Summary written by the family from what the child and carers entered. It is not a medical assessment, it makes no diagnosis and it gives no advice. It is meant to help the family talk with the care team.

The disclaimer text lives in `src/content/disclaimers.ts`. Do not retype it in components.

## 7. What is in v1 and in what order

Priority if time runs out. Everything above a line must work before anything below it is started.

1. **Core loop:** onboarding and PIN, child check-in, one companion with 3 to 4 missions, mission confirmation, the local data store, and the demo data loader.
2. **Parent side:** summary card, daily log, reactive food diary, consultations.
3. **Doctor report** with print view.
4. **Patterns:** colour calendar and weekly charts.
5. **Companion extras:** accessories, colours, badges.
6. **Team track** (stars and team badge).
7. **Companion room** (only if everything above is solid).

Without a working item 1 to 3 there is no demo. Item 7 is cut first.

Task W1 (wearable data, section 5.6) runs in parallel on its own folders. It is built behind a parent opt-in, so the rest of the app works the same with no wearable connected. If it blocks the core loop, W1 is cut before anything above.

## 8. Out of scope

- The restroom map and the menu reader (paused, see [`DECISIONS.md`](DECISIONS.md)).
- Wearable data is **in scope** through the Google Health API (section 5.6, task W1). Still out of scope: Google Fit (closed), live or real-time streaming, notifications from wearable data, and any wearable-based reward, score or alert. Motion detection from the phone and camera pose estimation: roadmap.
- Push notifications, family accounts or login, cloud sync of check-ins, the parent log or the food diary, online play. The family QR link, a second app and the web home are out of scope (one shared device).
- Impact exercise (jumping) and anything that assigns exercise by symptom.
- Predictions, "energy percentage" or any invented index.
- Adolescent privacy mode, other languages, other diseases.
- Medication names or doses, any real patient data.

## 9. Defaults pending Alberto's decision

The team builds with these defaults. If Alberto changes one, it is a small edit, not a rewrite.

| Topic                                               | Default for now                                                                                                                    |
| :-------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------- |
| Pitch story                                         | Lead with movement and communication, with the daily record as the base. Final wording is Claudia's draft, approved by Alberto.    |
| When parents see what the child marked              | When they open parent mode (a card), never as a notification. The child is told what parents can see.                              |
| Energy indicator                                    | **Not built.** Show only the energy answer the child marked.                                                                       |
| Wording of the confidence labels                    | The three neutral labels in section 5.3.                                                                                           |
| PIN                                                 | 4 digits, hashed with a salt, locks after 5 wrong tries, auto-locks after 90 seconds idle. It separates modes; it is not security. |
| Solo missions every day, or some "team only" days   | Solo missions always available.                                                                                                    |
| Wearable data: parent device only, or a server copy | Parent device only. A server copy only if W1 needs it (Álvaro decides), under the guardrails in section 5.6.                       |

## 10. People in the story (for the pitch)

Fictional personas, for the pitch and the demo data. Credit: first drafted in `feature/sport-pediatric-crohn` by Juan.

- **Lucas, 9.** Diagnosed recently. Hates being reminded that he is ill and hates being asked about his tummy. Wants to be a normal kid and to play with his parents.
- **Marta and Carlos, his parents.** They live with their heart in their mouth and ask too much. They do not want to be the "police" of their own child.
- **Dr Elena, paediatric gastroenterologist.** Sees Lucas every three months for twenty minutes. Gets vague answers ("some days he walked").

Do not name a drug, a dose or a clinical result for these personas.
