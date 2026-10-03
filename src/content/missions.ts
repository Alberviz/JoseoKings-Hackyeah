import { MISSION_IDS } from "@/config/content-ids";
import type { Mission } from "@/types";

export const MISSIONS: Mission[] = [
  {
    // source: to verify
    id: MISSION_IDS.dragonBreathing,
    title: "Dragon Breathing",
    kind: "breathing",
    parentNote: "Gentle breathing exercises can be done while sitting or resting.",
    steps: [
      {
        text: "Sit comfortably and breathe in slowly through your nose.",
        durationSeconds: 15,
        poseKey: "breathe",
      },
      {
        text: "Gently breathe out like a dragon warming up.",
        durationSeconds: 20,
        poseKey: "breathe",
      },
      {
        text: "Take another deep, slow breath into your belly.",
        durationSeconds: 20,
        poseKey: "breathe",
      },
      {
        text: "Blow out a slow, steady warm breath and relax.",
        durationSeconds: 20,
        poseKey: "cheer",
      },
    ],
  },
  {
    // source: to verify
    id: MISSION_IDS.bedStretch,
    title: "Bed Stretch",
    kind: "stretch",
    parentNote: "A relaxed morning or evening stretch routine done while lying down.",
    steps: [
      {
        text: "Lie comfortably on your back and reach your arms overhead.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Gently hug one knee toward your chest and hold softly.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Switch sides and gently hug your other knee.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Stretch your arms and legs out long and take an easy breath.",
        durationSeconds: 20,
        poseKey: "cheer",
      },
    ],
  },
  {
    // source: to verify
    id: MISSION_IDS.flamingoBalance,
    title: "Flamingo Balance",
    kind: "balance",
    parentNote: "Single-leg balance practice using a wall or chair for light support.",
    steps: [
      {
        text: "Stand near a wall for support and lift one foot slightly.",
        durationSeconds: 20,
        poseKey: "balance",
      },
      {
        text: "Lower your foot and rest both feet flat on the floor.",
        durationSeconds: 15,
        poseKey: "idle",
      },
      {
        text: "Lift your other foot slightly while keeping your balance steady.",
        durationSeconds: 20,
        poseKey: "balance",
      },
      {
        text: "Stand tall on both feet with your companion.",
        durationSeconds: 15,
        poseKey: "cheer",
      },
    ],
  },
  {
    // source: to verify
    id: MISSION_IDS.wallSit,
    title: "Wall Sit",
    kind: "strength",
    parentNote: "A static bodyweight movement against a wall at a comfortable depth.",
    steps: [
      {
        text: "Lean your back flat against a wall and slide down a little bit.",
        durationSeconds: 20,
        poseKey: "strength",
      },
      {
        text: "Stand up, shake out your legs, and catch your breath.",
        durationSeconds: 15,
        poseKey: "idle",
      },
      {
        text: "Lean against the wall again and hold a comfortable position.",
        durationSeconds: 20,
        poseKey: "strength",
      },
      {
        text: "Stand tall and celebrate with your companion.",
        durationSeconds: 15,
        poseKey: "cheer",
      },
    ],
  },
  {
    // source: to verify
    id: MISSION_IDS.rollingWave,
    title: "Rolling Wave",
    kind: "stretch",
    parentNote: "Slow upper-body mobility movements with rhythmic breathing.",
    steps: [
      {
        text: "Stand with soft knees and gently roll your shoulders backward.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Sway your arms side to side like gentle water waves.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Take a deep breath and sweep your arms up toward the sky.",
        durationSeconds: 20,
        poseKey: "breathe",
      },
      {
        text: "Lower your arms slowly and finish with a big smile.",
        durationSeconds: 15,
        poseKey: "cheer",
      },
    ],
  },
];
