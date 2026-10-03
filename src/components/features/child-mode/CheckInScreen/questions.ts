import type { CheckInQuestion } from "@/types";

/**
 * Pediatric IBD check-in indicators grounded in PROMIS Pediatric & IMPACT-III.
 * Transmuted into a playful virtual pet status check (Pou/Tamagotchi style) for ages 8-12.
 *
 * Excluded from child view (handled by parents/clinician):
 * - Bristol stool scale / frequency (embarrassing, clinical).
 * - Nocturnal diarrhea / rectal bleeding (causes anxiety).
 * - Medication compliance details (parental responsibility).
 *
 * Included child-reported outcomes:
 * 1. Belly Comfort (Abdominal sensation proxy)
 * 2. Energy Battery (Fatigue & vitality proxy)
 * 3. Play Stamina (Functional impact / movement proxy)
 */
export const POU_CHECKIN_QUESTIONS: CheckInQuestion[] = [
  {
    id: "belly_comfort",
    kind: "faces",
    // source: PROMIS Pediatric Pain Interference (Schuchard 2020)
    prompt: "How is your belly feeling right now?",
    options: [
      {
        value: 0,
        label: "Calm and peaceful",
        iconKey: "calm",
      },
      {
        value: 1,
        label: "A little rumble or sensitive",
        iconKey: "uneasy",
      },
      {
        value: 2,
        label: "Uncomfortable, needs care",
        iconKey: "hurting",
      },
    ],
  },
  {
    id: "energy_level",
    kind: "battery",
    // source: PROMIS Pediatric Fatigue / PedsQL (Miller 2021)
    prompt: "What's your energy battery level today?",
    options: [
      {
        value: 0,
        label: "Super charged (100%)",
        iconKey: "battery_full",
      },
      {
        value: 1,
        label: "Half battery (50%)",
        iconKey: "battery_half",
      },
      {
        value: 2,
        label: "Running low (15%)",
        iconKey: "battery_low",
      },
    ],
  },
  {
    id: "daily_pace",
    kind: "counter",
    // source: IMPACT-III play & social functional stamina (Griffiths 2026)
    prompt: "How did your body want to move today?",
    options: [
      {
        value: 0,
        label: "Active and on the move",
        iconKey: "pace_steady",
      },
      {
        value: 1,
        label: "Took cozy breaks between play",
        iconKey: "pace_paused",
      },
      {
        value: 2,
        label: "Needed lots of quiet rest",
        iconKey: "pace_stopped",
      },
    ],
  },
];
