import { QUESTION_IDS } from "@/config/content-ids";
import type { CheckInQuestion } from "@/types";

export const CHECK_IN_QUESTIONS: CheckInQuestion[] = [
  {
    id: QUESTION_IDS.bellyComfort,
    kind: "faces",
    // source: Adapted from Pediatric Crohn's Disease Activity Index (PCDAI) abdominal pain item (0 = None, 1 = Mild, 2 = Moderate/Severe; Hyams et al., J Pediatr Gastroenterol Nutr 1991;12(4):439-447, https://pubmed.ncbi.nlm.nih.gov/1678008/) with visual self-report principles from Faces Pain Scale - Revised (FPS-R; Hicks et al., Pain 2001;93(2):173-183, https://pubmed.ncbi.nlm.nih.gov/11427329/). Adapted for children by the biomedical team (Farouk & Álvaro).
    prompt: "How is your belly feeling today?",
    options: [
      {
        value: 0,
        label: "Calm and comfortable",
        iconKey: "belly-calm",
      },
      {
        value: 1,
        label: "A little rumble",
        iconKey: "belly-rumble",
      },
      {
        value: 2,
        label: "Sore or uncomfortable",
        iconKey: "belly-sore",
      },
    ],
  },
  {
    id: QUESTION_IDS.energy,
    kind: "battery",
    // source: Adapted from PCDAI general well-being item (0 = Well, 1 = Below par, 2 = Very poor; Hyams et al., 1991, https://pubmed.ncbi.nlm.nih.gov/1678008/) and PedsQL Multidimensional Fatigue Scale child self-report energy scale (Varni et al., Cancer 2002;94(7):2090-2106, https://pubmed.ncbi.nlm.nih.gov/11932914/). Adapted for children by the biomedical team (Farouk & Álvaro).
    prompt: "How is your energy today?",
    options: [
      {
        value: 0,
        label: "Full energy",
        iconKey: "energy-high",
      },
      {
        value: 1,
        label: "Medium energy",
        iconKey: "energy-medium",
      },
      {
        value: 2,
        label: "Low energy",
        iconKey: "energy-low",
      },
    ],
  },
  {
    id: QUESTION_IDS.playPace,
    kind: "counter",
    // source: Adapted from IMPACT-III pediatric IBD health-related quality of life questionnaire physical functioning domain (Otley et al., J Pediatr Gastroenterol Nutr 2002;35(4):557-563, https://pubmed.ncbi.nlm.nih.gov/12394384/) and PCDAI functional limitation. Adapted for children by the biomedical team (Farouk & Álvaro).
    prompt: "How did you feel like moving today?",
    options: [
      {
        value: 0,
        label: "Active and on the move",
        iconKey: "play-active",
      },
      {
        value: 1,
        label: "Taking breaks to rest",
        iconKey: "play-breaks",
      },
      {
        value: 2,
        label: "Resting most of the day",
        iconKey: "play-resting",
      },
    ],
  },
];
