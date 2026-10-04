import { MISSION_IDS } from "@/config/content-ids";
import type { Mission } from "@/types";
import { PLAY_GAMES } from "./games";

/** The gentle missions of the v1 mission list. They use companion poses and have no `mode` or `level`. */
export const GENTLE_MISSIONS: Mission[] = [
  {
    // source: Diaphragmatic breathing and relaxation response protocol in pediatric chronic abdominal pain and IBD (Keefer et al., Am J Gastroenterol 2011;106(5):914-923, https://pubmed.ncbi.nlm.nih.gov/21266961/; Levy et al., Am J Gastroenterol 2010;105(4):946-956, https://pubmed.ncbi.nlm.nih.gov/20216531/). Adapted for children by the biomedical team (Farouk & Álvaro).
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
    // source: Gentle supine stretching and low-intensity mobility in pediatric inflammatory bowel disease to relieve muscular guarding without abdominal compression (Ploeger et al., J Pediatr Gastroenterol Nutr 2012;54(5):694-704, https://pubmed.ncbi.nlm.nih.gov/22222564/; Grover et al., World J Gastroenterol 2016;22(44):9694-9703, https://pubmed.ncbi.nlm.nih.gov/27956795/). Adapted for children by the biomedical team (Farouk & Álvaro).
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
        text: "Gently bring one knee toward your chest without pressing against your belly.",
        durationSeconds: 20,
        poseKey: "stretch",
      },
      {
        text: "Switch sides and gently bring your other knee toward your chest.",
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
    // source: Supported unipedal balance and proprioception exercise with light handrail/wall contact in youth with chronic medical conditions (Wong et al., J Pediatr Gastroenterol Nutr 2013;56(4):450-456, https://pubmed.ncbi.nlm.nih.gov/23202573/; WHO Guidelines on physical activity for children living with chronic conditions 2020, https://pubmed.ncbi.nlm.nih.gov/33399424/). Adapted for children by the biomedical team (Farouk & Álvaro).
    id: MISSION_IDS.flamingoBalance,
    title: "Flamingo Balance",
    kind: "balance",
    parentNote: "Single-leg balance practice with a wall or chair for light support.",
    steps: [
      {
        text: "Stand near a wall with a light hand for support, and lift one foot slightly.",
        durationSeconds: 20,
        poseKey: "balance",
      },
      {
        text: "Lower your foot and rest both feet flat on the floor.",
        durationSeconds: 15,
        poseKey: "idle",
      },
      {
        text: "Lift your other foot slightly while keeping your light hand on the wall.",
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
    // source: Low-impact isometric quad strengthening with continuous breathing (avoiding Valsalva and abdominal pressure spikes) to support bone density and muscle mass in pediatric IBD (Ploeger et al., J Pediatr Gastroenterol Nutr 2012;54(5):694-704, https://pubmed.ncbi.nlm.nih.gov/22222564/; Sylvester et al., Curr Opin Pediatr 2011;23(5):540-546, https://pubmed.ncbi.nlm.nih.gov/21897230/). Adapted for children by the biomedical team (Farouk & Álvaro).
    id: MISSION_IDS.wallSit,
    title: "Wall Sit",
    kind: "strength",
    parentNote: "A shallow, gentle wall slide with easy breathing.",
    steps: [
      {
        text: "Lean your back against a wall and slide down a little, like sitting tall.",
        durationSeconds: 20,
        poseKey: "strength",
      },
      {
        text: "Stand up, shake out your legs, and catch an easy breath.",
        durationSeconds: 15,
        poseKey: "idle",
      },
      {
        text: "Lean against the wall again and hold your spot while breathing smoothly.",
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
    // source: Gentle upper-body mobility and coordinated thoracic arm movement with slow respiration to reduce autonomic sympathetic arousal (Jerath et al., Med Hypotheses 2006;67(3):566-571, https://pubmed.ncbi.nlm.nih.gov/16624497/; Ploeger et al., J Pediatr Gastroenterol Nutr 2012;54(5):694-704, https://pubmed.ncbi.nlm.nih.gov/22222564/). Adapted for children by the biomedical team (Farouk & Álvaro).
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

/** One source for every screen: the gentle missions, then the play games (filter by `mode` and `level`). */
export const MISSIONS: Mission[] = [...GENTLE_MISSIONS, ...PLAY_GAMES];
