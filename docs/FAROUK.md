# 🚀 Pediatric Companion Spec for Farouk (HackYeah 2026)

> **Assignee:** Farouk  
> **Feature:** Child Companion Mode ("Capy" / "BellyBot") — Stealth Assessment, Anti-Tamagotchi Biological Simulation, Empathic Self-Care, and Reward Wheel.  
> **Track:** HackYeah Sport & Healthcare (`Details - SPORT & HEALTHCARE.pdf`)  
> **Scientific Foundations:** [`research/AUTONOMOUS_PET_AND_EMPATHIC_CARE.md`](../research/AUTONOMOUS_PET_AND_EMPATHIC_CARE.md) and [`research/SUBTLE_PEDIATRIC_PROXY_CHECKIN.md`](../research/SUBTLE_PEDIATRIC_PROXY_CHECKIN.md).

---

## 1. Mission & Philosophy

You are building the **Child Companion Experience** for CrohnCare. This is the emotional and gamified core of the product for pediatric Crohn's disease patients (ages 6–14).

### ⚠️ Non-Negotiable Product Rules:
1. **Zero Medical Jargon in Child UI:** NEVER show words like *Crohn, disease, diarrhea, pain, flare, blood, drug, calprotectin, inflammation*.
2. **Anti-Tamagotchi (No Punitive Streaks):** The pet **NEVER dies** and is **NEVER punished** for inactive days. The pet gets "sick" (a cosmic cold / low energy) **randomly/stochastically**, teaching that *getting sick happens to living beings by natural biology, not personal fault*.
3. **Strict Stack Rules (`AGENTS.md`):**
   * Next.js 16 (App Router) + TypeScript strict.
   * Every component lives in its folder: `Name/Name.tsx` + `Name.style.ts`.
   * **NO raw HTML tags in `.tsx`** (ESLint blocks `<div>`, `<button>`, `<p>`, etc.). All elements must be styled components from `.style.ts` or primitives from `@/components/ui`.
   * `"use client"` at the top of `.tsx` files.
   * Use theme tokens (`theme.colors.*`, `theme.spacing.*`, `theme.radius.*`). Touch targets $\ge 48\text{px}$.
   * All health data stays on-device (`localStorage` only).

---

## 2. Architecture & File Layout

Place all your files strictly in these designated paths:

```
src/
├── types/
│   └── pet.ts                                # TypeScript contracts & state interfaces
├── lib/
│   └── pet/
│       ├── petSimulator.ts                   # Stochastic biology & state transitions
│       ├── petSimulator.test.ts              # Unit tests for simulation & RNG
│       ├── stealthQuestions.ts               # Question bank & rotation logic
│       ├── rewardWheel.ts                    # Skinner variable-ratio prize RNG
│       └── storage.ts                        # Typed localStorage helpers
├── components/
│   └── features/
│       └── pet-companion/
│           ├── PetCompanionScreen/           # Root screen component
│           │   ├── PetCompanionScreen.tsx
│           │   └── PetCompanionScreen.style.ts
│           ├── PetAvatar/                    # Animated SVG / styled avatar
│           │   ├── PetAvatar.tsx
│           │   └── PetAvatar.style.ts
│           ├── StealthCheckinModal/          # 2-question daily flash check-in
│           │   ├── StealthCheckinModal.tsx
│           │   └── StealthCheckinModal.style.ts
│           ├── RewardWheel/                  # Confetti-enabled prize wheel
│           │   ├── RewardWheel.tsx
│           │   └── RewardWheel.style.ts
│           ├── CareActionTray/               # Potion, food, and movement buttons
│           │   ├── CareActionTray.tsx
│           │   └── CareActionTray.style.ts
│           └── VagalBreathingModal/          # Guided 4s/6s parasympathetic breath
│               ├── VagalBreathingModal.tsx
│               └── VagalBreathingModal.style.ts
└── app/
    └── companion/
        └── page.tsx                          # Route rendering PetCompanionScreen
```

---

## 3. Data Contracts (`src/types/pet.ts`)

Implement these exact types:

```typescript
export type PetMood = 'thriving' | 'recovering' | 'resting';

export type SicknessType = 'cosmic_cold' | 'engine_glitch' | 'star_fatigue';

export interface CosmeticItem {
  id: string;
  name: string;
  category: 'hat' | 'suit_color' | 'badge';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  assetUrl?: string;
}

export interface PetState {
  name: string;
  mood: PetMood;
  energyLevel: number; // 0 to 100
  activeSickness: SicknessType | null;
  lastFedTimestamp: number;
  lastCareTimestamp: number;
  unlockedCosmetics: string[]; // item IDs
  equippedCosmetics: {
    hat?: string;
    suitColor?: string;
  };
  totalStars: number;
}

export interface StealthAnswer {
  label: string;
  icon: string;
  clinicalScore: number; // Internal: 0 (healthy), 5 (mild), 10 (concerning)
}

export interface StealthQuestion {
  id: string;
  prompt: string;
  options: [StealthAnswer, StealthAnswer, StealthAnswer];
}

export interface WheelPrize {
  id: string;
  label: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  weight: number; // Probability weight
  rewardType: 'stars' | 'cosmetic';
  rewardValue: number | CosmeticItem;
}

export interface ChildDailyLog {
  date: string; // YYYY-MM-DD
  checkinCompleted: boolean;
  stealthAnswers: Record<string, number>; // questionId -> clinicalScore
  careActionsDone: string[]; // e.g. ['potion', 'vagal_breath', 'soothing_fuel']
}
```

---

## 4. Core Logic & Algorithms (`src/lib/pet/`)

### 4.1 Stochastic Biology Simulator (`petSimulator.ts`)
Instead of decreasing health when the user fails a streak, health transitions follow a **Poisson random event**:

```typescript
/**
 * Evaluates whether an autonomous sickness event occurs.
 * Event rate: ~1 every 4-5 days (lambda = 0.22/day).
 * DOES NOT penalize for missed days!
 */
export function evaluateStochasticHealth(
  currentState: PetState,
  lastEvaluationTimestamp: number,
  nowTimestamp: number
): PetState {
  if (currentState.mood === 'recovering') {
    return currentState; // Already in care mode
  }

  const hoursElapsed = (nowTimestamp - lastEvaluationTimestamp) / (1000 * 60 * 60);
  const dayFractions = hoursElapsed / 24;
  const eventProbability = 1 - Math.exp(-0.22 * dayFractions);

  if (Math.random() < eventProbability) {
    const sicknesses: SicknessType[] = ['cosmic_cold', 'engine_glitch', 'star_fatigue'];
    const chosen = sicknesses[Math.floor(Math.random() * sicknesses.length)];
    
    return {
      ...currentState,
      mood: 'recovering',
      energyLevel: Math.max(25, currentState.energyLevel - 40),
      activeSickness: chosen,
    };
  }

  return currentState;
}
```

### 4.2 The Question Transmutation Bank (`stealthQuestions.ts`)
Provide 4 rotating child-friendly questions:

1. **`engine_status` (Abdominal Pain Proxy - wPCDAI):**
   * *Prompt:* "¿Cómo ha estado el motor de tu nave hoy?"
   * *Options:*
     * 🟢 *"¡A toda máquina, ni se sintió!"* (Score: 0)
     * 🟡 *"Hizo ruidos raros o cosquillas"* (Score: 5)
     * 🔴 *"Se recalentó y tuve que parar"* (Score: 10)
2. **`pit_stops` (Stool Frequency / Urgency Proxy - PRO2):**
   * *Prompt:* "¿Cuántas paradas de pits express tuviste hoy?"
   * *Options:*
     * 🟢 *"1 o 2 normales, súper tranquilo"* (Score: 0)
     * 🟡 *"3 o 4, tuve que ir ligerito"* (Score: 5)
     * 🔴 *"¡Más de 5! Parecía una carrera express"* (Score: 10)
3. **`night_mission` (Nocturnal Awakening Proxy - wPCDAI):**
   * *Prompt:* "¿Cómo durmió tu personaje anoche?"
   * *Options:*
     * 🟢 *"De un tirón hasta la alarma"* (Score: 0)
     * 🟡 *"Me desperté un ratito a beber agua"* (Score: 2)
     * 🔴 *"Tuve que ir corriendo al baño a oscuras"* (Score: 10)
4. **`battery_level` (Vitality / Fatigue Proxy):**
   * *Prompt:* "¿Cuánta batería le queda a tu héroe para la tarde?"
   * *Options:*
     * 🟢 *"100%: ¡Listo para conquistar el mundo!"* (Score: 0)
     * 🟡 *"50%: Modo peli y sofá tranquilo"* (Score: 5)
     * 🔴 *"15%: Se me cerraban los ojos"* (Score: 10)

### 4.3 Variable-Ratio Reward Wheel (`rewardWheel.ts`)
* Implements Skinner variable-ratio reinforcement:
  * ⭐ Common (45%): 10–25 Galactic Stars.
  * 🎨 Uncommon (30%): New Suit Colors (Cosmic Teal, Solar Yellow, Nebula Pink).
  * 🎩 Rare (20%): Fun Hats (Astronaut Helmet, Crown, Pirate Hat, Beanie).
  * 🌟 Legendary (5%): Golden Capy Skin.

---

## 5. UI Components & Screen Flow (`src/components/features/pet-companion/`)

### Flow 1: Daily Check-In & Wheel
1. **On screen load:** If `checkinCompleted === false` for today, show `StealthCheckinModal`.
2. Present **exactly 2 questions** with playful card buttons.
3. Upon second selection: trigger confetti animation and present `RewardWheel`.
4. Spin wheel $\rightarrow$ show prize popup $\rightarrow$ add reward to `PetState` inventory in `localStorage`.

### Flow 2: Empathic Care Actions
Display the pet avatar in the center. At the bottom, render `CareActionTray`:
1. **🧪 Poción a su hora (Medication mirror):**
   * Shows a scheduled elixir icon.
   * Tap/drag to give Capy the potion. Capy sparkles: *"¡Poción tomada! Escudo al 100%"*.
2. **🫁 Escudo Vagal (Breathing exercise):**
   * Opens `VagalBreathingModal`.
   * An animated circular ripple: expands for 4 seconds (*"Inhala profundo..."*), holds 1s, contracts for 6 seconds (*"Exhala despacito..."*).
   * After 3 breath cycles (30s): restores 15 energy points to Capy.
3. **🥗 Combustible Suave (Nutrition education):**
   * Offers 2 choices: Soothing Golden Broth vs. Fizzy Soda.
   * Choosing soothing fuel makes Capy purr happily and raises health; choosing fizzy soda prompts a gentle message: *"Capy tiene la pancita sensible, prefiere el caldo dorado"*.

---

## 6. Styling Rules & Best Practices

Remember the project rules in `AGENTS.md`:
* **Component file structure:**
  ```tsx
  // src/components/features/pet-companion/PetAvatar/PetAvatar.tsx
  "use client";

  import { AvatarContainer, CharacterGlow, PetImage } from "./PetAvatar.style";
  import type { PetMood } from "@/types/pet";

  interface PetAvatarProps {
    mood: PetMood;
    name: string;
  }

  export function PetAvatar({ mood, name }: PetAvatarProps) {
    return (
      <AvatarContainer $mood={mood} aria-label={`${name} is currently ${mood}`}>
        <CharacterGlow $mood={mood} />
        <PetImage $mood={mood} />
      </AvatarContainer>
    );
  }
  ```
* **Styled-components file:**
  ```ts
  // src/components/features/pet-companion/PetAvatar/PetAvatar.style.ts
  import styled, { keyframes, css } from "styled-components";
  import type { PetMood } from "@/types/pet";

  const floatAnimation = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  `;

  export const AvatarContainer = styled.figure<{ $mood: PetMood }>`
    position: relative;
    width: 220px;
    height: 220px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: ${floatAnimation} 3s ease-in-out infinite;
  `;
  ```

---

## 7. Step-by-Step Task Checklist for Farouk

- [ ] **Step 1: Create Branch**
  ```sh
  git switch main
  git pull
  git switch -c feat/pet-companion
  ```
- [ ] **Step 2: Types & Storage**
  * Create `src/types/pet.ts`.
  * Create `src/lib/pet/storage.ts` with typed `localStorage` get/set helpers.
- [ ] **Step 3: Core Simulation Logic & Vitest Tests**
  * Create `src/lib/pet/petSimulator.ts`, `rewardWheel.ts`, and `stealthQuestions.ts`.
  * Write `src/lib/pet/petSimulator.test.ts` verifying stochastic transitions and reward probabilities.
  * Run `pnpm test` and ensure all unit tests pass.
- [ ] **Step 4: UI Components**
  * Implement `PetAvatar`, `CareActionTray`, `VagalBreathingModal`, `StealthCheckinModal`, and `RewardWheel`.
  * Verify each `.tsx` has a sibling `.style.ts` using theme tokens.
- [ ] **Step 5: Companion Screen & Route**
  * Assemble into `PetCompanionScreen.tsx` and export page route at `src/app/companion/page.tsx`.
  * Add navigation link from home or access card.
- [ ] **Step 6: Pre-Commit & Quality Gate**
  * Test at mobile width (**360px**).
  * Run `pnpm check` (typecheck + lint + test + build). It must pass with **0 errors and 0 warnings**.
- [ ] **Step 7: Push & Open PR**
  ```sh
  git push -u origin feat/pet-companion
  ```
  * Open PR to `main` with summary and screenshots. Request review from Alberto (`@Alberviz`).
