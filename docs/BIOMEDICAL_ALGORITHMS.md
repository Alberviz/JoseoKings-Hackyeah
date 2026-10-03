# Biomedical Algorithms, Signal Processing & Evidence-Based Engine

> **Authors & Leads:** Juan & Farouk (Data Layer, Signal Processing & Clinical Content)  
> **Target Audience:** Pediatric IBD (Crohn's Disease & Ulcerative Colitis, ages 8–12)  
> **Status:** Implementation Specification for Claude Code & Engineering Team  
> **Architecture Target:** Google Fit API + Vercel Cron/SWR + Doctor Report Engine

---

## 1. Executive Summary & Clinical Vision

CrohnCare bridges passive physiological wearable telemetry (Amazfit GTS 2 via Google Fit), self-reported child check-ins from game-based interactions, and parental observational logs.

Instead of relying on opaque generative LLM prompts that risk hallucinating clinical numbers, this specification details a **deterministic, evidence-based biomedical signal processing and statistical engine**. The architecture adapts proven digital signal processing (DSP) techniques traditionally utilized in electromyography (EMG) and physiological time-series analysis (moving-window median filtering, Hampel outlier rejection, baseline detrending, rolling RMS volatility, and time-lagged cross-correlation).

The system addresses the core paediatric consultation challenge: visits occur 3 to 6 months apart, recall bias is high, and children aged 8–12 often hide pain due to "interrogation fatigue". By combining objective autonomic markers with child-reported outcomes, CrohnCare equips the pediatric gastroenterologist with a rigorous, objective longitudinal summary without ever turning the child's life into a medical surveillance zone.

---

## 2. Scientific Literature & Evidence Base

The algorithms are grounded in peer-reviewed clinical studies across pediatric gastroenterology, autonomic neuroscience, and wearable sensor research:

### 2.1 Autonomic Nervous System & Resting Heart Rate (RHR)

- **Cholinergic Anti-Inflammatory Pathway:** The vagus nerve controls systemic and intestinal inflammation via acetylcholine release, which binds to $\alpha 7$ nicotinic receptors on intestinal macrophages, suppressing TNF-$\alpha$, IL-1$\beta$, and IL-6 (_Tracey et al., Nature Reviews Immunology_).
- **Vagal Withdrawal in Flares:** During active or subclinical mucosal inflammation, vagal tone is suppressed and sympathetic drive dominates. This manifests physiologically as:
  1. An elevation in morning/nocturnal **Resting Heart Rate (RHR)** of $+5$ to $+10\text{ bpm}$ above personal baseline (_Kolovos et al., Inflamm Bowel Dis, 2022_).
  2. A depression in Heart Rate Variability (HRV / RMSSD) (_Geva et al., Pediatr Res, 2020_).
- **Predictive Lead Time:** The Mount Sinai IBD Wearable Cohort (_Hirten et al., Gastroenterology, 2021; Keefer et al._) demonstrated that wearable physiological shifts (elevated RHR, autonomic shifts) predict clinical IBD exacerbations weeks before patient-reported acute symptoms.

### 2.2 Sleep Architecture Disruption & WASO

- **Intestinal Epithelial Barrier Integrity:** Circadian rhythms regulate epithelial tight junction proteins (Claudin-1, Occludin). Sleep fragmentation directly degrades barrier integrity, inducing bacterial translocation and mucosal inflammation (_Swanson et al., Am J Gastroenterol_).
- **Wake After Sleep Onset (WASO):** In pediatric Crohn's and ulcerative colitis, nocturnal cramps and nocturnal bowel movements are hallmark signs of active disease. Objective sleep trackers quantify this via **WASO** (accumulated minutes awake after initial sleep onset) and micro-awakening count (_Ali et al., Sleep, 2013_).
- **PUCAI / PCDAI Alignment:** Nocturnal awakenings for symptoms represent significant weighted points in both the Pediatric Crohn's Disease Activity Index (PCDAI) and Pediatric Ulcerative Colitis Activity Index (PUCAI).

### 2.3 Physical Activity Drops & Fatigue

- **Activity as a Functional Bio-Index:** Spontaneous daily physical activity (step counts) drops precipitously ($> 30\%$) 48–72 hours prior to severe symptom reporting (_Ward et al., Aliment Pharmacol Ther, 2020_).
- **Sustainable Movement:** Mild, sustained physical movement stimulates anti-inflammatory myokine release (IL-6 from working muscle behaving anti-inflammatorily, stimulating IL-10 and IL-1ra), supporting the importance of gentle missions.

---

## 3. Comprehensive Cross-Variable Matrix

The engine combines 14 discrete variables across three independent channels:

| Category       | Variable        | Source / Sensor            | Sampling / Format                             | Clinical Rationale in IBD                                      |
| :------------- | :-------------- | :------------------------- | :-------------------------------------------- | :------------------------------------------------------------- |
| **Wearable**   | `WASO_min`      | Amazfit GTS 2 / Google Fit | Nightly sum (minutes awake)                   | Direct marker of nocturnal bowel urgency or pain.              |
| **Wearable**   | `TST_hours`     | Amazfit GTS 2 / Google Fit | Nightly sum (hours)                           | Total sleep volume; sleep debt drives pro-inflammatory state.  |
| **Wearable**   | `DeepSleep_pct` | Amazfit GTS 2 / Google Fit | Percentage ($0–100\%$)                        | Restorative N3 slow-wave sleep; correlates with tissue repair. |
| **Wearable**   | `RHR_bpm`       | Amazfit GTS 2 / Google Fit | Waking / nocturnal basal bpm                  | Biomarker of systemic inflammatory and vagal tone status.      |
| **Wearable**   | `Steps_daily`   | Amazfit GTS 2 / Google Fit | Daily sum (steps)                             | Objective gauge of energy, vitality, and functional mobility.  |
| **Wearable**   | `Active_min`    | Amazfit GTS 2 / Google Fit | Daily sum (minutes $>100\text{ cpm}$)         | Sustained gentle activity without high-impact stress.          |
| **Child Game** | `BellyComfort`  | Daily check-in (Companion) | Ordinal: $0$ (Good) to $2$ (Discomfort)       | Primary subjective abdominal comfort score.                    |
| **Child Game** | `EnergyLevel`   | Daily check-in (Companion) | Ordinal: $0$ (Energetic) to $2$ (Exhausted)   | Pediatric fatigue perception.                                  |
| **Child Game** | `PlayPace`      | Daily check-in (Companion) | Ordinal: $0$ (Full play) to $2$ (Wanted rest) | Subjective desire/capacity for peer interaction.               |
| **Child Game** | `NotTodayFlag`  | Daily check-in (Companion) | Boolean ($1$ if child skipped)                | Validated withdrawal behavior without interrogation penalty.   |
| **Parent Log** | `SchoolDay`     | Parent mode screen         | Categorical (attended / left-early / missed)  | High-impact social/academic disruption metric.                 |
| **Parent Log** | `Medication`    | Parent mode screen         | Categorical (yes / partly / no)               | Adherence tracking without logging specific drug names.        |
| **Parent Log** | `FoodEntries`   | Reactive diary (Parent)    | Categorical food tags & free text             | Temporal co-occurrence on days with discomfort.                |
| **Parent Log** | `ParentSleep`   | Parent mode screen         | Hours ($0–24$)                                | Parental perceived sleep vs wearable measured sleep.           |

### Multivariable Interaction Hypotheses

1. **Lead Warning Interaction ($t - 2 \rightarrow t$):**  
   $$\text{WASO}(t-1) \uparrow + \text{RHR}(t-1) \uparrow \implies \text{BellyComfort}(t) \ge 1 + \text{SchoolDay}(t) \in \{\text{missed}, \text{left-early}\}$$
2. **Fatigue & Vagal Recovery ($t \rightarrow t + 2$):**  
   $$\text{BellyComfort}(t) \ge 1 \implies \text{Steps}(t+1) \downarrow + \text{EnergyLevel}(t+1) = 2$$
3. **Food Trigger Co-occurrence:**  
   $$\text{FoodTag}(t-1) \times \text{BellyComfort}(t) \quad \text{[Reported as co-occurrence count only, never causal diagnosis]}$$

---

## 4. Signal Processing Pipeline (Adapted from EMG / Physiological Time Series)

In EMG analysis, raw signals are cleaned of movement artifacts, baseline drift, and erratic electrode noise using sliding windows. We adapt this exact mathematical paradigm to continuous wearable and self-report logs.

```
Raw Wearable Telemetry ──► [Stage 1: Imputation] ──► [Stage 2: Hampel Outlier Filter]
                                                                  │
┌─────────────────────────────────────────────────────────────────┘
▼
[Stage 3: Moving Average / Median Window] ──► [Stage 4: Rolling RMS Volatility]
                                                       │
┌──────────────────────────────────────────────────────┘
▼
[Stage 5: Detrending & Z-Score Normalization] ──► [Stage 6: Time-Lagged Cross-Correlation (TLCC)]
                                                       │
                                                       ▼
                                     [Paediatrician Report Dashboard]
```

### Stage 1: Data Sanity & Imputation

- Sensor dropouts (e.g. watch uncharged or taken off at night) produce missing segments.
- If a gap $\le 1$ day exists, apply piecewise linear interpolation for steps and forward-fill with personal 14-day median for RHR and sleep metrics. If gap $> 1$ day, mark data point as `NaN` and exclude from rolling window to prevent false trend injection.

### Stage 2: Hampel Filter (Sliding Median + MAD Noise Cleaning)

Eliminates sensor spikes (e.g. erratic optical HR spike from loose watch fit) without blurring step changes.

For each sample $x_k$ in a sliding window of width $W = 7$ days centered at $k$:

1. Compute local median:  
   $$m_k = \text{median}\left(x_{k-3}, \dots, x_{k+3}\right)$$
2. Compute Median Absolute Deviation (MAD):  
   $$\text{MAD}_k = 1.4826 \cdot \text{median}\left(|x_{i} - m_k|\right), \quad i \in [k-3, k+3]$$
3. Replacement Rule:  
   $$x_k^* = \begin{cases} m_k & \text{if } |x_k - m_k| > 3 \cdot \text{MAD}_k \\ x_k & \text{otherwise} \end{cases}$$

### Stage 3: Sliding Window Moving Average & Trend Separation

To separate high-frequency daily volatility from sustained physiological shifts:

- **Simple Moving Average (SMA, $N = 7$ days):**  
  $$\text{SMA}_t = \frac{1}{N} \sum_{i=0}^{N-1} x_{t-i}^*$$
- **Exponential Moving Average (EMA, $\alpha = \frac{2}{N+1} = 0.25$ for $N = 7$):**  
  $$\text{EMA}_t = \alpha \cdot x_t^* + (1 - \alpha) \cdot \text{EMA}_{t-1}$$

### Stage 4: Rolling RMS / Physiological Volatility

In EMG, RMS calculates signal power. In IBD telemetry, the rolling standard deviation or RMS of detrended RHR over a 7-day window represents **Autonomic Volatility**:

$$\text{RMS}_{\text{volatility}}(t) = \sqrt{\frac{1}{N} \sum_{i=0}^{N-1} \left(x_{t-i}^* - \text{SMA}_t\right)^2}$$

- **Clinical Significance:** An escalating $\text{RMS}_{\text{volatility}}$ reflects autonomic instability, commonly preceding a flare even before the mean RHR crosses absolute thresholds.

### Stage 5: Individualized Z-Score Normalization

Children aged 8–12 have heterogeneous baselines. Fixed thresholds ($> 80\text{ bpm}$, $< 7\text{ h sleep}$) fail across different ages. We compute normalized deviation scores relative to an individualized 14-day rolling window:

$$Z_X(t) = \frac{x_k^* - \tilde{X}_{14}(t)}{0.7413 \cdot \text{IQR}_{14}(t)}$$

Where $\tilde{X}_{14}$ is the 14-day rolling median and $\text{IQR}_{14} = Q_3 - Q_1$.

---

## 5. Correlation & Analytical Algorithms

### 5.1 Time-Lagged Cross-Correlation (TLCC)

Determines whether biometric anomalies lead or lag child-reported symptoms.

Let $Z_X(t)$ be the normalized wearable biometric (e.g. $Z_{\text{WASO}}$ or $Z_{\text{RHR}}$) and $S(t) \in [0, 6]$ be the child's composite discomfort index ($S(t) = \text{BellyComfort} + \text{EnergyLevel} + \text{PlayPace}$):

$$\rho_X(\tau) = \frac{\sum_{t=1}^{N} \left(Z_X(t + \tau) - \bar{Z}_X\right) \left(S(t) - \bar{S}\right)}{\sqrt{\sum_{t=1}^{N} \left(Z_X(t + \tau) - \bar{Z}_X\right)^2 \sum_{t=1}^{N} \left(S(t) - \bar{S}\right)^2}}$$

For lags $\tau \in \{-3, -2, -1, 0, +1, +2, +3\}$ days.

- **Clinical Output:**
  - $\tau = -2 \text{ or } -1$ peak: **Lead Warning Indicator** (physiological sleep/autonomic disturbance preceded abdominal pain by 24–48 hours).
  - $\tau = 0$ peak: **Acute Co-occurrence** (simultaneous manifestation).
  - $\tau = +1 \text{ or } +2$ peak: **Post-Episode Residual Fatigue**.

### 5.2 Non-Parametric Spearman Rank Correlation ($\rho$)

Because child-reported scores are ordinal and non-Gaussian:

$$\rho = 1 - \frac{6 \sum_{i=1}^n d_i^2}{n(n^2 - 1)}$$

Where $d_i = \text{rank}(Z_X(i)) - \text{rank}(S(i))$. Two-tailed permutation test determines statistical significance ($p < 0.05$).

### 5.3 Biometric Stability Index (BSI)

Synthesizes the multi-sensor stream into an objective trend indicator $[0, 100]$:

$$\text{BSI}(t) = 100 - \left[ w_{\text{WASO}} \cdot f(Z_{\text{WASO}}) + w_{\text{RHR}} \cdot f(Z_{\text{RHR}}) + w_{\text{Steps}} \cdot g(Z_{\text{Steps}}) \right]$$

- **Weights:** $w_{\text{WASO}} = 0.40$, $w_{\text{RHR}} = 0.35$, $w_{\text{Steps}} = 0.25$.
- **Penalty functions:**  
  $$f(Z) = \max(0, Z) \cdot 15$$  
  $$g(Z) = \max(0, -Z) \cdot 10$$
- **Clinical Tiers:**
  - $\text{BSI} \ge 80$: **Stable Baseline** (Consolidated sleep, steady resting HR, normal activity).
  - $60 \le \text{BSI} < 80$: **Mild Perturbation** (Minor sleep fragmentation or mild tachycardia).
  - $\text{BSI} < 60$: **Active Vulnerability Window** (Significant nocturnal awakenings and autonomic shift; flagged for clinical review).

---

## 6. Vercel Cron & Polling Architecture

### 6.1 Constraints of Vercel Hobby Tier

- Maximum **2 cron jobs** per project.
- Frequency limit: at most **once every 24 hours per cron job**.

### 6.2 The Tri-Modal High-Frequency Strategy

To achieve maximum temporal resolution for the child's health state without infrastructure costs:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                   Sampling Strategy                    │
                  └──────────────────────────┬─────────────────────────────┘
                                             │
         ┌───────────────────────────────────┼────────────────────────────────────┐
         ▼                                   ▼                                    ▼
┌──────────────────┐               ┌──────────────────┐                ┌─────────────────────┐
│  Vercel Cron #1  │               │  Vercel Cron #2  │                │  On-Access SWR Sync │
│  08:00 UTC       │               │  21:00 UTC       │                │  (Client Triggered) │
│  - Nightly sleep │               │  - Day step sum  │                │  - Dispatched when  │
│  - WASO minutes  │               │  - Active mins   │                │    parent opens app │
│  - Waking RHR    │               │  - Evening HR    │                │  - Cache TTL: 4 hrs │
└──────────────────┘               └──────────────────┘                └─────────────────────┘
```

1. **`vercel.json` Configuration:**

```json
{
  "crons": [
    {
      "path": "/api/wearables/cron?phase=morning",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/wearables/cron?phase=evening",
      "schedule": "0 21 * * *"
    }
  ]
}
```

2. **On-Demand SWR (Stale-While-Revalidate):**
   - When parent navigates to `/parent/log` or `/parent/report`, the client checks `localStorage.getItem("crohncare_last_wearable_sync")`.
   - If `Date.now() - lastSync > 4 hours`, the client triggers a background `POST /api/wearables/sync`.
   - Provides immediate data freshness without polling loops or server limits.
3. **GitHub Actions Scheduler (Zero-Cost Unlimited Polling):**
   - A repository workflow `.github/workflows/wearable-sync.yml` can run `cron: '0 6,12,18,0 * * *'` executing `curl -X POST https://crohncare.vercel.app/api/wearables/sync -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"`.

---

## 7. Implementation Plan for Claude Code in Cursor

The implementing agent in Cursor should execute tasks in the following sequence:

### Task Step 1: Digital Signal Processing (DSP) Module

- **File:** `src/lib/wearables/dsp.ts`
- **Contents:**
  - `hampelFilter(series: number[], windowSize = 7, nSigmas = 3): number[]`
  - `simpleMovingAverage(series: number[], windowSize = 7): number[]`
  - `exponentialMovingAverage(series: number[], alpha = 0.25): number[]`
  - `rollingRmsVolatility(series: number[], windowSize = 7): number[]`
  - `imputeLinearGaps(dates: string[], values: (number | null)[]): number[]`
- **Test Suite:** `src/lib/wearables/dsp.test.ts` (test outlier rejection, constant series, step functions).

### Task Step 2: Statistical & Correlation Engine

- **File:** `src/lib/wearables/statistics.ts`
- **Contents:**
  - `calculateRollingZScores(series: number[], windowSize = 14): number[]`
  - `computeTimeLaggedCrossCorrelation(x: number[], y: number[], maxLag = 3): LagCorrelationResult`
  - `computeSpearmanCorrelation(x: number[], y: number[]): { rho: number; pValue: number }`
  - `computeBiometricStabilityIndex(wasoZ: number, rhrZ: number, stepsZ: number): number`
- **Test Suite:** `src/lib/wearables/statistics.test.ts` (verify known positive/negative lags, p-value bounds).

### Task Step 3: Google Fit REST Client

- **File:** `src/lib/wearables/google-fit.ts`
- **Contents:**
  - OAuth2 token refresh logic with `GOOGLE_FIT_CLIENT_ID`, `GOOGLE_FIT_CLIENT_SECRET`, `GOOGLE_FIT_REFRESH_TOKEN`.
  - `fetchGoogleFitAggregates(startDate: string, endDate: string): Promise<RawWearableRecord[]>`
  - Aggregation endpoints for `derived:com.google.sleep.segment`, `derived:com.google.heart_rate.bpm`, and `derived:com.google.step_count.delta`.

### Task Step 4: Next.js API Route Handlers

- **File:** `src/app/api/wearables/sync/route.ts` (Manual & on-demand sync).
- **File:** `src/app/api/wearables/cron/route.ts` (Handles `morning` and `evening` Vercel cron calls).
- Secure endpoint with `CRON_SECRET` bearer check.

### Task Step 5: Doctor Report UI & Visualization Integration

- **File:** `src/components/report/biometric-stability-chart.tsx` (SVG-based sparkline of BSI and lead correlation).
- **File:** `src/app/parent/report/page.tsx`
  - Add the **Objective Rest & Autonomic Stability** section.
  - Render the lead indicator statement:
    > _"Objective Trend: Across the observation period, 4 of the 5 days where the child reported discomfort were preceded (24–48h prior) by an increase in nocturnal wake episodes (WASO > 35 min) and elevated resting HR (+6 bpm above personal median)."_
  - Maintain disclaimer: _"Descriptive biometric summary derived from wearable sensor; not a diagnostic tool."_

---

## 8. Compliance with Project Core Rules

- **Rule 1: Health Data Stays Local / Privacy by Design (`PRODUCT.md` 5.1):** Raw biometric telemetry fetched from Google Fit is cached locally in `localStorage` / encrypted local state. No third-party health servers or external cloud analytics are introduced.
- **Rule 2: No Diagnostic Claims (`PRODUCT.md` 5.4):** Algorithms describe **co-occurrence and lead-lag timing**. The UI never outputs "Child has a flare", "Prescribe dose", or "Clinical risk score". It outputs _"Biometric Stability Index: 64 · Nocturnal awakenings elevated 24h prior"_.
- **Rule 3: Confidence & Provenance Labels (`PRODUCT.md` 5.3):** Every chart clearly displays `Source: Amazfit GTS 2 via Google Fit REST API`.
