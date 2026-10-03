import type { Mission } from "@/types";

// The play games from the team's games table (Farouk), for the v2 Play flow in Juan's sketch:
// "Game mode: Alone / Family" is `mode`, and "How are you feeling? Calm / Strong / Amazing" is `level` 1 / 2 / 3.
// The level only chooses which gentle game is shown; it never changes a reward (docs/PRODUCT.md section 5.2).
// The console game from the table is left out: there is nothing for the app to guide.
// Local type and ids until the shape is agreed for src/types and src/config/content-ids.ts.

export type PlayMode = "alone" | "family";

export type PlayLevel = 1 | 2 | 3;

export type PlayGame = Mission & {
  mode: PlayMode;
  level: PlayLevel;
};

/** Moves the exercise figure can show. Every step's `poseKey` in PLAY_GAMES is one of these. */
export const GAME_MOVE_KEYS = [
  "breathe-arms",
  "hold-pose",
  "tap-seated",
  "cat-cow",
  "stretch-neck",
  "stretch-side",
  "reach-up",
  "twist",
  "march",
  "walk",
  "tiptoe",
  "one-leg",
  "dance",
  "clap",
  "carry",
] as const;

export type GameMoveKey = (typeof GAME_MOVE_KEYS)[number];

export const GAME_IDS = {
  featherBreath: "feather-breath",
  animalStatue: "animal-statue",
  invisibleBalloon: "invisible-balloon",
  quickYoga: "quick-yoga",
  stretchDice: "stretch-dice",
  bodyTrafficLight: "body-traffic-light",
  treasureExplorer: "treasure-explorer",
  ninjaTiptoes: "ninja-tiptoes",
  danceMinute: "dance-minute",
  cushionCircuit: "cushion-circuit",
  stepClock: "step-clock",
  seatedBallPass: "seated-ball-pass",
  partnerStatues: "partner-statues",
  followTheBeat: "follow-the-beat",
  ninjaMirror: "ninja-mirror",
  countAndWalk: "count-and-walk",
  miniAdventure: "mini-adventure",
  energyDelivery: "energy-delivery",
  outdoorMission: "outdoor-mission",
} as const;

export const PLAY_GAMES: PlayGame[] = [
  // --- Alone, level 1 ---
  {
    id: GAME_IDS.featherBreath,
    title: "Feather Breath",
    kind: "breathing",
    mode: "alone",
    level: 1,
    parentNote: "Slow breathing with soft arm movements, done sitting.",
    steps: [
      {
        text: "Sit comfortably and imagine a feather on your hand.",
        durationSeconds: 15,
        poseKey: "breathe-arms",
      },
      {
        text: "Breathe in slowly through your nose and lift your arms softly.",
        durationSeconds: 15,
        poseKey: "breathe-arms",
      },
      {
        text: "Breathe out gently and blow the feather far away.",
        durationSeconds: 15,
        poseKey: "breathe-arms",
      },
      {
        text: "Again: arms up as you breathe in, arms down as you blow.",
        durationSeconds: 20,
        poseKey: "breathe-arms",
      },
    ],
  },
  {
    id: GAME_IDS.animalStatue,
    title: "Animal Statue",
    kind: "balance",
    mode: "alone",
    level: 1,
    parentNote: "The child holds still animal shapes for a few seconds each.",
    steps: [
      {
        text: "Pick an animal: a turtle, a cat or a frog.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
      {
        text: "Make your animal shape and stay still for ten seconds.",
        durationSeconds: 15,
        poseKey: "hold-pose",
      },
      {
        text: "Shake out your arms and pick another animal.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
      { text: "Freeze in your new animal shape.", durationSeconds: 15, poseKey: "hold-pose" },
      {
        text: "Relax and give your favourite animal a smile.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
    ],
  },
  {
    id: GAME_IDS.invisibleBalloon,
    title: "Invisible Balloon",
    kind: "strength",
    mode: "alone",
    level: 1,
    parentNote: "Done sitting on a chair, with hand movements only.",
    steps: [
      {
        text: "Sit on a chair and imagine a balloon floating above you.",
        durationSeconds: 10,
        poseKey: "tap-seated",
      },
      { text: "Tap the balloon up with one hand.", durationSeconds: 15, poseKey: "tap-seated" },
      { text: "Now tap it with your other hand.", durationSeconds: 15, poseKey: "tap-seated" },
      {
        text: "Keep it in the air with both hands, nice and gentle.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
    ],
  },
  {
    id: GAME_IDS.quickYoga,
    title: "Quick Yoga",
    kind: "stretch",
    mode: "alone",
    level: 1,
    parentNote: "A slow cat and cow stretch on hands and knees, on a soft surface.",
    steps: [
      { text: "Get on your hands and knees, like a cat.", durationSeconds: 10, poseKey: "cat-cow" },
      {
        text: "Round your back up slowly, like a stretching cat.",
        durationSeconds: 15,
        poseKey: "cat-cow",
      },
      {
        text: "Let your back dip gently and look ahead, like a cow.",
        durationSeconds: 15,
        poseKey: "cat-cow",
      },
      {
        text: "Switch between cat and cow, slowly, with your breath.",
        durationSeconds: 20,
        poseKey: "cat-cow",
      },
    ],
  },

  // --- Alone, level 2 ---
  {
    id: GAME_IDS.stretchDice,
    title: "Stretch Dice",
    kind: "stretch",
    mode: "alone",
    level: 2,
    parentNote: "Gentle neck, arm and upper body stretches, standing or sitting.",
    steps: [
      {
        text: "One: tilt your head slowly to each side.",
        durationSeconds: 15,
        poseKey: "stretch-neck",
      },
      {
        text: "Two: reach one arm up and lean gently to the side.",
        durationSeconds: 15,
        poseKey: "stretch-side",
      },
      {
        text: "Now reach the other arm up and lean the other way.",
        durationSeconds: 15,
        poseKey: "stretch-side",
      },
      {
        text: "Three: turn your upper body slowly left and right.",
        durationSeconds: 15,
        poseKey: "twist",
      },
      {
        text: "Pick your favourite stretch and do it once more.",
        durationSeconds: 15,
        poseKey: "reach-up",
      },
    ],
  },
  {
    id: GAME_IDS.bodyTrafficLight,
    title: "Body Traffic Light",
    kind: "strength",
    mode: "alone",
    level: 2,
    parentNote: "Arm movements and marching in place; the child chooses the pace.",
    steps: [
      {
        text: "Red light: move your arms slowly, like a sleepy tree.",
        durationSeconds: 15,
        poseKey: "breathe-arms",
      },
      {
        text: "Yellow light: march in place at an easy pace.",
        durationSeconds: 15,
        poseKey: "march",
      },
      {
        text: "Green light: march and swing your arms a little faster.",
        durationSeconds: 15,
        poseKey: "march",
      },
      {
        text: "Pick the colour you like best and do it again.",
        durationSeconds: 15,
        poseKey: "march",
      },
      {
        text: "Back to red: slow arms and a calm breath.",
        durationSeconds: 10,
        poseKey: "breathe-arms",
      },
    ],
  },
  {
    id: GAME_IDS.treasureExplorer,
    title: "Treasure Explorer",
    kind: "strength",
    mode: "alone",
    level: 2,
    parentNote: "The child walks around the room looking for objects of one colour.",
    steps: [
      {
        text: "Choose a colour for your treasure hunt.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
      {
        text: "Walk around the room and find one thing in that colour. Touch it!",
        durationSeconds: 20,
        poseKey: "walk",
      },
      { text: "Find a second treasure in the same colour.", durationSeconds: 20, poseKey: "walk" },
      {
        text: "Find the third treasure and walk back to your spot.",
        durationSeconds: 20,
        poseKey: "walk",
      },
    ],
  },
  {
    id: GAME_IDS.ninjaTiptoes,
    title: "Ninja Tiptoes",
    kind: "balance",
    mode: "alone",
    level: 2,
    parentNote: "Walking on tiptoes and standing on one foot, next to a wall.",
    steps: [
      {
        text: "Stand tall next to a wall, quiet like a ninja.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
      {
        text: "Walk on your tiptoes along an imaginary line.",
        durationSeconds: 20,
        poseKey: "tiptoe",
      },
      {
        text: "Stand on one foot and count to five. Touch the wall if you need to.",
        durationSeconds: 15,
        poseKey: "one-leg",
      },
      {
        text: "Now stand on your other foot and count to five.",
        durationSeconds: 15,
        poseKey: "one-leg",
      },
    ],
  },

  // --- Alone, level 3 ---
  {
    id: GAME_IDS.danceMinute,
    title: "Dance Minute",
    kind: "strength",
    mode: "alone",
    level: 3,
    parentNote: "Free dancing to music with both feet close to the floor.",
    steps: [
      {
        text: "Put on a song you like and find some space.",
        durationSeconds: 10,
        poseKey: "dance",
      },
      {
        text: "Dance any way you want, with your feet close to the floor.",
        durationSeconds: 20,
        poseKey: "dance",
      },
      {
        text: "Add your arms: wave them, swing them, make shapes.",
        durationSeconds: 20,
        poseKey: "dance",
      },
      { text: "Freeze for a second, then keep dancing.", durationSeconds: 15, poseKey: "dance" },
      {
        text: "Slow down and finish with a big breath.",
        durationSeconds: 10,
        poseKey: "breathe-arms",
      },
    ],
  },
  {
    id: GAME_IDS.cushionCircuit,
    title: "Cushion Circuit",
    kind: "balance",
    mode: "alone",
    level: 3,
    parentNote:
      "Walking around cushions on the floor. Use a non-slip floor and clear the space first.",
    steps: [
      {
        text: "Place a few cushions on the floor with space between them.",
        durationSeconds: 15,
        poseKey: "carry",
      },
      {
        text: "Walk around the cushions without touching them.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Turn around and walk the circuit the other way.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Step over each cushion slowly, one foot at a time.",
        durationSeconds: 20,
        poseKey: "march",
      },
      { text: "Stand still and take a calm breath.", durationSeconds: 10, poseKey: "breathe-arms" },
    ],
  },
  {
    id: GAME_IDS.stepClock,
    title: "Step Clock",
    kind: "strength",
    mode: "alone",
    level: 3,
    parentNote: "Marching in place while counting steps, at the child's own pace.",
    steps: [
      {
        text: "Get ready to march in place and count your steps.",
        durationSeconds: 10,
        poseKey: "march",
      },
      {
        text: "March and count out loud, at your own pace.",
        durationSeconds: 20,
        poseKey: "march",
      },
      {
        text: "Keep marching and lift your knees a little higher.",
        durationSeconds: 20,
        poseKey: "march",
      },
      { text: "Keep counting until the timer ends.", durationSeconds: 20, poseKey: "march" },
      {
        text: "Stop and say your number out loud. Every number counts!",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
    ],
  },

  // --- Family, level 1 ---
  {
    id: GAME_IDS.seatedBallPass,
    title: "Seated Ball Pass",
    kind: "strength",
    mode: "family",
    level: 1,
    parentNote: "Passing a soft ball or a balloon while sitting close together.",
    steps: [
      {
        text: "Sit close together with a soft ball or a balloon.",
        durationSeconds: 10,
        poseKey: "tap-seated",
      },
      {
        text: "Pass it gently to your grown-up with both hands.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
      {
        text: "Now pass it back and forth with one hand.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
      {
        text: "Try to keep it from touching the floor, together.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
    ],
  },
  {
    id: GAME_IDS.partnerStatues,
    title: "Partner Statues",
    kind: "balance",
    mode: "family",
    level: 1,
    parentNote: "Holding still in funny poses together for a few seconds each.",
    steps: [
      {
        text: "Stand next to each other and pick a funny pose together.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
      {
        text: "Freeze in your pose and stay still for ten seconds.",
        durationSeconds: 15,
        poseKey: "hold-pose",
      },
      { text: "Shake it out and pick a new pose.", durationSeconds: 10, poseKey: "hold-pose" },
      {
        text: "Freeze again. Can you both keep a straight face?",
        durationSeconds: 15,
        poseKey: "hold-pose",
      },
      { text: "Relax and give each other a high five.", durationSeconds: 10, poseKey: "clap" },
    ],
  },
  {
    id: GAME_IDS.followTheBeat,
    title: "Follow the Beat",
    kind: "strength",
    mode: "family",
    level: 1,
    parentNote: "Clapping and simple steps, copied in turns.",
    steps: [
      { text: "Your grown-up claps a short rhythm.", durationSeconds: 15, poseKey: "clap" },
      { text: "Copy it back with your own claps.", durationSeconds: 15, poseKey: "clap" },
      { text: "Now add a step: clap, step, clap.", durationSeconds: 15, poseKey: "march" },
      {
        text: "Take turns: you make a rhythm and they copy it.",
        durationSeconds: 20,
        poseKey: "clap",
      },
    ],
  },

  // --- Family, level 2 ---
  {
    id: GAME_IDS.ninjaMirror,
    title: "Ninja Mirror",
    kind: "stretch",
    mode: "family",
    level: 2,
    parentNote: "Copying slow moves face to face, taking turns to lead.",
    steps: [
      { text: "Stand face to face, like a mirror.", durationSeconds: 10, poseKey: "hold-pose" },
      {
        text: "Your grown-up makes three slow moves. Copy each one.",
        durationSeconds: 20,
        poseKey: "reach-up",
      },
      {
        text: "Now you lead: make three moves for them to copy.",
        durationSeconds: 20,
        poseKey: "stretch-side",
      },
      {
        text: "Do the last move together, at the same time.",
        durationSeconds: 15,
        poseKey: "reach-up",
      },
    ],
  },
  {
    id: GAME_IDS.countAndWalk,
    title: "Count and Walk",
    kind: "strength",
    mode: "family",
    level: 2,
    parentNote: "Walking together for about a minute while counting.",
    steps: [
      { text: "Walk together around the room or the house.", durationSeconds: 15, poseKey: "walk" },
      { text: "Count your steps out loud together.", durationSeconds: 20, poseKey: "walk" },
      {
        text: "Now count things you see: doors, chairs or windows.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      { text: "Stop and share your numbers.", durationSeconds: 10, poseKey: "hold-pose" },
    ],
  },
  {
    id: GAME_IDS.miniAdventure,
    title: "Mini Adventure",
    kind: "balance",
    mode: "family",
    level: 2,
    parentNote:
      "Stepping across cushions while holding hands. Use firm cushions on a non-slip floor.",
    steps: [
      {
        text: "Put cushions on the floor: they are stones across a river.",
        durationSeconds: 15,
        poseKey: "carry",
      },
      {
        text: "Step from stone to stone. Your grown-up can hold your hand.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Cross back the other way, slowly and carefully.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      { text: "You crossed the river together!", durationSeconds: 10, poseKey: "hold-pose" },
    ],
  },

  // --- Family, level 3 ---
  {
    id: GAME_IDS.energyDelivery,
    title: "Energy Delivery",
    kind: "strength",
    mode: "family",
    level: 3,
    parentNote: "Carrying a soft object across the room in turns, walking briskly.",
    steps: [
      {
        text: "Pick a soft object to deliver, like a cushion or a toy.",
        durationSeconds: 10,
        poseKey: "carry",
      },
      {
        text: "Walk briskly with it to the other side of the room.",
        durationSeconds: 20,
        poseKey: "carry",
      },
      {
        text: "Hand it to your grown-up. Now they carry it back.",
        durationSeconds: 20,
        poseKey: "carry",
      },
      {
        text: "Take turns a few more times, at your own pace.",
        durationSeconds: 20,
        poseKey: "carry",
      },
    ],
  },
  {
    id: GAME_IDS.outdoorMission,
    title: "Outdoor Mission",
    kind: "strength",
    mode: "family",
    level: 3,
    parentNote: "A short walking search in the hallway or the yard, together.",
    steps: [
      { text: "Go to the hallway or the yard together.", durationSeconds: 15, poseKey: "walk" },
      {
        text: "Find something round, something soft and something green.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Walk briskly to each thing you find and point at it.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Walk back together and tell each other what you found.",
        durationSeconds: 15,
        poseKey: "walk",
      },
    ],
  },
];
