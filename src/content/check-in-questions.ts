import { QUESTION_IDS } from "@/config/content-ids";
import type { CheckInQuestion } from "@/types";

export const CHECK_IN_QUESTIONS: CheckInQuestion[] = [
  {
    id: QUESTION_IDS.bellyComfort,
    kind: "faces",
    // source: to verify
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
    // source: to verify
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
    // source: to verify
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
