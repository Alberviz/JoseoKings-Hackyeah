# Clinical evidence and algorithms

Mycrohnie — wearable data (read in the parent's browser from Google Fit, kept on the device) crossed with the child check-in and the parent daily log.
Scope: what the peer-reviewed literature supports, what it does not, and the exact deterministic algorithms we implement.

|                                  |                                                                                                                                                                                                                                                                                 |
| :------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Status                           | Working document for the product owner and the engineering team. Not a decision until it is written into `docs/DECISIONS.md`.                                                                                                                                                   |
| Population                       | Children aged 8–12 with Crohn's disease or ulcerative colitis, one child per device, one family.                                                                                                                                                                                |
| Device assumption                | Generic consumer wearable. Signals assumed available: steps (per-minute and aggregated), all-day heart-rate samples (every 1–10 min, denser in activity), sleep sessions with device-labelled segments, SpO2 spot values, active minutes, calories. HRV is treated as optional. |
| **Not** approved and not changed | No medical claims, no treatment advice, no prediction of the child's future state, no punishment mechanics, no reward that depends on an answer.                                                                                                                                |

### Literature search method and its limit

Searches were run through Consensus (peer-reviewed corpus, ~220 M papers). **42 queries were planned; 19 returned results before the account's monthly search quota was exhausted.** Every paper cited below was returned by one of those 19 queries, or was carried over from the team's earlier Consensus pass recorded in `docs/proposals/WEARABLE_GOOGLE_FIT.md`. Nothing is cited from memory.

Topics that could **not** be searched before the quota ran out: change-point detection and statistical process control in health self-monitoring, permutation testing under autocorrelation, weighted kappa, wear-time validity thresholds, minimal detectable change for resting heart rate and steps, missing-data handling in momentary assessment, SpO2 accuracy in consumer devices, food diaries in IBD, school absence in paediatric IBD, and software-as-a-medical-device regulation. Where an algorithm below depends on one of those topics, it is marked **`[method only — no paper retrieved]`** and is justified as a standard statistical construction, not as an empirical finding. Those searches must be re-run when the quota resets; nothing in section 3 should be presented to a jury or a clinician as literature-backed if it carries that mark.

Three citations in Juan's `docs/BIOMEDICAL_ALGORITHMS.md` — "Kolovos et al. 2022", "Geva et al. 2020", "Ward et al. 2020" — were not found in Consensus in the earlier pass and are not used here.

---

## 1. Summary

1. The strongest IBD wearable evidence is a 309-adult cohort in which heart rate, resting heart rate, HRV, steps and oxygenation differed between flare and remission and changed in the weeks before a flare [1]; it is adult, group-level and anchored on blood and stool markers, not on one child's daily taps.
2. Lower daily step counts in active disease replicate across cohorts and reviews [1][3][5][18][19], and are the single most reproducible wearable signal in IBD.
3. The resting-heart-rate story is **not** clean: one Fitbit cohort found lower steps but **no** difference in resting heart rate before an elevated inflammatory marker [5], and 24-hour monitoring in IBD found normal nocturnal heart-rate dipping [16]. We describe nocturnal heart rate; we do not assert it tracks inflammation in a child.
4. Sleep _quality_ associates with IBD activity in meta-analyses [28][29][30][31], but the association rests mostly on cross-sectional self-report, is not reproduced in prospective cohorts [30], and objective sleep findings are mixed [29]. A systematic review in paediatric IBD concluded children with IBD may **not** have more sleep disturbance than healthy children [34].
5. In children and adolescents, the day-level link that does replicate is sleep → next-day pain, not the reverse [36][45][46][48].
6. Consumer devices measure sleep/wake, sleep timing and duration acceptably [50][53][57][58]; they do **not** measure sleep stages or wake-after-sleep-onset well enough to report (κ 0.21–0.53, specificity 29–52 %) [51][52][53]. Sleep stages, WASO and "deep sleep %" are out.
7. Circadian descriptors of heart rate and activity (cosinor mesor/amplitude/acrophase; interdaily stability, intradaily variability, M10/L5) are computable from exactly the signals we have and are established descriptors in wearable research [63][64][65][66][68][69], including in the IBD wearable cohort itself [1][6].
8. Sleep regularity is a defensible, cheap, child-appropriate descriptor [75][76][77][78] — but the published implementations disagree with each other enough to change conclusions [79], so we must fix and publish our definition.
9. Nothing in this evidence base licenses a composite index, a tier label, or a statement about what will happen next. Even the validated paediatric clinical indices correlate only weakly with endoscopic inflammation [86][88], so an app-invented composite is indefensible.
10. What we can defend: cleaned per-signal series, personal-baseline deviations, descriptive co-occurrence with explicit `n` and confidence intervals, and a correctness demonstration on synthetic data with a planted effect and a null test.

---

## 2. Evidence by signal

Confidence scale, applied to the question _"does this signal, measured by a consumer wearable on one 8–12-year-old, carry information worth putting in front of a paediatric gastroenterologist as a description?"_

- **Strong** — replicated in IBD, device measurement adequate, effect direction consistent.
- **Moderate** — replicated in IBD or an adjacent condition, but adult-only, or measurement adequate but the IBD association is inconsistent.
- **Weak** — single study, indirect population, or contested.
- **None** — no usable evidence, or the measurement is known to be inadequate. Not shipped.

### 2.1 Table

| Signal                                                                             | What is known in IBD                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Consumer-device measurement validity                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Confidence                                                                                            | Refs                                                     |
| :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------- | :------------------------------------------------------- |
| **Daily steps**                                                                    | **Adult:** fewer daily steps during inflammatory flares in a 309-person multi-device cohort [1]; lower steps in the week before an elevated CRP/calprotectin (AUC 0.70, 95 % CI 0.65–0.75) [5]; lower activity in active vs remission across a 37-study scoping review [3] and a 20-study systematic review [4]; lower-activity clusters had worse fatigue, pain-interference and disease-activity scores [18]; habitual ≈6 700 steps/day in mild-moderate Crohn's [19]. **Paediatric:** reduced steps per day reported in children with Crohn's [25]; fatigued children with IBD spent less time in moderate-to-vigorous activity (18.3 vs 37.3 min/day) [21]; but a 187-patient adult study found **no** relationship between objectively measured activity and IBD fatigue [20], and in youth with acute pain, higher daily pain went with _higher_ measured activity while self-reported limitation went the other way [27]. | Step counting is the best-validated consumer metric; heart-rate mean bias ≈3 % in the living umbrella review of wearable accuracy [49]. Wear-time is the real limit: in a paediatric IBD accelerometry study, wear-time validation was met in only 31 of 71 patients [21].                                                                                                                                                                                                                        | **Strong** (adults) / **Moderate** (children)                                                         | [1][3][4][5][18][19][20][21][25][27][49]                 |
| **Sleep duration (total sleep time)**                                              | **Adult:** poor sleep quality associates with active disease — pooled OR 3.52 (95 % CI 1.82–6.83) [28], OR 2.54 (1.85–3.49) [30], OR 2.09 (1.50–2.90) [31], OR 3.04 (2.41–3.83) [33]; but [30] reports the association only in cross-sectional, not cohort, studies and names reverse causation explicitly, and [29] found no clear objective sleep impairment. Poor sleep is also more common in _inactive_ IBD than controls [32]. **Paediatric:** shorter sleep with disease activity in adolescents [35]; PSQI correlates with PCDAI/PUCAI [37][38]; but the systematic review of 28 studies concludes children with IBD may not have more sleep disturbance than healthy children [34].                                                                                                                                                                                                                                     | Two-state sleep/wake and total sleep time are acceptable from wrist devices [50][53][57]; in children 8–16 against polysomnography, wrist placement gave total-sleep-time differences of 5–22 min and sleep-period-time differences of 1–18 min [58]; in adolescents a consumer device matched a research actigraph for duration [57].                                                                                                                                                            | **Moderate**                                                                                          | [28][29][30][31][32][33][34][35][37][38][50][53][57][58] |
| **Sleep timing and regularity**                                                    | **Adult IBD:** circadian misalignment and "social jet lag" are argued to be associated with a more aggressive disease course [82]; circadian clock-gene expression is reduced in inflamed tissue and correlates with Mayo/SES-CD and with ESR/CRP [83]; reviews place circadian disruption at the centre of IBD biology [80][81][84]. **General:** the Sleep Regularity Index predicts all-cause mortality more strongly than sleep duration [76]; moderate-certainty evidence links irregular timing to higher inflammatory markers [78]; in adolescents (mean 12.8 y, 133 nights of actigraphy) higher SRI on school days was associated with fewer later depressive symptoms [77]. No IBD-specific SRI study was retrieved.                                                                                                                                                                                                   | Sleep timing (onset/offset) is the part consumer devices get right: in children 8–16 the count-scaled algorithm gave sleep onset within 2 min (95 % CI −6 to −14) and offset within 10 min of polysomnography [58]; offset is accurate regardless of device or placement [59]. **Caveat:** two widely used open-source SRI calculators produce markedly different scores from the same data, enough to change outcome models [79].                                                                | **Moderate** (general) / **Weak** (IBD-specific)                                                      | [58][59][76][77][78][79][80][81][82][83][84]             |
| **Sleep stages, WASO, "deep sleep %"**                                             | Sleep architecture differed with inflammation and **not** with symptoms alone in the IBD wearable cohort [2] — so even if measured well it would not line up with what the child taps.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Inadequate. Epoch-by-epoch macro-F1 across 11 consumer trackers ranged 0.26–0.69 [53]; six wrist devices against polysomnography gave Cohen's κ 0.21–0.53 with wake specificity 29.4–52.2 % [51]; wrist devices over-estimate WASO by ≈13 min on average [52]; stage detection in adolescents under-estimated N3 by 21–46 min [57]; the reliability review calls for better validation before clinical use [54]. Even the best ring reached κ 0.83 only on two-state sleep/wake, not stages [55]. | **None — not shipped**                                                                                | [2][51][52][53][54][55][57]                              |
| **Resting / nocturnal heart rate**                                                 | **Adult:** marginal means for HR and RHR were higher during inflammatory and symptomatic flares, and HR/RHR changed up to 7 weeks before flares, in the 309-person cohort [1]; the scoping and systematic reviews list HR changes as possible early clues [3][4]. **Contradicted:** in 39 IBD patients with a subsequent CRP/calprotectin, daily resting heart rate did **not** differ (66.9 vs 66.3, p = 0.42) while steps did [5]; and nocturnal heart-rate dipping was no less common in IBD than controls (22 % vs 30 %, p = 0.40) [16]. Experimentally, an LPS inflammatory challenge raised HR within 1–4 h [15]. **Paediatric:** children with IBD in remission had a higher minimum heart rate than matched controls (p < 0.04) [11].                                                                                                                                                                                    | Heart rate from wrist photoplethysmography has ≈3 % mean bias [49]; resting values taken during sleep avoid the motion-artefact regime where the error is largest. No minimal-detectable-change figure for a child's night-time resting heart rate was retrieved — so we never claim a given change is "real", only that it is outside the child's own previous range.                                                                                                                            | **Moderate**                                                                                          | [1][3][4][5][11][15][16][49]                             |
| **Circadian rhythm of heart rate and activity (cosinor; IS / IV / M10 / L5 / RA)** | **Adult IBD:** circadian patterns of HRV differed between flare and remission using cosinor mixed-effect models [1]; the mesor of the SDNN circadian pattern was lower in inflammatory flare (38.2 vs 49.5, p < 0.001) in the same programme [6]. **Adjacent:** circadian heart-rate mesor rose and amplitude fell in the 21 days before heart-failure decompensation [73]; wearable activity-rhythm amplitude and stability associate with the systemic immune-inflammation index in 62 000 adults [67], and blunted rest-activity rhythm associates with white-cell inflammatory indices in NHANES [70]; delayed HR acrophase and delayed M10 onset associate with depression severity on Fitbit data [65]. Rest-activity rhythm metrics are established digital descriptors [63][66][68][69][71][72].                                                                                                                         | Computable from exactly our inputs: cosinor needs timestamped heart-rate samples [64][74]; IS/IV/M10/L5 need per-minute or hourly activity [63][68]. No paediatric-IBD validation exists. Acrophase and amplitude are sensitive to gaps, which is why the coverage rule in §3.A4 is strict.                                                                                                                                                                                                       | **Moderate** (as a descriptor) / **Weak** (as anything IBD-specific)                                  | [1][6][63][64][65][66][67][68][69][70][71][72][73][74]   |
| **SpO2 (spot values)**                                                             | Oxygenation was among the metrics altered up to 7 weeks before flares in the 309-person cohort [1]. No other IBD evidence retrieved.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | **Not searched** — the consumer-SpO2 accuracy query did not run before the quota ended. Consumer wrist SpO2 is generally considered the least accurate of the signals on offer.                                                                                                                                                                                                                                                                                                                   | **Weak — shown as raw nightly values only, never in any statistic**                                   | [1]                                                      |
| **HRV (RMSSD / SDNN), if the device exports it**                                   | **Paediatric and the best-supported signal in IBD:** in 34 children with IBD, RMSSD was higher in remission than active disease (67.7 ± 27.8 vs 45.8 ± 22.0, p = 0.022) and higher RMSSD independently associated with lower odds of exacerbation over 12 months (OR 0.941, 95 % CI 0.887–0.998) [8][9]; children with IBD in remission showed reduced time- and frequency-domain HRV vs matched controls [11]. **Adult:** meta-analysis shows lower high-frequency power in IBD vs controls [10]; HRV features differentiate flare states [1][6]; lower HRV associated with more fatigue [14]; scoping review calls it promising but under-studied [13]. In children 7–12 with abdominal-pain disorders, HRV indices associate with sleep characteristics [17].                                                                                                                                                                 | The systematic review of wearable-derived HRV and inflammation found SDNN inversely associated with CRP in 83 % of comparisons (sign test p = 0.031), but **ECG-based devices gave consistent associations and photoplethysmography-based ones did not**, and it calls wearable HRV exploratory [12]. Google Fit generally does not expose HRV.                                                                                                                                                   | **Moderate** if an ECG-grade source exists; otherwise **not shipped**                                 | [1][6][8][9][10][11][12][13][14][17]                     |
| **Child check-in: `belly-comfort` (0–2)**                                          | Abdominal pain is the item that carries most of the paediatric clinical indices [85][87], and in children with IBD it correlates strongly with sleep quality (r = 0.78 with PSQI in Crohn's) [37]. Day-level studies in youth show sleep predicting next-day pain [36][45][46][48]. **But** even the best-weighted paediatric index correlates only weakly with endoscopic severity (r = 0.39) [88] and poorly with calprotectin (r = 0.26 for wPCDAI) [86] — a child's self-report is not a window onto inflammation.                                                                                                                                                                                                                                                                                                                                                                                                           | Self-report, three drawings, one tap. No device error. "I don't feel like it today" is a valid answer and is treated as missing, never as 0.                                                                                                                                                                                                                                                                                                                                                      | **Strong** as the thing the family wants recorded; **None** as an inflammation measure                | [36][37][45][46][48][85][86][87][88]                     |
| **Child check-in: `energy` (0–2)**                                                 | Fatigue is highly prevalent in paediatric IBD, including in remission (29 % severe self-reported) [26]; it relates to biological, functional and behavioural factors together [25]; in 127 children, transdiagnostic factors (sleep quality, physical activity, pain, mood, school absence) explained 78 % of fatigue variance while disease-focused factors explained little [26]; biological markers did not discriminate fatigued from non-fatigued children [21]. Symptom-cluster work identifies an "Impaired Energy" profile (sleep disturbance + fatigue) in adolescents with IBD [40].                                                                                                                                                                                                                                                                                                                                   | Self-report. Note the asymmetry: fatigue questionnaires and objective activity disagree [20][27], so `energy` and `steps` are reported side by side, never merged.                                                                                                                                                                                                                                                                                                                                | **Strong** as a recorded symptom                                                                      | [20][21][25][26][27][40]                                 |
| **Child check-in: `play-pace` (0–2)**                                              | Closest published analogue is the Child Activity Limitations Interview, which within-person tracks daily pain (β = 0.23, p < 0.001 routine subscale) while diverging from measured activity [27]. Activity participation drops with IBD symptoms, with self-esteem, body image and active symptoms named as barriers [22].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Self-report.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | **Moderate**                                                                                          | [22][27]                                                 |
| **Parent log: `sleepHours`**                                                       | Parent-reported and device-measured sleep are not interchangeable: parents estimated their 8–9-year-olds went to bed 36 min earlier and slept 36.5 min longer than actigraphy, with weak correlation and insufficient agreement [62]. In paediatric IBD, children self-reported significantly more sleep disturbance than their parents observed (p < 0.0001) [38].                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Human estimate. Kept as its own variable, never substituted for the wearable value, and never averaged with it.                                                                                                                                                                                                                                                                                                                                                                                   | **Moderate** (as a parent perception)                                                                 | [38][62]                                                 |
| **Parent log: `school`**                                                           | School absence and school pressure were among the transdiagnostic factors significantly associated with fatigue in 127 children with IBD [26]; impairment in school attendance is listed as a core consequence of paediatric IBD [22]. The dedicated school-absence search did not run.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Categorical, parent-entered. Four levels: `attended`, `left-early`, `missed`, `no-school`. `no-school` is **not** an ordinal level and is excluded from any ordinal analysis.                                                                                                                                                                                                                                                                                                                     | **Moderate**                                                                                          | [22][26]                                                 |
| **Parent log: `medicationTaken`**                                                  | No retrieved paper supports inferring anything from a yes/partly/no adherence flag in this population. Reported as counts only, never crossed with symptoms.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Categorical, parent-entered, never a drug name or dose.                                                                                                                                                                                                                                                                                                                                                                                                                                           | **None — counts only**                                                                                | —                                                        |
| **Reactive food diary**                                                            | **Not searched** (quota). No paper retrieved supports naming any food as a cause of a symptom day. The product rule already forbids it. The deeper problem is structural: entries are requested _only_ on discomfort days, so the data has no comparison group and no association is estimable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Free text and tags, parent-entered.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | **None — counts only, see §3.A10**                                                                    | —                                                        |
| **Missions (self-reported, with company label)**                                   | Structured exercise programmes improved quality of life (SMD 0.55, 95 % CI 0.30–0.80) in a 21-study before-after meta-analysis [24], and a 12-week lifestyle programme improved bowel symptoms, quality of life and fatigue in 15 children with IBD [23]. Those are **interventions under supervision**, not an inference we can make from a child tapping "I did it". Observationally, objective activity and fatigue showed no relationship in 187 adults [20].                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Self-report with the three existing confidence labels. Never presented as measured, even when the wearable is on.                                                                                                                                                                                                                                                                                                                                                                                 | **Strong** as a trial-level rationale for offering gentle movement; **None** as a day-level inference | [20][23][24]                                             |

### 2.2 Claims we drop, and why

| Claim (from `docs/BIOMEDICAL_ALGORITHMS.md` or the Google Fit proposal)                                                                                            | What the retrieved literature says                                                                                                                                                                                                                                       |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Elevation in RHR of +5 to +10 bpm above personal baseline" during inflammation.                                                                                   | No retrieved paper gives that figure. [1] reports higher marginal means without a per-person bpm threshold; [5] found **no** resting-heart-rate difference; [16] found normal nocturnal heart-rate dipping in IBD. Drop the number and the directional certainty.        |
| "Step counts drop >30 % 48–72 hours prior to severe symptom reporting."                                                                                            | No retrieved paper gives a 30 % threshold or a 48–72 h window. [5] reports lower steps over _the week before_ an elevated marker, as a group mean (6 062 vs 8 541). Drop the threshold and the lead time.                                                                |
| WASO as "a direct marker of nocturnal bowel urgency or pain".                                                                                                      | Consumer WASO is over-estimated by ≈13 min [52] with wake specificity 29–52 % [51]. Drop the variable entirely.                                                                                                                                                          |
| `DeepSleep_pct` "correlates with tissue repair".                                                                                                                   | Stage agreement is fair-to-moderate at best [51][53][54]; and in IBD, sleep architecture moved with inflammation, not with symptoms [2]. Drop.                                                                                                                           |
| Biometric Stability Index 0–100 with weights 0.40 / 0.35 / 0.25 and tiers "Stable / Mild Perturbation / Active Vulnerability Window… flagged for clinical review". | No source for the weights, no validation, and the tier names read as clinical classification. Also contradicted upstream: validated paediatric indices built by expert consensus and mathematical weighting still correlate only weakly with endoscopy [86][88]. Drop.   |
| Composite \(S(t) = \text{belly} + \text{energy} + \text{play pace}\).                                                                                              | Summing three unvalidated ordinal items creates a scale nobody has studied; the three items demonstrably behave differently (fatigue tracks transdiagnostic factors [26], pain tracks sleep [36][45]). Analyse each item separately.                                     |
| "Lead Warning Indicator", "predict weeks before".                                                                                                                  | [1] is a 309-adult group-level finding against laboratory markers. It does not transfer to one child's daily taps. Out of scope regardless of evidence.                                                                                                                  |
| Mechanism paragraphs (cholinergic anti-inflammatory pathway, tight junctions, myokines) used to justify the missions.                                              | Not needed to describe co-occurrence, and in a consumer app they read as a claim that movement acts on the disease. Keep the mechanism out of the product; the honest rationale for missions is the intervention trials [23][24] plus the fact that families ask for it. |
| Forward-fill with the 14-day median and linear interpolation of steps for gaps ≤1 day.                                                                             | Creates values that were never measured and then feeds them into correlations. No imputation anywhere (§4).                                                                                                                                                              |

---

## 3. Algorithm catalogue

Conventions used throughout.

- **Day** means the local calendar day in the family's IANA time zone, stored on every record. A sleep session is attributed to the local day on which it **ends**.
- \(x_t\) is a daily value for a signal; \(t\) indexes calendar days, including days with no data.
- A missing day is `null`. It is never filled, never interpolated, never carried forward.
- Every stochastic procedure takes an explicit integer seed and is reproducible.
- "Output wording" is the only wording allowed in the UI or the report for that algorithm. Wording changes need the product owner.
- Effort is TypeScript implementation **including Vitest tests**, by one engineer who already knows the codebase.

Algorithms marked **[server]** are heavier statistics that are not in the first version. Everything is computed on the device; nothing is sent to a server.

### 3.0 — Build order and effort

| Id   | Algorithm                                      |     Effort | Priority                                                    |
| :--- | :--------------------------------------------- | ---------: | :---------------------------------------------------------- |
| A0   | Valid-day / wear-time rule                     |      1.0 h | **MVP tonight**                                             |
| A1   | Hampel cleaning                                |     0.75 h | **MVP tonight**                                             |
| A2   | Personal baseline, robust deviation            |     0.75 h | **MVP tonight**                                             |
| A3   | Nocturnal resting heart rate                   |      1.0 h | **MVP tonight**                                             |
| A9   | "Outside the usual range" days                 |      0.5 h | **MVP tonight**                                             |
| A13  | Steady-day / answered-day counts               |      0.5 h | **MVP tonight**                                             |
| A14  | Consultation-to-consultation windows           |      1.0 h | **MVP tonight**                                             |
| A12  | Missions vs next-day energy                    |      0.5 h | **MVP tonight**                                             |
| A10a | Food co-occurrence, counts only                |     0.75 h | **MVP tonight**                                             |
| 3.V  | Synthetic generator + planted/null/gap harness |      2.5 h | **MVP tonight**                                             |
|      | **Critical path subtotal**                     | **9.25 h** |                                                             |
| A7   | Lagged Spearman + permutation + bootstrap      |      2.5 h | **MVP tonight only if a second engineer works in parallel** |
| A4   | Cosinor, per day and per week                  |      1.5 h | After the hackathon                                         |
| A5   | IS / IV / M10 / L5 / RA                        |      1.5 h | After the hackathon                                         |
| A6   | Sleep Regularity Index                         |     1.25 h | After the hackathon                                         |
| A8   | CUSUM change point                             |     1.25 h | After the hackathon                                         |
| A11  | Child vs parent weighted kappa                 |      1.0 h | After the hackathon, needs a product decision first         |
| A10b | Food 2×2 with Fisher exact                     |      1.0 h | After the hackathon, needs a product decision first         |
| A15  | HRV, if the device exports it                  |      0.5 h | Conditional on the data existing                            |

Hacking ends at 11:00 on 4 October. The critical path is 9.25 h for one engineer, which fits only if nothing else is attempted; A7 is the first thing to hand to a second person, because it is the output the demo actually shows.

---

### A0 — Valid-day / wear-time rule

|              |                                                                                                                                                                                                                                                                              |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | For the doctor: every figure in the report is attached to a count of days that actually carried data, so a "median" over 4 nights is never mistaken for a median over 40. For the parent: an honest "we do not have enough days yet" instead of a number built from nothing. |
| **Inputs**   | `heartRateSamples[]` (timestamp, bpm), `stepsPerMinute[]`, `sleepSessions[]` (start, end, segments), `checkIn` (`bellyComfort`, `energy`, `playPace` each in {0,1,2} or `notToday`), parent log fields, time zone.                                                           |
| **Priority** | **MVP tonight.** Everything else depends on it.                                                                                                                                                                                                                              |
| **Effort**   | 1.0 h                                                                                                                                                                                                                                                                        |

**Definition.** Let \(H_d\) be the set of distinct local clock hours in \([07{:}00, 23{:}00)\) on day \(d\) that contain at least one heart-rate sample.

- **Daytime validity** (gates steps, active minutes, calories, daytime heart rate, cosinor, IS/IV): \(|H_d| \ge 10\). Ten hours is the long-standing wear-time convention in accelerometry; the paediatric IBD study that applied it lost 40 of 71 participants to it [21], which is exactly why the count must be reported.
- **Night validity** (gates nocturnal heart rate, sleep duration, sleep timing, SRI): a main sleep session exists with onset in \([18{:}00, 04{:}00)\), duration \(\ge 180\) min, offset \(\le 14{:}00\), and at least 20 heart-rate samples inside it covering \(\ge 120\) distinct minutes.
- **Check-in validity:** at least one of the three items is in {0,1,2}. Each item is independently missing when the child answered "I don't feel like it today".
- **Main sleep from the source app** [adapted 2026-10-04 for 30-min sampling wearables]: sleep points carry `metadata.mainSleep`. When the source app flags a session as the main sleep, the longest flagged session of the night is the main sleep and the onset \([18{:}00, 04{:}00)\) and offset \(\le 14{:}00\) windows are skipped (in the real capture, 9 of 16 main sleeps started at 04:00 or later). Duration \(\ge 180\) min and the heart-rate coverage still apply. Without the flag, the rules above stay as written.
- **Sparse heart-rate sampling** [adapted 2026-10-04 for 30-min sampling wearables]: the mode comes from the data, not the device. If the median gap between consecutive heart-rate readings inside the main sleep is more than 5 minutes, the coverage rule becomes \(\ge 6\) readings spanning \(\ge 150\) minutes (a wearable that records about every 30 minutes during sleep gives about 16 readings in 500 minutes). A median gap of 5 minutes or less keeps the \(\ge 20\) samples / \(\ge 120\) minutes rule.
- **Multi-session nights:** the main sleep session is the longest; shorter sessions on the same night are discarded for duration and kept only for the sleep/wake epoch vector used by the SRI.
- **DST days** (23 h or 25 h local) stay valid for daily totals, carry a `dstShift` flag, and are **excluded** from cosinor (A4) and IS/IV (A5), where a 24-hour period is assumed.

**Minimum data.** None — this rule is what produces the counts.

**Output wording.** "The wearable had enough data on 46 of the 61 days in this period (38 of 61 nights)."

**Synthetic validation.** Generate 60 days with a controlled pattern of removals: whole missing days, partial days with exactly 9 and exactly 10 covered hours, nights of 179 and 181 min, a 25-hour DST day. Assert the validity flags match the planted truth exactly. Null test is not applicable (deterministic).

**Evidence.** [21] for the consequence of the rule in this exact population; [49] for why heart-rate coverage is the right proxy for wear. The 10-hour threshold itself is **`[method only — no paper retrieved]`** in this session.

---

### A1 — Hampel cleaning

|              |                                                                                                                                                                                                    |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Remove isolated sensor spikes (a loose wearable giving 150 bpm at 3 a.m., a step burst from a car ride) without flattening genuine multi-day changes, which are the thing the doctor wants to see. |
| **Inputs**   | One daily series \(x_t\) with gaps, per signal.                                                                                                                                                    |
| **Priority** | **MVP tonight.**                                                                                                                                                                                   |
| **Effort**   | 0.75 h                                                                                                                                                                                             |

**Definition.** Centred window of \(W = 7\) days (indices \(k-3 \dots k+3\)), using only valid days inside it; at least 5 non-missing values required, otherwise no replacement is attempted.

$$m_k = \operatorname{median}\left(\{x_i\}_{i \in W_k}\right), \qquad \mathrm{MAD}_k = \operatorname{median}\left(\{|x_i - m_k|\}_{i \in W_k}\right), \qquad \sigma_k = 1.4826\,\mathrm{MAD}_k$$

$$x_k^{*} = \begin{cases} m_k & \text{if } \sigma_k > 0 \text{ and } |x_k - m_k| > 3\sigma_k \\ x_k & \text{otherwise} \end{cases}$$

Defaults: \(W = 7\), threshold \(3\sigma\). The \(\sigma_k = 0\) guard matters: a child with seven identical step-rounded days would otherwise have every value replaced.

**Minimum data.** 5 valid days inside the window.

**Output wording.** The report footer states: "3 single-day readings were replaced by the surrounding median because they were far outside the rest of the week."

**Synthetic validation.** Planted: a clean series with 4 injected spikes at known indices → assert exactly those 4 are replaced. Null: a series with a genuine step change of \(2\sigma\) sustained for 10 days → assert zero replacements inside the plateau (the filter must not erase real change). 1 000 pure-noise series → false-replacement rate below 1 %.

**Evidence.** `[method only — no paper retrieved]`. Standard robust filter; inherited from `Kinexis.m` practice and from Juan's draft, which is the one part of that pipeline that survives review.

---

### A2 — Personal baseline and robust deviation

|              |                                                                                                                                                                                                                                     |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Make every comparison _this child versus this child last fortnight_, never this child versus a population. An 8-year-old and a 12-year-old have different resting heart rates and step habits; fixed cut-offs would be meaningless. |
| **Inputs**   | Cleaned daily series \(x_t^{*}\).                                                                                                                                                                                                   |
| **Priority** | **MVP tonight.**                                                                                                                                                                                                                    |
| **Effort**   | 0.75 h                                                                                                                                                                                                                              |

**Definition.** Trailing window of the **previous 14 valid days**, strictly excluding day \(t\) (a day is never compared against its own future):

$$\tilde{x}_t = \operatorname{median}\left(x^{*}_{t-1}, \dots\right)_{14\ \text{valid}}, \qquad \mathrm{IQR}_t = Q_3 - Q_1, \qquad s_t = \max\!\left(0.7413\,\mathrm{IQR}_t,\ s_{\min}\right)$$

$$D_t = \frac{x_t^{*} - \tilde{x}_t}{s_t}$$

The factor 0.7413 makes \(s_t\) consistent with the standard deviation under a Gaussian. The floor \(s_{\min}\) rules out division by a near-zero spread: defaults `nocturnalHr` 1.5 bpm, `steps` 300, `sleepMinutes` 15, `sleepMidpointMinutes` 15.

\(D_t\) is **internal**. It is never rendered as a number, a score or a colour scale. It feeds A8 and A9 only, and those emit words.

**Minimum data.** 14 valid days before day \(t\). Before that the engine returns `collecting-baseline`.

**Output wording.** "Still collecting the first two weeks for this child." Afterwards, only the three bands: "below the child's usual range" (\(D_t < -2\)), "within the child's usual range", "above the child's usual range" (\(D_t > 2\)).

**Synthetic validation.** Planted: series with a known mean shift at day 30 → assert \(D_t\) crosses ±2 within 3 days of the shift and returns inside the band once 14 post-shift days have accumulated (the baseline must re-centre). Null: 1 000 stationary series → proportion of days with \(|D_t| > 2\) below 6 %.

**Evidence.** The need for per-person baselines rather than fixed thresholds in children follows from the age-dependence of all these signals; no retrieved paper gives paediatric wearable norms for IBD, which is itself the argument. `[method only — no paper retrieved]` for the robust-scale construction.

---

### A3 — Nocturnal resting heart rate

|              |                                                                                                                                                                                                                                  |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | One nightly number that is comparatively free of motion artefact and of what the child did that day. For the doctor: a per-night level that can be compared with the child's own previous nights across a consultation interval. |
| **Inputs**   | `heartRateSamples[]` inside the main sleep session of a night-valid day (A0).                                                                                                                                                    |
| **Priority** | **MVP tonight.**                                                                                                                                                                                                                 |
| **Effort**   | 1.0 h                                                                                                                                                                                                                            |

**Definition.** Inside the main sleep session \([t_0, t_1]\):

1. Resample to one value per minute, \(h_m = \operatorname{median}\) of samples falling in minute \(m\); minutes with no sample stay missing.
2. For every 30-minute window \(W\) fully inside \([t_0, t_1]\), compute \(\bar{h}_W\) over the non-missing minutes, requiring \(\ge 20\) of the 30.
3. $$\mathrm{nRHR}_d = \min_{W} \bar{h}_W$$
4. Also record \(\mathrm{nHR}^{\text{mean}}_d\) = mean of \(h_m\) over \([t_0 + 30\,\text{min},\ t_1 - 30\,\text{min}]\), and \(n^{\text{cov}}_d\) = number of covered minutes.

If the device exposes its own resting-heart-rate field, store it **as a separate variable** with its own source label; never merge the two.

**Minimum data.** \(\ge 120\) covered minutes and \(\ge 4\) qualifying 30-minute windows in the session.

**Sparse mode** [adapted 2026-10-04 for 30-min sampling wearables]. If the median gap between consecutive readings in the session (after the per-minute step) is more than 5 minutes, the 30-minute windows cannot be filled, so the figure is the lowest mean of 3 consecutive readings in time order: \(\mathrm{nRHR}_d = \min_i \tfrac{1}{3}(h_i + h_{i+1} + h_{i+2})\), rounded to 0.1. It needs \(\ge 6\) readings spanning \(\ge 150\) minutes. It is less precise than the dense version and the result carries `method: "sparse-3-readings"` (dense: `"dense-30min"`), shown next to the figure and counted per method in the doctor report. A median gap of exactly 5 minutes is dense. This is an adaptation for a wearable that records about every 30 minutes during sleep; it is not a published method.

**Output wording.** "Night-time heart rate, lowest 30-minute average: 62 bpm (median over the 38 valid nights in this period: 64 bpm, IQR 61–68). Recorded by the wearable; not a clinical measurement."

**Synthetic validation.** Planted: a synthetic night with a known U-shaped heart-rate curve plus noise and a 20-minute artefact spike → assert \(\mathrm{nRHR}\) lands within 1 bpm of the planted trough and is unaffected by the spike. Gap test: delete 25 % of samples at random → the value must change by less than 1 bpm or the night must be rejected. Null: 1 000 flat-plus-noise nights → the distribution of \(\mathrm{nRHR}\) must be centred below the mean by the expected order statistic, with no drift as a function of sample density.

**Evidence.** Higher HR and RHR during flares in the 309-person cohort [1]; ≈3 % heart-rate bias in consumer devices [49]; higher minimum heart rate in children with IBD in remission vs controls [11]. Counter-evidence that must be stated in the report footnote: no resting-heart-rate difference before elevated markers in [5], and normal nocturnal heart-rate dipping in IBD [16].

---

### A4 — Single-component cosinor, per day and per week **[server]**

|              |                                                                                                                                                                                                                                                                                                                                     |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Three interpretable numbers per period that summarise the _shape_ of the child's 24-hour heart-rate or activity curve, not just its level: mesor (rhythm-adjusted mean), amplitude (how pronounced the day/night difference is), acrophase (when the peak falls). This is the method used on the IBD wearable cohort itself [1][6]. |
| **Inputs**   | `heartRateSamples[]` (full day), or `stepsPerMinute[]` aggregated to 1-minute activity, for a day-valid day.                                                                                                                                                                                                                        |
| **Priority** | **After the hackathon** for the per-day version; the per-week version is a stretch goal for tonight if A0–A3 and A7 are done.                                                                                                                                                                                                       |
| **Effort**   | 1.5 h                                                                                                                                                                                                                                                                                                                               |

**Definition.** With \(t_i\) the local time of sample \(i\) in hours and \(\omega = 2\pi/24\):

$$y_i = M + A\cos\!\left(\omega\,(t_i - \varphi)\right) + \varepsilon_i$$

Fitted by ordinary least squares in the linearised form \(y_i = M + \beta\cos(\omega t_i) + \gamma\sin(\omega t_i)\), giving

$$\hat{A} = \sqrt{\hat{\beta}^2 + \hat{\gamma}^2}, \qquad \hat{\varphi} = \frac{24}{2\pi}\,\operatorname{atan2}(-\hat{\gamma},\ \hat{\beta}) \bmod 24$$

Report the percent rhythm \(R^2\) and the zero-amplitude \(F\) statistic on \((2,\ n-3)\) degrees of freedom. If the zero-amplitude test does not reach \(p < 0.05\), report "no clear 24-hour pattern in this period" and suppress \(\hat{A}\) and \(\hat{\varphi}\).

**Coverage rule (this is where cosinor goes wrong).** Split the day into six 4-hour blocks. Require \(\ge 48\) samples, \(\ge 12\) distinct clock hours, and \(\ge 1\) sample in at least 5 of the 6 blocks. Without it, an amplitude can be manufactured by a gap. DST days are excluded (A0).

Weekly version: pool 7 consecutive day-valid days (no gaps longer than 1 day inside the window) and fit the same model with time-of-day as the predictor.

**Minimum data.** Per day: the coverage rule above. Per week: 5 of 7 days day-valid.

**Output wording.** Doctor page only. "Average heart rate across the 24-hour cycle in this period: 82 bpm. Day-night swing: 14 bpm. Peak around 16:40 local time. Fitted on 41 days with enough coverage; 20 days had too little." No comparison to any norm, no statement about what a given amplitude means.

**Synthetic validation.** Planted: generate samples from a known \((M, A, \varphi)\) with Gaussian noise and realistic irregular sampling → assert recovered \(\hat{M}\) within 0.5 bpm, \(\hat{A}\) within 1 bpm, \(\hat{\varphi}\) within 20 minutes. Gap test: delete the 02:00–08:00 block → assert the coverage rule rejects the day rather than returning a distorted amplitude. Null: 1 000 days of pure noise with no rhythm → the zero-amplitude test fires on at most ≈5 %.

**Evidence.** Cosinor on wearable resting heart rate with exactly these three parameters [64]; cosinor on wearable photoplethysmography heart rate [74]; cosinor mixed models on HRV in the IBD cohort [1][6] and in a wearable COVID cohort by the same group [7]; mesor/amplitude/acrophase from a wrist device preceding heart-failure decompensation [73]; HR acrophase as a wearable feature associated with depression severity [65]; cosinor as a scalable rhythm biomarker [66]; methodological overview of parametric vs non-parametric rhythm analysis [63].

---

### A5 — Non-parametric rest-activity rhythm: IS, IV, M10, L5, RA **[server]**

|              |                                                                                                                                                                                                                                                                                                 |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Describe how _stable_ the child's day-to-day activity pattern is (IS), how _fragmented_ it is within a day (IV), and how separated the active and rest parts of the day are (RA), without assuming a cosine shape. These are the standard descriptors in the rest-activity literature [63][68]. |
| **Inputs**   | `stepsPerMinute[]` over \(N\) consecutive day-valid days.                                                                                                                                                                                                                                       |
| **Priority** | **After the hackathon.**                                                                                                                                                                                                                                                                        |
| **Effort**   | 1.5 h                                                                                                                                                                                                                                                                                           |

**Definition.** Bin activity into hourly means, giving \(x_1 \dots x_{Np}\) with \(p = 24\) bins per day, grand mean \(\bar{x}\), and hour-of-day means \(\bar{x}_h\) (\(h = 1\dots p\)) averaged across the \(N\) days:

$$\mathrm{IS} = \frac{N \sum_{h=1}^{p} \left(\bar{x}_h - \bar{x}\right)^2}{p \sum_{i=1}^{Np} \left(x_i - \bar{x}\right)^2}, \qquad \mathrm{IV} = \frac{Np \sum_{i=2}^{Np} \left(x_i - x_{i-1}\right)^2}{(Np-1) \sum_{i=1}^{Np} \left(x_i - \bar{x}\right)^2}$$

IS lies in \([0,1]\) (higher = more stable from day to day); IV is typically in \([0,2]\) (higher = more fragmented).

M10 = mean activity over the most active continuous 10 hours; L5 = mean over the least active continuous 5 hours, both found by scanning the 24-hour profile averaged over the \(N\) days; and

$$\mathrm{RA} = \frac{\mathrm{M10} - \mathrm{L5}}{\mathrm{M10} + \mathrm{L5}}$$

M10 onset and L5 onset (clock times) are reported alongside.

**Minimum data.** 7 consecutive days, of which \(\ge 7\) are day-valid, and no hourly bin missing in more than 2 of the days. Hours with no data are excluded from their bin's mean; a bin missing on more than 2 days invalidates the window. (NHANES-based work accepts \(\ge 4\) valid days [68][71]; we require 7 because we have one child, not a cohort.)

**Output wording.** Doctor page only. "Across these 7 days the child's activity pattern repeated from day to day with a stability index of 0.62, and the most active 10 hours began around 09:20. Based on 7 days with enough wearable data."

**Synthetic validation.** Planted: construct a perfectly repeating square-wave day → assert IS → 1 and IV → small; construct independent random days → assert IS → ≈1/N. Construct a profile with a known 10-hour active block → assert M10 onset is recovered exactly. Null: 1 000 random profiles → the distribution of IS must match its known null mean, with no dependence on \(N\) beyond the analytic one.

**Evidence.** Method and comparison of approaches [63]; population reference behaviour of IS/IV/M10/L5/RA [68][69][71][72]; associations of rhythm amplitude and stability with inflammatory indices [67][70]; M10 onset as a wearable feature in a longitudinal mHealth cohort [65].

---

### A6 — Sleep Regularity Index

|              |                                                                                                                                                                                                                                                                          |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | One number for how consistently the child sleeps at the same clock times. It uses only the two-state sleep/wake classification that consumer devices actually get right [50][53][57][58], and it is the sleep metric with the best general-population evidence [76][78]. |
| **Inputs**   | Per-minute sleep/wake vector \(s_{d,j} \in \{\text{sleep}, \text{wake}\}\) for \(M = 1440\) minutes on each of \(N\) consecutive days, derived from `sleepSessions[]` (all segments that are not `awake` count as sleep; everything outside a session is wake).          |
| **Priority** | **After the hackathon.**                                                                                                                                                                                                                                                 |
| **Effort**   | 1.25 h                                                                                                                                                                                                                                                                   |

**Definition.**

$$\mathrm{SRI} = -100 + \frac{200}{M\,(N-1)} \sum_{d=1}^{N-1} \sum_{j=1}^{M} \delta\!\left(s_{d,j},\, s_{d+1,j}\right), \qquad \delta(a,b) = \begin{cases}1 & a = b\\ 0 & a \neq b\end{cases}$$

Range \([-100, 100]\); 100 is identical sleep/wake state at every minute-of-day on consecutive days.

**Implementation is part of the definition.** Two published open-source calculators give materially different SRI values from the same accelerometry, enough to change outcome models [79]. We therefore fix: \(M = 1440\) one-minute epochs; day boundary at local midnight; consecutive-day pairs only (a missing day breaks the pair, it does not bridge it); naps counted as sleep; the denominator counts only the pairs actually used. The report prints the parameter set next to the number.

**Minimum data.** 7 consecutive days with \(\ge 1\,380\) of 1 440 minutes classified on each, i.e. at least 6 usable day-pairs.

**Output wording.** "Over these 7 days the child was asleep or awake at the same time of day on 84 % of matched minutes (sleep regularity index 84, 6 day-pairs used)." No benchmark, no "good"/"bad".

**Synthetic validation.** Planted: identical schedules on all days → SRI = 100 exactly; perfectly alternating opposite schedules → SRI = −100; a schedule shifted by a known 90 minutes each night → SRI matches the analytically computed value. Gap test: remove day 4 → assert the day-pair count drops by 2 and the value is recomputed on the remaining pairs, not bridged. Null: random independent schedules → SRI ≈ 0.

**Evidence.** Definition and large-cohort use [75][76]; systematic review across outcomes and regularity metrics [78]; the only retrieved paediatric/adolescent application, 46 adolescents over ~133 nights [77]; reproducibility warning [79]; the two-state validity that makes it computable on consumer data [50][53][57][58][59].

---

### A7 — Lagged Spearman with permutation max-statistic and bootstrap CI **[server]**

|              |                                                                                                                                                                                                                                                                     |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**  | The core cross-variable output: does a wearable signal on day \(t-\ell\) move together with what the child marked on day \(t\)? For the doctor, a table of co-occurrences with honest uncertainty. For the parent, one or two sentences in plain words, or nothing. |
| **Inputs**   | Cleaned daily wearable series (default set: `nocturnalHr`, `steps`, `sleepMinutes`, `sleepMidpointMinutes`), and the three child items each on its own.                                                                                                             |
| **Priority** | **MVP tonight if two people work in parallel**; otherwise first thing after.                                                                                                                                                                                        |
| **Effort**   | 2.5 h                                                                                                                                                                                                                                                               |

**Definition.**

1. **Pairing.** For lag \(\ell \in \{0, 1, 2\}\) build pairs \((X_{t-\ell},\ Y_t)\). Lag 1 on `sleepMinutes` means the night before the answer; lag 1 on `steps` means the day before. Pairs where either side is missing are dropped. "I don't feel like it today" is missing.
2. **Statistic.** Spearman \(\rho\) with midranks for ties (the child items take only three values, so ties dominate and the shortcut \(1 - 6\sum d_i^2 / (n(n^2-1))\) is **wrong** here — use the Pearson correlation of midranks).
3. **Family.** \(K = 4 \text{ wearable signals} \times 3 \text{ child items} \times 3 \text{ lags} = 36\) cells. Significance is assessed for the family, never per cell.
4. **Permutation, max-statistic, block-preserving.** Daily symptom series are autocorrelated; shuffling single days inflates significance. Use a **circular block permutation** of the child-answer series with block length \(b = 7\) days, \(B = 10\,000\) replicates, seed fixed:

$$p_{\text{family}}(k) = \frac{1 + \#\left\{r : \max_{j \in 1..K} \left|\rho_j^{(r)}\right| \ \ge\ \left|\rho_k^{\text{obs}}\right|\right\}}{1 + B}$$

5. **Interval.** Moving-block bootstrap, block length 7, 2 000 resamples, seeded, percentile 95 % CI for every \(\rho\) that is displayed.
6. **Display rule.** Only cells with \(p_{\text{family}} < 0.05\) are discussed in prose; all 36 cells with their \(n\) are available on the doctor page as a table.

**Minimum data.** 21 complete pairs in a cell. Below that the cell returns `insufficient-data`. With 21 pairs, a family-wise permutation test over 36 cells needs roughly \(|\rho| > 0.65\) to clear the threshold — the report says so, so nobody reads a null result as "no relationship".

**Output wording.**
Doctor: "Nights with less sleep than this child's usual were followed by a day marked as uncomfortable more often than chance would give: Spearman ρ = −0.58 (95 % CI −0.76 to −0.31), n = 34 paired days, family-wise p = 0.012 across 36 comparisons. Descriptive co-occurrence over the period; direction of influence is not established."
Parent: "On 5 of the 7 days the child marked tummy discomfort, the wearable had recorded less sleep than usual the night before (34 days with both pieces of information)." Never a coefficient, never a cause, never a forecast.

**Synthetic validation.** Planted: 60 days in which `sleepMinutes` at lag 1 shifts the probability of `bellyComfort ≥ 1` by a known amount, with 15 % missing days and injected spikes → assert the engine finds lag 1 for that pair and no other cell. Null: 1 000 generated datasets with no planted effect → assert the engine reports at least one significant cell in at most ≈5 % of them (this is the number we quote as our false-alarm rate, and it is measured, not assumed). Gap test: a dataset with gaps must give exactly the same \(\rho\) as the same dataset with the gap days deleted. Autocorrelation test: generate symptom series with AR(1) \(\phi = 0.6\) and independent wearable series → assert the block permutation holds the false-alarm rate near 5 % while a naive single-day shuffle does not (this test is the justification for \(b = 7\)).

**Evidence.** The day-level design — a nightly sleep variable predicting next-day symptom — is the design used in the paediatric literature: sleep onset latency associated with next-day pain in 25 youths with IBD [36]; actigraphy sleep efficiency associated with next-day pain in paediatric sickle-cell disease [46]; nighttime sleep and WASO predicting next-day pain in adolescents with chronic pain [45]; sleep quality predicting next-day pain intensity after paediatric surgery [48]; day-to-day sleep–pain associations in adults [47]. The direction asymmetry (sleep → pain more than pain → sleep) is reported in [45][48] and is why lag 1 and 2 on sleep are the pre-specified cells of interest rather than a free search. The ordinal, tie-heavy nature of the child items forces a rank method. The block permutation and the moving-block bootstrap are **`[method only — no paper retrieved]`** in this session.

---

### A8 — Change-point detection (two-sided CUSUM) on a personal series **[server]**

|              |                                                                                                                                                                                                                                                                     |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Purpose**  | For the doctor, in a consultation that covers three months: "something in this child's own night-time heart rate changed level around this date, and stayed changed", with the date and the before/after medians. It answers "when", not "why" and not "what next". |
| **Inputs**   | \(D_t\) from A2 for one signal, over valid days only.                                                                                                                                                                                                               |
| **Priority** | **After the hackathon.**                                                                                                                                                                                                                                            |
| **Effort**   | 1.25 h                                                                                                                                                                                                                                                              |

**Definition.** Tabular CUSUM with slack \(k\) and decision interval \(h\), \(C^{+}_{0} = C^{-}_{0} = 0\):

$$C^{+}_{t} = \max\!\left(0,\ C^{+}_{t-1} + D_t - k\right), \qquad C^{-}_{t} = \max\!\left(0,\ C^{-}_{t-1} - D_t - k\right)$$

Signal when \(C^{+}_{t} > h\) or \(C^{-}_{t} > h\). Defaults \(k = 0.5\) (tuned to detect a shift of about one robust SD) and \(h = 5\). The estimated change date is the last day before the signal on which the firing statistic was 0. After a signal, both statistics reset and a 14-valid-day refractory period applies, so one shift produces one statement.

**Warm-up.** No signal before 28 valid days of \(D_t\) exist (14 for the baseline in A2, 14 more for the chart).

**Calibrating \(h\) honestly.** Textbook average-run-length tables assume independent Gaussian data; our \(D_t\) is neither. We set \(h\) by simulation: generate 10 000 null series with the same length, missingness pattern and AR(1) structure as the child's actual series, and choose the smallest \(h\) whose empirical false-signal rate over a 90-day window is \(\le 5\%\). The chosen \(h\) and that rate are printed in the report footer.

**Minimum data.** 28 valid days before any signal; at least 10 valid days on each side of the estimated change date before it is reported.

**Output wording.** "Since 12 March, this child's lowest 30-minute night-time heart rate has sat above their own previous range: median 72 bpm over the 18 valid nights since that date, against 65 bpm (IQR 63–68) over the 24 valid nights before it. This is a description of the wearable recording over this period. It is not an assessment of the child's condition." No colour, no alert, no notification — the statement appears only when the parent or the clinician opens the report.

**Synthetic validation.** Planted: a step change of known size at a known day → assert the signal fires within 7 valid days and the estimated change date is within 5 days of truth, across 1 000 repetitions, and report the median detection delay. Null: 1 000 stationary AR(1) series of the same length → false-signal rate \(\le 5\%\) per 90-day window. Drift test: a slow linear drift must **not** be reported as a step change date; assert the wording path for drift is not taken.

**Evidence.** `[method only — no paper retrieved]` — the change-point and statistical-process-control searches did not run. Clinical motivation for watching a level change in a personal heart-rate or step series comes from [1][3][4][5][73]. **This algorithm must not be described to a clinician or a jury as evidence-based until the methods search is re-run.**

---

### A9 — "Outside the usual range" days (Shewhart-style individuals chart)

|              |                                                                                                                                                                    |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | The simplest honest flag: which individual days sat outside what this child's own fortnight looked like. Feeds the day-by-day colour strip the report already has. |
| **Inputs**   | \(D_t\) from A2.                                                                                                                                                   |
| **Priority** | **MVP tonight.**                                                                                                                                                   |
| **Effort**   | 0.5 h                                                                                                                                                              |

**Definition.** Day \(t\) is marked when either

1. \(|D_t| > 3\), or
2. at least 2 of 3 consecutive **valid** days (gaps do not count as part of a run) have \(|D| > 2\) with the same sign.

Rule 2 is the hysteresis that stops a single borderline day from changing the report; it is the direct analogue of the 70 % release threshold in `Kinexis.m`.

**Minimum data.** A2 satisfied (14 valid days).

**Output wording.** "4 of the 46 days with wearable data sat outside this child's usual range for steps (2 above, 2 below): 3, 14, 15 and 28 March." Counts and dates only.

**Synthetic validation.** Planted: inject single days at exactly \(D = 2.9\) and \(D = 3.1\) → only the second is marked by rule 1. Inject a 3-day run at \(D = 2.2\) → marked by rule 2; inject the same values separated by missing days → not marked. Null: 1 000 stationary series → marked-day rate below 3 %.

**Evidence.** `[method only — no paper retrieved]`.

---

### A10 — Food co-occurrence on discomfort days

|              |                                                                                                                                                                                                                      |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Give the family and the clinician an organised list of what was eaten on the days the child marked discomfort, so they can talk about it. Nothing more. The word "trigger" does not appear anywhere in this feature. |
| **Inputs**   | `foodEntries[]` (tags and free text, with date), `bellyComfort` per day.                                                                                                                                             |
| **Priority** | **A10a MVP tonight. A10b after the hackathon and only with the product owner's approval**, because it changes what parents are asked to do.                                                                          |
| **Effort**   | A10a 0.75 h; A10b 1.0 h                                                                                                                                                                                              |

**The structural problem, stated plainly.** Parents are prompted for food **only** on days with `bellyComfort ≥ 1`. That is a case-only sample. No measure of association — not Fisher's exact test, not an odds ratio, not a correlation — is estimable from it, because there is no comparison group. Juan's spec and our earlier proposal both glossed over this. Two options follow.

**A10a — counts only (the default, and what ships).**
For each tag \(g\): \(n_g\) = number of discomfort days on which \(g\) was logged; \(N_{\text{disc}}\) = number of discomfort days with any food entry; \(N_{\text{disc}}^{\text{all}}\) = number of discomfort days. Present as a sorted list of counts with the denominator always visible. No test, no p-value, no ranking language.

Output wording: "On the 9 days the child marked tummy discomfort, food was logged on 7. Dairy appeared on 4 of those 7, fried food on 3, tomato on 2. These are counts of what was written down on those days; they do not show that any food caused anything."

**A10b — a 2×2 only if the family opts into logging food every day.**
If the family turns on daily food logging in settings, then for tag \(g\) and lag \(\ell \in \{0, 1\}\) a genuine table exists over days where both the food log and the check-in are present:

|                               | `bellyComfort ≥ 1` | `bellyComfort = 0` |
| :---------------------------- | :----------------- | :----------------- |
| tag present on day \(t-\ell\) | \(a\)              | \(b\)              |
| tag absent on day \(t-\ell\)  | \(c\)              | \(d\)              |

Two-sided Fisher exact test, with Benjamini–Hochberg control at \(q = 0.10\) across all tags and both lags tested in the period. Minimum: \(a + b \ge 5\), \(c + d \ge 5\), and \(\ge 28\) days of complete food logging. The counts \(a, b, c, d\) are always shown; the q-value appears on the doctor page only, next to the number of tags tested. Parents see counts and a sentence, never a test result.

Output wording (doctor page, A10b): "Over 44 days with both a food log and a check-in, a dairy entry appeared on 6 of the 11 days marked uncomfortable and on 9 of the 33 days not marked uncomfortable (Fisher exact two-sided p = 0.28; 12 tags tested, Benjamini–Hochberg q = 0.84). Co-occurrence counts only."

**Synthetic validation.** Planted: generate 90 days where a tag raises the probability of a discomfort day by a known amount → assert A10b recovers the counts exactly and the q-value falls below 0.10 at the planted effect size. Null: 1 000 datasets with independent tags and symptoms → at most ≈10 % of runs report any tag at \(q < 0.10\) (that is what \(q = 0.10\) buys). Case-only test: feed A10b a reactive-only dataset → assert it refuses and returns `requires-daily-logging`.

**Evidence.** None. The food-diary search did not run, and `docs/PRODUCT.md` §5.4 already restricts this feature to counts. `[method only — no paper retrieved]`.

---

### A11 — Child self-report vs parent observation: weighted kappa

|              |                                                                                                                                                                                                                                                                      |
| :----------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Show the family, without blame, where the child's account and the parent's impression line up and where they do not. This is a conversation prompt for the consultation, and it is one of the few outputs with direct paediatric-IBD evidence behind the _question_. |
| **Inputs**   | A child item (0–2) and a parent-side ordinal item for the same construct on the same local day.                                                                                                                                                                      |
| **Priority** | **After the hackathon**, and it needs a product decision first (below).                                                                                                                                                                                              |
| **Effort**   | 1.0 h                                                                                                                                                                                                                                                                |

**Product dependency.** The parent daily log today has no 0–2 counterpart to `bellyComfort`, `energy` or `playPace`. Either (a) one optional parent item is added — "how do you think today went for your child" on the same three drawings, 0–2, explicitly marked as the parent's impression — or (b) this algorithm is not built. Mapping `school` onto `playPace` is **not** an acceptable substitute: they are different constructs and calling their agreement "kappa" would be wrong. Option (a) needs the product owner's approval.

**Definition.** With \(k = 3\) categories, linear disagreement weights \(w'_{ij} = |i - j| / (k - 1)\), observed proportions \(O_{ij}\) and chance-expected proportions \(E_{ij} = p_{i\cdot}\,p_{\cdot j}\):

$$\kappa_w = 1 - \frac{\sum_{i,j} w'_{ij}\,O_{ij}}{\sum_{i,j} w'_{ij}\,E_{ij}}$$

95 % CI by bootstrap over days (2 000 resamples, seeded). Also report the signed mean difference \(\overline{(\text{child} - \text{parent})}\), which carries the direction that \(\kappa_w\) throws away.

**Minimum data.** 20 days with both answers present.

**Output wording.** "On the 31 days where both answered, the child and the parent chose the same tummy picture on 19 days (weighted agreement 0.44, 95 % CI 0.21 to 0.64). On the days they differed, the child chose the harder picture more often (mean difference +0.31). This is a starting point for a conversation, not a measure of who is right."

**Synthetic validation.** Planted: construct a confusion matrix with a known \(\kappa_w\) → assert recovery to 1e-9. Edge cases: perfect agreement → 1; all-same-category input (undefined chance agreement) → must return `undefined` with a message, not NaN. Bootstrap coverage: 1 000 synthetic datasets at a known \(\kappa_w\) → the 95 % CI covers truth in ≈95 % of runs.

**Evidence.** Agreement is construct-dependent and this is the point of the output. In paediatric IBD, children self-reported significantly more sleep disturbance than parents observed (p < 0.0001) [38]. In 8–9-year-olds, parents mis-estimated bedtime by 36 min and sleep duration by 36.5 min against actigraphy, with weak correlation and insufficient agreement, while children over-estimated their own sleep by 92 min [62]. Conversely, for global quality of life, parents were good proxies (IMPACT-III vs IMPACT-III-P correlation 0.92 in 370 families) [92]. The weighted-kappa construction itself is **`[method only — no paper retrieved]`**.

---

### A12 — Missions done vs next-day energy (descriptive)

|              |                                                                                                                                                                                      |
| :----------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | Answer the question the family will ask ("do the missions help?") _without_ answering it — show what co-occurred and name the reason the question cannot be answered from this data. |
| **Inputs**   | `missionRecords[]` (date, kind, company label, completed-or-rest), `energy` per day.                                                                                                 |
| **Priority** | **MVP tonight** (it is cheap and it is in the demo).                                                                                                                                 |
| **Effort**   | 0.5 h                                                                                                                                                                                |

**Definition.** Let \(m_t \in \{0, 1, 2, \dots\}\) be the number of mission records on day \(t\) (a rest session counts as a mission record, per `PRODUCT.md` §5.2). Split days by \(m_t \ge 1\) vs \(m_t = 0\), and compare the distribution of \(E_{t+1}\) in the two groups: report the counts of each energy level in each group, the median, and a seeded bootstrap 95 % CI (2 000 resamples) for the difference in medians. No hypothesis test is shown.

**Mandatory confounding statement, shown with the output.** A child who feels well is more likely to do a mission, so the two directions cannot be separated here. Mission kind is never compared against anything (`PRODUCT.md` §5.2: all mission kinds give the same reward and are never ranked).

**Minimum data.** 15 days in each group.

**Output wording.** "On the 22 days after a day with at least one mission, the child marked full energy 11 times, some tiredness 8 times, and very tired 3 times. On the 17 days after a day with no mission, the figures were 6, 7 and 4. These are counts over the same period; a child who feels well is also more likely to do a mission, so this does not show that one caused the other."

**Synthetic validation.** Planted: generate data where mission presence shifts next-day energy by a known amount → assert the reported medians and the bootstrap CI match the planted values. Null: independent series → assert the CI for the difference in medians covers 0 in ≈95 % of 1 000 runs.

**Evidence.** The honest-framing requirement is forced by the literature: objectively measured physical activity showed **no** relationship with IBD fatigue in 187 adults [20], and within-person daily pain went with _higher_ measured activity while self-reported limitation went the other way in 176 youths [27]. The positive results for movement come from supervised intervention trials [23][24], which is a different claim from anything we can compute. Fatigue in paediatric IBD is driven mostly by transdiagnostic factors [26], so a single-variable story would be wrong.

---

### A13 — Steady-day and answered-day counts

|              |                                                                                                                                           |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | The count-based replacement for every composite index. It gives the clinician a one-line picture of the period without inventing a scale. |
| **Inputs**   | The three child items per day.                                                                                                            |
| **Priority** | **MVP tonight.**                                                                                                                          |
| **Effort**   | 0.5 h                                                                                                                                     |

**Definition.** Over the period, with \(N\) calendar days:

- `answeredDays` = days with at least one item answered.
- `notTodayDays` = days where the child chose "I don't feel like it today" on all three items (a valid answer, reported as such, never as a gap in care).
- `steadyDays` = days where **all three** answered items are 0.
- `comfortDays` = days where `bellyComfort = 0` (reported separately from `steadyDays`).
- `discomfortDays` = days where `bellyComfort ≥ 1`.
- Longest run of consecutive `steadyDays`, and longest run of consecutive `comfortDays`.

Each item is also reported as a three-way count (0 / 1 / 2 / not answered). Items are **never** summed.

**Minimum data.** None; the counts are the output and the denominator is always shown.

**Output wording.** "In the 61 days since the last consultation the child answered on 48 days and chose 'not today' on 6. On 29 of the 48 answered days all three answers were the easiest option. The longest run of such days was 9, from 3 to 11 March."

**Synthetic validation.** Deterministic; assert against hand-built fixtures including a period that starts and ends mid-run, a period with zero answered days, and a period containing only "not today".

**Evidence.** The negative argument is the strong one: expert-built, mathematically weighted paediatric indices still correlate only r = 0.39 with endoscopic severity [88] and r = 0.26 with calprotectin [86], and none of them validly assesses mucosal healing [86]. A consumer app summing three drawings has no standing to do better. Clinical indices themselves are built from counted symptom items [85][87].

---

### A14 — Consultation-to-consultation comparison windows

|              |                                                                                                                                                                                           |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | The report's native unit. Visits are months apart and nobody remembers; this produces "this interval versus the previous one" for each signal, with the day counts that make it readable. |
| **Inputs**   | `consultationDates[]`, all daily series.                                                                                                                                                  |
| **Priority** | **MVP tonight.**                                                                                                                                                                          |
| **Effort**   | 1.0 h                                                                                                                                                                                     |

**Definition.** Current period \(P_1 = (\text{last consultation},\ \text{today}]\), previous period \(P_0 = (\text{consultation before that},\ \text{last consultation}]\), both in local time, both half-open so a consultation day belongs to exactly one period. For each signal report median, IQR and \(n_{\text{valid}}\) in each period, plus the difference in medians with a seeded bootstrap percentile 95 % CI (2 000 resamples, independent resampling within each period).

Comparison is produced only when **both** periods have \(\ge 28\) valid days for that signal and the periods differ in length by less than a factor of 3; otherwise only \(P_1\) is described.

**Minimum data.** 28 valid days per period per signal, for the comparison; none for the single-period description.

**Output wording.** "Since the last visit (61 days, 46 with wearable data) the child's night-time heart rate had a median of 68 bpm (IQR 65–72). In the previous interval (74 days, 51 with wearable data) it was 65 bpm (IQR 63–69). Difference in medians +3 bpm (95 % CI −1 to +6)."

**Synthetic validation.** Planted: two periods with known medians and a known shift → assert the reported difference and the CI coverage over 1 000 runs. Boundary tests: a consultation on the first day of data; two consultations on the same day; a period of 27 valid days → assert the comparison is suppressed and the single-period text is produced.

**Evidence.** The need is the product's founding problem (`PRODUCT.md` §2.2). The clinical framing — the interval between visits as the unit of review — is implicit in the index literature [85][87] and in the symptom-cluster work that describes how multi-symptom profiles differ across patients and over time [40].

---

### A15 — HRV, only if the device exports it (optional)

|              |                                                                                                                                          |
| :----------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | If an ECG-grade or RMSSD-exporting source is present, this is the signal with the best paediatric-IBD evidence of anything on this list. |
| **Inputs**   | `hrvSamples[]` (RMSSD or SDNN with timestamps), nocturnal window from A0.                                                                |
| **Priority** | **After the hackathon**, conditional on the data existing. Google Fit generally does not expose it.                                      |
| **Effort**   | 0.5 h on top of A3 and A4                                                                                                                |

**Definition.** Nightly median RMSSD over the main sleep session, requiring \(\ge 10\) samples; then A2 (baseline), A7 (as a fourth wearable signal, raising the family to \(K = 45\) — the permutation max-statistic absorbs this automatically), and optionally A4 on the 24-hour SDNN series, which is the exact construction used in the IBD cohort [1][6].

**Minimum data.** 10 samples per night, 21 nights for A7.

**Output wording.** As A3, with the source stated: "Heart-rate variability as reported by the device."

**Evidence.** Paediatric IBD: RMSSD higher in remission than active disease (67.7 vs 45.8, p = 0.022) and independently associated with exacerbation over 12 months (OR 0.941, 95 % CI 0.887–0.998) in 34 children [8][9]; reduced HRV in children with IBD in remission vs controls [11]; HRV and sleep characteristics associate in children 7–12 with abdominal-pain disorders [17]. Adult: meta-analysis of reduced high-frequency power [10]; cosinor HRV features differentiating flare states [1][6]; HRV and fatigue [14]; scoping review [13]. **Measurement caveat that must accompany every use:** the systematic review of wearable HRV and inflammation found consistent SDNN–CRP associations for ECG-based devices and **not** for photoplethysmography-based ones, and classes wearable HRV as exploratory [12].

---

### 3.V — Synthetic data generator and the validation harness

|              |                                                                                                                                                                                                             |
| :----------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**  | With one child and a few days of real data, any correlation we show is noise. What we can demonstrate on stage is that **the engine is correct**. This is the direct descendant of `simulador_datos_EMG.m`. |
| **Priority** | **MVP tonight.** Without it there is no defensible demo.                                                                                                                                                    |
| **Effort**   | Generator 1.5 h; planted/null/gap harness 1.0 h                                                                                                                                                             |

**Generator.** `generateSyntheticChild(seed, days, options)` produces, per day: heart-rate samples on a cosinor curve with configurable mesor/amplitude/acrophase plus AR(1) noise and a sleep-time trough; a sleep session with configurable onset/offset jitter; per-minute steps from a bimodal day profile; and child answers drawn from an ordinal model in which a chosen wearable variable at a chosen lag shifts the probabilities by a chosen amount. Options include `missingDayRate` (default 0.15), `partialDayRate`, `spikeRate`, `dstDay`, `deviceChangeDay`, and `effect: null` for the null mode.

**The four tests that go in `pnpm check`.**

1. **Planted-effect test.** 60 days, a known lag-1 sleep → next-day `bellyComfort` effect, 15 % missing days, injected spikes. Assert A7 finds that cell and no other at family-wise \(p < 0.05\).
2. **Null test.** 1 000 datasets with `effect: null`. Assert the proportion in which A7, A8 or A9 reports anything is \(\le\) the nominal rate. The measured number is what we put on the slide, not a promise.
3. **Gap test.** A dataset with gaps must produce exactly the same \(\rho\), the same medians and the same CUSUM dates as the same dataset with the gap days physically deleted. This is the proof that nothing is filled in.
4. **Reproducibility test.** The same seed and the same input produce a byte-identical report payload, including every CI bound.

Everything on screen during the demo carries the **"Demo data"** label required by `PRODUCT.md` §5.1.

---

### 3.OUT — Explicitly out of scope

Anything below crosses from description into prediction, classification or advice, and is not built regardless of how good the demo would look.

| Out                                                                                       | Why                                                                                                                                                                        |
| :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Any estimate of whether the child is in a flare, or will be.                              | Classification of disease state. [1] is a 309-adult cohort against laboratory markers; it does not license a per-child statement, and `PRODUCT.md` §5.4 forbids it anyway. |
| Any lead-time claim ("weeks before", "24–48 h prior").                                    | Prediction.                                                                                                                                                                |
| Any composite index, score, percentage or 0–100 number built from more than one variable. | No validated construction exists; [86][88] show even expert-built indices track inflammation weakly.                                                                       |
| Tier or band labels that read clinically ("stable", "vulnerability window", "elevated").  | Classification by another name. Only the three neutral range words in A2 are allowed.                                                                                      |
| Sleep stages, deep-sleep percentage, WASO, sleep efficiency.                              | Measurement inadequate [51][52][53][54]; and in IBD, architecture moved with inflammation rather than symptoms [2].                                                        |
| Naming a food as a cause, or ranking foods.                                               | A10.                                                                                                                                                                       |
| Any machine-learned model, including a two-feature logistic regression.                   | `AGENTS.md`: deterministic statistics only. Also unfittable on one child's data.                                                                                           |
| Imputation of any kind.                                                                   | §4.                                                                                                                                                                        |
| Comparing the child against population norms or against other children.                   | No paediatric IBD wearable norms exist; and it would make the app a benchmarking tool for a sick child.                                                                    |
| Notifications or alerts of any kind from any algorithm.                                   | A8 and A9 produce text that appears when someone opens the report. Pushing them would make the app a monitor, and would punish a bad day.                                  |
| Anything derived from `medicationTaken` beyond a count.                                   | No evidence, high harm potential.                                                                                                                                          |

---

## 4. Reliability rules

These are binding on every algorithm above.

1. **No AI, no model fitting beyond the closed-form estimators written out above.** No LLM touches a number that reaches the report.
2. **No imputation, ever.** A missing day is missing in every window, every pair and every count. "I don't feel like it today" is missing, not 0. A dropped pair is dropped on both sides.
3. **Local-time day boundaries.** Every record stores the family's IANA zone. The day is \([00{:}00, 24{:}00)\) local. A sleep session belongs to the day it ends. DST days are flagged and excluded from A4 and A5.
4. **Minimum \(n\) is enforced in code, not in review.** Each algorithm returns a discriminated union: `{ kind: "value", … } | { kind: "insufficient-data", have: number, need: number }`. The UI renders the second case as a sentence; it can never render a number that does not exist.
5. **Every number is shown with its \(n\) and, where it is an estimate, a 95 % confidence interval.** A median without a day count is a bug.
6. **Multiple comparisons are handled once, for the whole family.** One permutation max-statistic across all cells in A7, one Benjamini–Hochberg family in A10b. No per-cell p-values are displayed as if they stood alone. The number of comparisons is printed next to the result.
7. **Autocorrelation is assumed, not ignored.** Block permutation and moving-block bootstrap with \(b = 7\) days everywhere a daily series is resampled.
8. **Reproducible seeds.** Every stochastic procedure takes an integer seed derived deterministically from `(childId, periodStart, periodEnd, algorithmId)`. The seed is stored with the output and printed in the doctor-report footer. Re-running the same report gives identical bounds.
9. **Baselines reset on a device or source change.** A new wearable, a new data source or a firmware-driven change of algorithm restarts the 14-day collection phase and the report marks the break. [79] is the cautionary case: the same raw data through two implementations of the same published metric gave different conclusions.
10. **Wear time is reported, never corrected for.** "46 of 61 days" appears next to every wearable-derived figure.
11. **No output crosses a period boundary.** Rolling windows do not span a consultation boundary in A14; a window that would is reported as unavailable.
12. **Every screen carrying any of this carries the `PRODUCT.md` §6.3 disclaimer**, from `src/content/disclaimers.ts`, not retyped.
13. **Regulatory posture `[no literature citation retrieved — design constraint, to be checked by a person before any public release]`.** Everything above is descriptive summarisation of data the family entered or their own device recorded. Nothing classifies, predicts, screens or recommends. That line is what keeps the product out of medical-device software territory under EU rules; the moment an output says what is likely to happen or what to do, the classification changes. Any new algorithm must be checked against this line before it ships, and a qualified person must review it before a public release — the regulatory search did not run and nothing here is a legal opinion.
14. **Health data location.** The wearable data is read in the parent's browser and stays on the device, like the check-in answers and the parent log. Nothing is sent to a server. It concerns special-category data about a minor, so no export or sharing is added without the family's explicit choice.

---

## 5. Doctor report and parent summary

Two audiences, one engine, different surfaces. Nothing is computed twice.

### 5.1 What goes where

| Output                                                   | Parent mode                                 | Doctor report                                       | Notes                                               |
| :------------------------------------------------------- | :------------------------------------------ | :-------------------------------------------------- | :-------------------------------------------------- |
| Valid-day counts (A0)                                    | Yes, one line                               | Yes, next to every figure                           | Never hidden                                        |
| Nightly values: nocturnal HR, sleep duration, steps (A3) | Yes, as the child's own chart               | Yes, median + IQR + \(n\) per period                | No norms, no target lines                           |
| Hampel replacements (A1)                                 | No                                          | Yes, footer                                         | Transparency, not interest                          |
| "Outside usual range" days (A9)                          | Yes, as dates on the calendar strip         | Yes, counts + dates                                 | Neutral colour, no red                              |
| Steady-day / answered-day counts (A13)                   | Yes                                         | Yes                                                 | The headline of the report                          |
| Consultation-to-consultation comparison (A14)            | Collapsed by default                        | Yes, top of page                                    |                                                     |
| Lagged co-occurrence (A7)                                | One plain sentence, or nothing              | Full 36-cell table with ρ, CI, \(n\), family-wise p | Parents never see a coefficient                     |
| Change-point (A8)                                        | No                                          | Yes                                                 | Too easy to read as an alarm outside a consultation |
| Cosinor and IS/IV/SRI (A4, A5, A6)                       | No                                          | Yes, one "daily pattern" block                      | Needs a clinician to read                           |
| Food co-occurrence (A10)                                 | Yes, counts                                 | Yes, counts (+ A10b table if enabled)               |                                                     |
| Child vs parent agreement (A11)                          | Yes                                         | Yes                                                 | Framed as a conversation prompt                     |
| Missions vs next-day energy (A12)                        | Yes, with the confounding sentence attached | Yes                                                 | The sentence is not optional                        |
| SpO2                                                     | Raw nightly values only                     | Raw nightly values only                             | Never in a statistic                                |

### 5.2 Example sentences

**Parent summary.**

> Since 1 March the child has answered on 48 of 61 days and chose "not today" on 6. On 29 of those 48 days all three answers were the easiest option.
> The wearable had enough data on 46 of the 61 days.
> On 5 of the 7 days the child marked tummy discomfort, the wearable had recorded less sleep than usual the night before (34 days had both pieces of information).
> On the 9 days with discomfort, food was logged on 7. Dairy appeared on 4 of those 7. These are counts of what was written down; they do not show that any food caused anything.
> On the 22 days after a day with at least one mission, the child marked full energy 11 times. On the 17 days after a day with no mission, 6 times. A child who feels well is also more likely to do a mission, so this does not show that one caused the other.

**Doctor report.**

> **Period** 1 March – 30 April (61 days). Previous interval 17 December – 28 February (74 days).
> **Self-report** `belly-comfort` 0/1/2 on 29/14/5 of 48 answered days (previous interval: 38/16/4 of 58). `energy` 0/1/2 on 22/19/7. `play-pace` 0/1/2 on 26/17/5. Items reported separately; not combined.
> **Wearable, this interval** night-time resting heart rate median 68 bpm (IQR 65–72, 38 valid nights); sleep duration median 8 h 10 min (IQR 7 h 30 – 8 h 45, 38 nights); steps median 7 420 (IQR 5 100–9 300, 46 valid days). Previous interval: 65 bpm (IQR 63–69, 51 nights); 8 h 25 min (51 nights); 8 150 steps (54 days). Difference in medians, night-time heart rate +3 bpm (95 % CI −1 to +6); steps −730 (95 % CI −1 900 to +420).
> **Daily pattern** 24-hour heart-rate mesor 82 bpm, day–night swing 14 bpm, peak ≈16:40, fitted on 41 of 61 days. Sleep regularity index 78 over the longest 7-day run with complete classification (6 day-pairs).
> **Change in level** since 12 March the lowest 30-minute night-time heart rate has sat above the child's own previous range: 72 bpm over 18 valid nights, against 65 bpm (IQR 63–68) over the 24 valid nights before. Decision interval h = 5, empirical false-signal rate 4.3 % per 90 days on matched null data.
> **Co-occurrence** sleep duration at lag 1 with `belly-comfort`: Spearman ρ = −0.58 (95 % CI −0.76 to −0.31), n = 34 paired days, family-wise p = 0.012 across 36 comparisons. No other cell reached the threshold; full table below with \(n\) for each.
> **Self-report vs parent impression** same tummy picture on 19 of 31 shared days (weighted agreement 0.44, 95 % CI 0.21–0.64); where they differed, the child chose the harder picture more often (mean difference +0.31).
> **School** attended 41, left early 4, missed 3, no school 13. **Medication taken** yes 55, partly 3, no 3.
> **Provenance** wearable data from the connected device via Google Fit; self-report and parent log entered by the family. Hampel filter replaced 3 single-day readings. Report seed 20260301-20260430-c1. Reproducible from the series on the device.
> _[disclaimer from `PRODUCT.md` §6.3]_

---

## 6. Kinexis mapping

What transfers from `Kinexis.m` / `simulador_datos_EMG.m` is the engineering discipline, not the numbers: EMG runs at ~2 kHz, this runs at one value per day.

| Kinexis (EMG)                                                                                                                                              | Here                                                                                                                                                                                  | Why it transfers                                                                                                                               |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| First-order IIR high-pass at 20 Hz, removing cable-movement drift before anything is decided (`iniciarFiltrosEMG`, lines 553–571)                          | **A2** trailing-median detrending: only the deviation from the child's own previous 14 days enters A8 and A9.                                                                         | Both remove the slow personal offset so the decision is about change, not about absolute level.                                                |
| Rectification plus 6 Hz low-pass to build a smooth envelope (`procesarVentanaEMG`, lines 573–582)                                                          | **A3** 30-minute rolling mean inside the sleep session, and **A5** hourly binning before IS/IV.                                                                                       | Both convert a noisy, irregularly sampled signal into a smooth envelope _before_ any threshold is applied. Never threshold raw samples.        |
| Filter state carried across 100 ms windows (`filter(b, a, x, z)`)                                                                                          | Rolling windows computed over the whole stored series, never per sync batch; a new sync never rewrites a past day's value unless the source itself changed it.                        | State lives in the data, not in the batch. This is what makes A14 and A8 stable across re-syncs.                                               |
| MVC calibration: record the user's own maximum first (`MaximosEMG`), then set thresholds at 30 % of it (`UmbralesEMG = MaximosEMG * 0.3`, lines 2231–2238) | **A2** personal baseline: every threshold is a multiple of this child's own robust spread, never an absolute bpm or step count. The 14-day collection phase is the calibration phase. | Children aged 8–12 have heterogeneous baselines; fixed cut-offs are meaningless, exactly as a fixed µV threshold is meaningless across people. |
| 70 % release hysteresis so a muscle at the threshold does not chatter (line 626)                                                                           | **A9** two-of-three rule and **A8** CUSUM slack \(k = 0.5\) plus the 14-day refractory period.                                                                                        | One borderline day must not flip the report; a sustained shift must.                                                                           |
| `SENAL_MIN = 10`: if the signal is too weak, abort calibration and say so rather than setting a wrong threshold (lines 2206–2223)                          | **A0** valid-day rule plus the `insufficient-data` return type in every algorithm.                                                                                                    | Refusing to output is a feature. The EMG version prints "no signal detected"; ours prints "not enough days yet".                               |
| `simulador_datos_EMG.m`: a simulator so the engine can be exercised without hardware                                                                       | **3.V** synthetic child generator with a planted lagged effect, a null mode and a gap mode.                                                                                           | We cannot wait months for a real series; the simulator is what makes the engine testable tonight and demonstrable on stage.                    |

---

## 7. References

All returned by Consensus. Entries marked † were returned in the team's earlier Consensus pass recorded in `docs/proposals/WEARABLE_GOOGLE_FIT.md` and were not re-returned in this session's searches; their URLs are carried over unchanged.

**Wearables and IBD**

1. Hirten R. et al., 2025, _Gastroenterology_ (44 citations) — Physiological Data Collected from Wearable Devices Identify and Predict Inflammatory Bowel Disease Flares. https://consensus.app/papers/details/390f6a3543f850cc9372a84ca66e8cd5/
2. † Hirten R. et al., 2025, _Clinical Gastroenterology and Hepatology_ — sleep architecture and inflammation in IBD. https://consensus.app/papers/details/f24ddab5196352a393c41221fb4be928/
3. Pathak P. et al., 2025, _Clinical Gastroenterology and Hepatology_ (3 citations) — Wearable technologies in inflammatory bowel disease: A scoping review. https://consensus.app/papers/details/5f8a0f4d00fc56b28020bc683207c1d3/
4. Feldman H. T. et al., 2026, _Journal of Clinical Gastroenterology_ — Wearable Technology and Remote Physiological Monitoring in Inflammatory Bowel Disease: A Systematic Review. https://consensus.app/papers/details/d7a24074e12751d78e14af67c7c06acd/
5. Andersen M. et al., 2019, _Journal of Crohn's and Colitis_ (14 citations) — P579 Wearable Devices Can Predict Disease Activity in inflammatory bowel disease Patients. https://consensus.app/papers/details/26675a2fdc285480822e5b6c2373982a/
6. Hirten R. et al., 2023, _Inflammatory Bowel Diseases_ — Physiological Metrics Collected from Wearable Devices Identify Inflammatory and Clinical Inflammatory Bowel Disease Flares. https://consensus.app/papers/details/b997e1b522bd5b31aae997b495621a36/
7. Hirten R. et al., 2020, _Journal of Medical Internet Research_ (124 citations) — Use of Physiological Data From a Wearable Device to Identify SARS-CoV-2 Infection and Symptoms and Predict COVID-19 Diagnosis. https://consensus.app/papers/details/33fd3840b1645c73945eeafc95c68377/

**Autonomic function and HRV**

8. Yerushalmy-Feler A. et al., 2022, _Journal of Psychosomatic Research_ (15 citations) — Heart rate variability as a predictor of disease exacerbation in pediatric inflammatory bowel disease. https://consensus.app/papers/details/9258cfc4c7f85420a8ef673c1995fc7b/
9. Yerushalmy-Feler A. et al., 2021, _Journal of Crohn's and Colitis_ — P222 Heart rate variability is a predictor to disease exacerbation in paediatric Inflammatory Bowel Disease. https://consensus.app/papers/details/c1b7b58e903d5f4ebf31fdcc9e7e5a8f/
10. Sadowski A. et al., 2020, _Clinical and Translational Gastroenterology_ (33 citations) — Alterations in Heart Rate Variability Associated With Irritable Bowel Syndrome or Inflammatory Bowel Disease: A Systematic Review and Meta-Analysis. https://consensus.app/papers/details/d5612c55001950b09d49d999595a42be/
11. Aghdasi-Bornaun H. et al., 2018, _The Turkish Journal of Pediatrics_ (15 citations) — Evaluation of autonomic nervous system functions in frame of heart rate variability in children with inflammatory bowel disease in remission. https://consensus.app/papers/details/ffc599c342f25cce9333f475f195aa33/
12. Siswishanto R. et al., 2026, _Diagnostics_ (2 citations) — Clinical Evidence of Wearable-Derived Heart Rate Variability for Detecting Systemic Inflammation: A Systematic Review. https://consensus.app/papers/details/f2e039e4f755588395b47e0e04d1583c/
13. Ladak Z. et al., 2025, _Research Posters_ — The Role of Heart Rate Variability in the Management of Inflammatory Bowel Disease: A Scoping Review. https://consensus.app/papers/details/cf9c84154335522388be6a5d61f5e6ca/
14. McGarva J. et al., 2023, _Inflammatory Bowel Diseases_ — Preliminary Evidence for a Relationship Between Heart Rate Variability and Fatigue in Patients with Inflammatory Bowel Disease. https://consensus.app/papers/details/4f4efe13838752aba62c49442aa4f38d/
15. Avey S. et al., 2024, _Clinical and Translational Science_ (7 citations) — Using a wearable patch to develop a digital monitoring biomarker of inflammation in response to LPS challenge. https://consensus.app/papers/details/3565badc0aef52f08153a11106237ba4/
16. Pourafkari L. et al., 2017, _Digestive Diseases and Sciences_ (8 citations) — Higher Frequency of Nocturnal Blood Pressure Dipping but Not Heart Rate Dipping in Inflammatory Bowel Disease. https://consensus.app/papers/details/eb7a5b29f9b45291b0f98da770706c1e/
17. Kamp K. et al., 2026, _Neurogastroenterology and Motility_ — Relationship Between Heart Rate Variability and Sleep Among Girls and Boys With Abdominal Pain-Related Disorders of Gut-Brain Interaction. https://consensus.app/papers/details/86b4bf1f59b2582286e31299a61fb23b/

**Physical activity and fatigue**

18. Griffin A. C. et al., 2023, _Journal of Medical Internet Research_ (11 citations) — mHealth Physical Activity and Patient-Reported Outcomes in Patients With Inflammatory Bowel Diseases: Cluster Analysis. https://consensus.app/papers/details/b78ba54b68725a4891b881ed54f0f894/
19. Toews B. et al., 2026, _Journal of the Canadian Association of Gastroenterology_ — Objective assessment of physical activity using wearable devices in patients with mild-to-moderate Crohn's disease. https://consensus.app/papers/details/122385dee5d55f7c81d2309bd9ce2e0e/
20. Farrell D. et al., 2021, _Journal of Crohn's and Colitis_ — N01 Does physical activity positively impact fatigue in individuals with Inflammatory Bowel Disease? https://consensus.app/papers/details/aff135c41c73567e863ac56a52f0523b/
21. Bevers N. et al., 2023, _Journal of Pediatric Gastroenterology and Nutrition_ (8 citations) — Fatigue and Physical Activity Patterns in Children With Inflammatory Bowel Disease. https://consensus.app/papers/details/880a835683ee573e8d72da136c3ca581/
22. Hill L. et al., 2023, _Pediatric Exercise Science_ (8 citations) — Physical Activity in Pediatric Inflammatory Bowel Disease: A Scoping Review. https://consensus.app/papers/details/adfce75a7fe153838affc457875dc6c1/
23. Scheffers L. et al., 2023, _Journal of Pediatric Gastroenterology and Nutrition_ (21 citations) — Physical Training and Healthy Diet Improved Bowel Symptoms, Quality of Life, and Fatigue in Children With Inflammatory Bowel Disease. https://consensus.app/papers/details/c0d18b0c73b555c58dea475aee226e5c/
24. Kasznár E. et al., 2026, _Journal of Cachexia, Sarcopenia and Muscle_ (5 citations) — Physical Activity Improves Quality of Life in Patients With Inflammatory Bowel Disease: A Systematic Review and Meta-Analysis. https://consensus.app/papers/details/30b7a8a1dc745a0981baaa788a08e05e/
25. van de Vijver E. et al., 2019, _World Journal of Gastroenterology_ (35 citations) — Fatigue in children and adolescents with inflammatory bowel disease. https://consensus.app/papers/details/49bff79e82465031a58b7dccf0111be9/
26. Stutvoet M. et al., 2025, _Journal of Pediatric Gastroenterology and Nutrition_ — Fatigue in pediatric inflammatory bowel disease: Explained by transdiagnostic and disease-focused factors. https://consensus.app/papers/details/a9a4efdfab575182ac53eeb10d255928/
27. O'Brien J. R. et al., 2024, _The Journal of Pain_ (5 citations) — Daily and Weekly Associations among Pain Intensity, Self-Reported Activity Limitations, and Objectively Assessed Physical Activity in Youth with Acute Musculoskeletal Pain. https://consensus.app/papers/details/a9e81a9f9b1453a0accb6bfbb3a22d21/

**Sleep and IBD**

28. Hao G.-H. et al., 2020, _Sleep Medicine_ (43 citations) — Sleep quality and disease activity in patients with inflammatory bowel disease: a systematic review and meta-analysis. https://consensus.app/papers/details/fc9b83b7278a505086b2192a1bb39805/
29. Ballesio A. et al., 2021, _Sleep Medicine Reviews_ (54 citations) — A meta-analysis on sleep quality in inflammatory bowel disease. https://consensus.app/papers/details/71cfb04d98cd518ba8286a6e93715127/
30. Chen S. et al., 2026, _Gastroenterología y Hepatología_ — Association between sleep quality and disease activity in inflammatory bowel disease: A systematic review and meta-analysis. https://consensus.app/papers/details/16e83c216a5258829628595b0966cb41/
31. Su X.-y. et al., 2025, _Revista Española de Enfermedades Digestivas_ — The sleep quality and its association with disease activity in patients with inflammatory bowel disease: a meta-analysis. https://consensus.app/papers/details/d0a58402b9375292954bd7826959ef1c/
32. Barnes A. et al., 2022, _JGH Open_ (16 citations) — Systematic review and meta-analysis of sleep quality in inactive inflammatory bowel disease. https://consensus.app/papers/details/6975f52b6a8f5c0f97b924fa435f99a8/
33. Barnes A. et al., 2021, _Sleep Advances_ — P008 A systematic review and meta-analysis of inflammatory bowel disease activity and sleep quality. https://consensus.app/papers/details/a43dc81c46d55282a9d30678df7b740f/
34. Moorman E. et al., 2023, _Journal of Pediatric Psychology_ (8 citations) — A Systematic Review of Sleep Disturbances in Pediatric Inflammatory Bowel Disease. https://consensus.app/papers/details/bd22241e05805f9fb36d1c45d17a401b/
35. † Breeden et al., 2024 — shorter sleep with disease activity in adolescents with IBD. https://consensus.app/papers/details/37cae93098ec56b48da08b1b8c9357c1/
36. Szabo M. et al., 2023, _Clinical Practice in Pediatric Psychology_ (5 citations) — Sleep Patterns, Pain, and Emotional Functioning in Youth with Inflammatory Bowel Disease. https://consensus.app/papers/details/f470f55df0ed5c489e669c4bf250ea90/
37. Gundogdu D. et al., 2023, _European Journal of Pediatrics_ (4 citations) — Relationship between disease activity index and sleep disorders in children with inflammatory bowel diseases. https://consensus.app/papers/details/9e257596c8525dc5b70f109d080f6fca/
38. Jarasvaraparn C. et al., 2019, _Journal of Pediatric Gastroenterology and Nutrition_ (8 citations) — The Relationship Between Sleep Disturbance, and Disease Activity in Pediatric Patients with Inflammatory Bowel Disease. https://consensus.app/papers/details/93054c32a7525cefaeeb695cf2fd94a5/
39. Kuzoian S. et al., 2025, _Journal of Pediatric Gastroenterology and Nutrition_ — Sleep tracking and sleep hygiene counseling improve fatigue in pediatric patients with inflammatory bowel disease. https://consensus.app/papers/details/517cbc4764d55d46b8eb1ce9d1b39c9c/
40. Malloy C. et al., 2026, _Journal of Pediatric Gastroenterology and Nutrition_ — Symptom cluster profiles in adolescents with inflammatory bowel disease. https://consensus.app/papers/details/51f721463b0e59aa887844b499bfc6a0/

**Sleep and abdominal pain in children; day-level sleep–pain designs**

41. Friesen H. J. et al., 2025, _Pediatric Health, Medicine and Therapeutics_ (5 citations) — A Scoping Review of Sleep Disturbances in Children and Adolescents with Abdominal Pain Disorders. https://consensus.app/papers/details/8c00c390865b5c778ce990451216ae48/
42. Santucci N. R. et al., 2024, _Neurogastroenterology and Motility_ (8 citations) — Youth with functional abdominal pain disorders have more sleep disturbances. A school-based study. https://consensus.app/papers/details/fa465fc0605552f4a0dfe2bd98d7dec0/
43. Jansen J. et al., 2021, _Journal of Clinical Sleep Medicine_ (25 citations) — Sleep disturbances in children with functional gastrointestinal disorders: demographic and clinical characteristics. https://consensus.app/papers/details/905f08e3c2595038b8e5d2f2b7ea1be7/
44. Thompson P. et al., 2023, _Clinical Pediatrics_ (4 citations) — A Cross-Sectional Study of Sleep Disturbances in Children and Adolescents With Abdominal Pain-Associated Disorders of Gut-Brain Interaction. https://consensus.app/papers/details/33d702127c2059c38608d9a945a0bedb/
45. Lewandowski A. et al., 2010, _Pain_ (155 citations) — Temporal daily associations between pain and sleep in adolescents with chronic pain versus healthy adolescents. https://consensus.app/papers/details/9f707f85882e5440910e32bba413d9a6/
46. Fisher K. M. et al., 2018, _Journal of Behavioral Medicine_ (37 citations) — Temporal relationship between daily pain and actigraphy sleep patterns in pediatric sickle cell disease. https://consensus.app/papers/details/c9717a1f3c62520fb526bb3e214f6e89/
47. Abeler K. et al., 2021, _Journal of Sleep Research_ (22 citations) — Daily associations between sleep and pain in patients with chronic musculoskeletal pain. https://consensus.app/papers/details/e958ca3ad0fe525aab08d3527d6df01c/
48. Rabbitts J. et al., 2017, _The Journal of Pain_ (37 citations) — Longitudinal and temporal associations between daily pain and sleep patterns after major pediatric surgery. https://consensus.app/papers/details/233e5df619af566085c02f88ada1bb27/

**Measurement validity of consumer and research devices**

49. † Doherty et al., 2024 — living umbrella review of wearable accuracy; heart-rate mean bias ≈3 %. https://consensus.app/papers/details/dbef972405915cc7b2e5a90c5b66af5d/
50. † Miller et al., 2022 — consumer sleep trackers: two-state sleep/wake valid, stage agreement κ 0.20–0.53. https://consensus.app/papers/details/c92d711de468535f96637a262fcedb76/
51. Schyvens A.-M. et al., 2025, _Sleep Advances_ (55 citations) — A performance validation of six commercial wrist-worn wearable sleep-tracking devices for sleep stage scoring compared to polysomnography. https://consensus.app/papers/details/ba08f66ce96053fba8cad8ff68d05002/
52. † Lee et al., 2024 — meta-analysis; wrist devices over-estimate wake after sleep onset by ≈13 min. https://consensus.app/papers/details/0b872df24dee516a8cfe9bdef248ce7e/
53. Lee T. et al., 2023, _JMIR mHealth and uHealth_ (101 citations) — Accuracy of 11 Wearable, Nearable, and Airable Consumer Sleep Trackers: Prospective Multicenter Validation Study. https://consensus.app/papers/details/9c4d0d84d0435538a44a8d419bbad41a/
54. Birrer V. et al., 2024, _npj Digital Medicine_ (106 citations) — Evaluating reliability in wearable devices for sleep staging. https://consensus.app/papers/details/967b49bf982854bb9aa194920eca4106/
55. Svensson T. et al., 2024, _Sleep Medicine_ (90 citations) — Validity and reliability of the Oura Ring Generation 3 with Oura sleep staging algorithm 2.0 compared to multi-night ambulatory polysomnography. https://consensus.app/papers/details/e6e8cda821185152b17a0e245305de44/
56. Wulterkens B. et al., 2021, _Nature and Science of Sleep_ (63 citations) — It is All in the Wrist: Wearable Sleep Staging in a Clinical Population versus Reference Polysomnography. https://consensus.app/papers/details/6f13c52225a85dde8d43d71e6305631e/
57. Lee X. et al., 2019, _Journal of Clinical Sleep Medicine_ (110 citations) — Validation of a Consumer Sleep Wearable Device With Actigraphy and Polysomnography in Adolescents Across Sleep Opportunity Manipulations. https://consensus.app/papers/details/14392f26fa0d546892e961e19a9f50f4/
58. Meredith-Jones K. et al., 2024, _International Journal of Behavioral Nutrition and Physical Activity_ (26 citations) — Validation of actigraphy sleep metrics in children aged 8 to 16 years: considerations for device type, placement and algorithms. https://consensus.app/papers/details/510533520f055e0884f2b53b811eb65c/
59. Smith C. et al., 2020, _Frontiers in Psychiatry_ (87 citations) — ActiGraph GT3X+ and Actical Wrist and Hip Worn Accelerometers for Sleep and Wake Indices in Young Children Using an Automated Algorithm: Validation With Polysomnography. https://consensus.app/papers/details/f34660d24380510b81b1d4669a1accbe/
60. Burger P. et al., 2024, _Journal of Sleep Research_ (10 citations) — Accelerometry for sleep assessment in children: Criterium validity of different algorithms in wrist- and ankle-worn devices. https://consensus.app/papers/details/9a0050b5626855d8891b0c6cf7c640f9/
61. Hyde M. et al., 2007, _Journal of Sleep Research_ (155 citations) — Validation of actigraphy for determining sleep and wake in children with sleep disordered breathing. https://consensus.app/papers/details/73347142208b502b9f08fa8d715da438/
62. Mazza S. et al., 2020, _Frontiers in Psychiatry_ (103 citations) — Objective and Subjective Assessments of Sleep in Children: Comparison of Actigraphy, Sleep Diary Completed by Children and Parents' Estimation. https://consensus.app/papers/details/5dfa55ae96c756f2a3ad88e3976fcffd/

**Circadian and rest-activity rhythm methods**

63. Gao C. et al., 2023, _Current Sleep Medicine Reports_ (35 citations) — Approaches for assessing circadian rest-activity patterns using actigraphy in cohort and population-based studies. https://consensus.app/papers/details/015a81553d7c5b9fa43859437f47274f/
64. Morelli D. et al., 2019, _Physiological Measurement_ (16 citations) — A computationally efficient algorithm to obtain an accurate and interpretable model of the effect of circadian rhythm on resting heart rate. https://consensus.app/papers/details/216fa0af7ddc585f959c2de812af7095/
65. Zhang Y.-Z. et al., 2023, _Journal of Medical Internet Research_ (27 citations) — Longitudinal Assessment of Seasonal Impacts and Depression Associations on Circadian Rhythm Using Multimodal Wearable Sensing. https://consensus.app/papers/details/a17c2a7e2dfb5921bd20be927734068e/
66. Shim J. et al., 2024, _npj Digital Medicine_ (44 citations) — Circadian rhythm analysis using wearable-based accelerometry as a digital biomarker of aging and healthspan. https://consensus.app/papers/details/446da6ddf04758bfaf5a45d4870f63ae/
67. Shim J. et al., 2026, _npj Aging_ (6 citations) — From wrist data to lifespan: elucidating inflammation-driven biological aging via activity rhythms captured by wearable devices. https://consensus.app/papers/details/c58001d484de5ffa81ef2ebdbed4525c/
68. Li J.-G. et al., 2021, _International Journal of Behavioral Nutrition and Physical Activity_ (62 citations) — Demographic characteristics associated with circadian rest-activity rhythm patterns: a cross-sectional study. https://consensus.app/papers/details/4afcc056975f5363a330b6ada6f9a15b/
69. Liang H.-W. et al., 2024, _Journal of Medical Internet Research_ (8 citations) — Rest-Activity Rhythm Differences in Acute Rehabilitation Between Poststroke Patients and Non-Brain Disease Controls. https://consensus.app/papers/details/68c7db937bc15ba7ad23469a24d423d5/
70. Xu Y. et al., 2022, _Chronobiology International_ (31 citations) — Blunted Rest-Activity Rhythm is associated with Increased White Blood-Cell-Based Inflammatory Markers in Adults: An Analysis from NHANES 2011–2014. https://consensus.app/papers/details/627414abd1a15bd5b5c8ed7ba78f8a54/
71. Xu Y. et al., 2022, _BMJ Open Diabetes Research & Care_ (28 citations) — Rest-activity circadian rhythm and impaired glucose tolerance in adults: an analysis of NHANES 2011–2014. https://consensus.app/papers/details/e0e1204a76655f3b9f97d952c5deae93/
72. Yeung C. H. C. et al., 2025, _Diabetes Care_ (6 citations) — Impaired Rest-Activity Rhythm Characteristics Predict Higher Risk of Incident Type 2 Diabetes in UK Biobank Participants. https://consensus.app/papers/details/ab194c88d2a654e3810e1ad9eac1e7b2/
73. van Es V. V. et al., 2025, _ESC Heart Failure_ (4 citations) — Predicting acute decompensated heart failure using circadian markers from heart rate time series. https://consensus.app/papers/details/61fb988cad9a5697968bf0c13b09da22/
74. Rasouli M. et al., 2025, _npj Women's Health_ (2 citations) — Circadian rhythm of heart rate and heart rate variability in pregnancy. https://consensus.app/papers/details/e2b5088bc3605875a83e1399e30bea3d/

**Sleep regularity**

75. Cribb L. et al., 2023, _eLife_ (46 citations) — Sleep regularity and mortality: a prospective analysis in the UK Biobank. https://consensus.app/papers/details/d6f31824cf0654b2967b45ff7cffa1ec/
76. Windred D. et al., 2023, _Sleep_ (216 citations) — Sleep regularity is a stronger predictor of mortality risk than sleep duration: A prospective cohort study. https://consensus.app/papers/details/e6fc23b1e4d75a1d9215f67c9faed8ae/
77. Castiglione-Fontanellaz C. E. G. et al., 2023, _Journal of Sleep Research_ (67 citations) — Sleep regularity in healthy adolescents: Associations with sleep duration, sleep quality, and mental health. https://consensus.app/papers/details/d9a8da440194573d901a298225616f97/
78. Kalkanis A. et al., 2025, _Sleep Medicine Reviews_ (12 citations) — Sleep regularity as an important component of sleep hygiene: a systematic review. https://consensus.app/papers/details/20f6e63978945142bf42e8394d15821e/
79. Czeisler M. et al., 2025, _Sleep_ (4 citations) — Comparison of Sleep Regularity Index scores calculated by open-source packages and implications for outcomes research: the RIRI statement. https://consensus.app/papers/details/6e71292d30405ce88a31884b496b861d/

**Circadian biology and IBD**

80. Nagao Y. et al., 2025, _International Journal of Molecular Sciences_ (10 citations) — Circadian Rhythm Dysregulation in Inflammatory Bowel Disease: Mechanisms and Chronotherapeutic Approaches. https://consensus.app/papers/details/e420280bb3c75079a836ceb50ea51be3/
81. Gombert M. et al., 2019, _Translational Research_ (68 citations) — The connection of circadian rhythm to inflammatory bowel disease. https://consensus.app/papers/details/36c51d0c1853516794524be7ce80f9be/
82. Post Z. et al., 2024, _Journal of the Canadian Association of Gastroenterology_ (11 citations) — The circadian rhythm as therapeutic target in inflammatory bowel disease. https://consensus.app/papers/details/83797c98fe01580abb9dcacf4643943c/
83. Liu X. et al., 2017, _Inflammatory Bowel Diseases_ (74 citations) — Bidirectional Regulation of Circadian Disturbance and Inflammation in Inflammatory Bowel Disease. https://consensus.app/papers/details/16974b72d0a95b6fb6fdc0b80fa9ea7f/
84. Wang D. et al., 2022, _Heliyon_ (18 citations) — Influence of sleep disruption on inflammatory bowel disease and changes in circadian rhythm genes. https://consensus.app/papers/details/ab44627db12c56ada8a383db5d3f8cae/

**Paediatric IBD outcome measures and parent-proxy reporting**

85. Turner D. et al., 2012, _Inflammatory Bowel Diseases_ (282 citations) — Mathematical weighting of the pediatric Crohn's disease activity index (PCDAI) and comparison with its other short versions. https://consensus.app/papers/details/0e08101b5b0f5d3c855c59bada1b0691/
86. Turner D. et al., 2017, _Journal of Pediatric Gastroenterology and Nutrition_ (97 citations) — Which PCDAI Version Best Reflects Intestinal Inflammation in Pediatric Crohn Disease? https://consensus.app/papers/details/7bf1e8facdbb5e208c1591f34efb7b17/
87. Hyams J. et al., 1991, _Journal of Pediatric Gastroenterology and Nutrition_ (1161 citations) — Development and validation of a pediatric Crohn's disease activity index. https://consensus.app/papers/details/a632e07da311570fb56967db44d42403/
88. Carman N. et al., 2019, _Gastrointestinal Endoscopy_ (36 citations) — Clinical disease activity and endoscopic severity correlate poorly in children newly diagnosed with Crohn's disease. https://consensus.app/papers/details/0d8203d240fc5678b8b8ec2c53163d1b/
89. Cozijnsen M. et al., 2019, _Clinical Gastroenterology and Hepatology_ (68 citations) — Development and Validation of the Mucosal Inflammation Noninvasive Index For Pediatric Crohn's Disease. https://consensus.app/papers/details/aad0a1fcb4775deaa1a482f78449b6ce/
90. Otley A. et al., 2002, _Journal of Pediatric Gastroenterology and Nutrition_ (260 citations) — The IMPACT Questionnaire: A Valid Measure of Health-Related Quality of Life in Pediatric Inflammatory Bowel Disease. https://consensus.app/papers/details/efe6f9c6e7df55f7806793fa7eaf1bbc/
91. Grant A. et al., 2020, _Journal of Pediatric Gastroenterology and Nutrition_ (15 citations) — A New Domain Structure for the IMPACT-III Health-related Quality of life Tool for Pediatric Inflammatory Bowel Disease. https://consensus.app/papers/details/c3cc686e2db8581c9ccdc671b701ef42/
92. Rodríguez-Belvís M. V. et al., 2024, _Journal of Crohn's and Colitis_ — P993 IMPACT-III and IMPACT-III-P questionnaires: transcultural adaptation and validation in Spanish families. https://consensus.app/papers/details/53716bd63f40520692eb8b4ae24e47fa/
93. Gatti S. et al., 2021, _Scientific Reports_ (6 citations) — Factors associated with quality of life in Italian children and adolescents with IBD. https://consensus.app/papers/details/2ce2734941d9558f94ad823f71dd0e33/
94. Chouliaras G. et al., 2017, _World Journal of Gastroenterology_ (63 citations) — Disease impact on the quality of life of children with inflammatory bowel diseases. https://consensus.app/papers/details/b8d92fc7bdb65793bce8520eaa55f309/
