import { GAME_IDS } from "@/config/content-ids";
import type { Mission, MoveKey, PlayLevel, PlayMode } from "@/types";

// The play games from the team's games table, for the v2 Play flow:
// "Game mode: Alone / Family" is `mode`, and the feeling chip (1, 2 or 3 dots) is `level`.
// The level only chooses which gentle game is shown; it never changes a reward (docs/PRODUCT.md section 5.2).
// Left out from the table: the console game (no screen-time games). No jumping, no running, no counting as a score.

/** Every move the exercise figure must know. Each play game step's `poseKey` is one of these. */
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
] as const satisfies readonly MoveKey[];

export type PlayGameStep = Mission["steps"][number] & { poseKey: MoveKey };

export type PlayGame = Omit<Mission, "steps"> &
  Required<Pick<Mission, "mode" | "level">> & { steps: PlayGameStep[] };

export type { PlayLevel, PlayMode };

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
    parentNote: "Done sitting on a chair, with gentle hand movements.",
    steps: [
      {
        text: "Sit back and picture a floating magic balloon above you.",
        durationSeconds: 10,
        poseKey: "tap-seated",
      },
      {
        text: "Tap the magic balloon high with your left hand.",
        durationSeconds: 15,
        poseKey: "tap-seated",
      },
      {
        text: "Boop it back up with your other hand.",
        durationSeconds: 15,
        poseKey: "tap-seated",
      },
      {
        text: "Keep the floaty balloon in the air with soft taps.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
    ],
  },
  {
    id: GAME_IDS.quickYoga,
    title: "Cat & Dragon",
    kind: "stretch",
    mode: "alone",
    level: 1,
    parentNote: "A slow back and belly stretch on hands and knees, on a soft surface.",
    steps: [
      {
        text: "Get on your hands and knees like a sleepy cat.",
        durationSeconds: 10,
        poseKey: "cat-cow",
      },
      {
        text: "Arch your back up tall like a stretching cat.",
        durationSeconds: 15,
        poseKey: "cat-cow",
      },
      {
        text: "Dip your back gently and peek ahead like a dragon.",
        durationSeconds: 15,
        poseKey: "cat-cow",
      },
      {
        text: "Gently switch between cat and dragon with your breath.",
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
        text: "Roll the dice to see which mystery stretch comes first.",
        durationSeconds: 10,
        poseKey: "hold-pose",
        iconKey: "dice",
      },
      {
        text: "Owl stretch: tilt your head gently from side to side.",
        durationSeconds: 15,
        poseKey: "stretch-neck",
      },
      {
        text: "Windmill stretch: reach high with one arm and sway sideways.",
        durationSeconds: 15,
        poseKey: "stretch-side",
      },
      {
        text: "Switch arms and sway to the other side like a tall tree.",
        durationSeconds: 15,
        poseKey: "stretch-side",
      },
      {
        text: "Helicopter turn: rotate your shoulders smoothly side to side.",
        durationSeconds: 15,
        poseKey: "twist",
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
        text: "Pick a colour: red is slow, yellow is easy, green is quick.",
        durationSeconds: 10,
        poseKey: "hold-pose",
        iconKey: "traffic-light",
      },
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
        text: "Pick a colour for your treasure hunt.",
        durationSeconds: 10,
        poseKey: "hold-pose",
        iconKey: "colour",
      },
      {
        text: "Walk around the room and touch one thing in that colour.",
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
        text: "Stand on one foot and touch the wall if you need to.",
        durationSeconds: 15,
        poseKey: "one-leg",
      },
      {
        text: "Now stand on your other foot, nice and still.",
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
    id: GAME_IDS.marchingClock,
    title: "Marching Clock",
    kind: "strength",
    mode: "alone",
    level: 3,
    parentNote: "Marching in place to a steady beat, at the child's own pace.",
    steps: [
      {
        text: "Stand tall and get ready to march like a clock.",
        durationSeconds: 10,
        poseKey: "march",
      },
      {
        text: "March in place to the steady beat: tick, tock, tick, tock.",
        durationSeconds: 20,
        poseKey: "march",
      },
      {
        text: "Keep marching and lift your knees a little higher.",
        durationSeconds: 20,
        poseKey: "march",
      },
      {
        text: "Swing your arms like giant clock hands in a tower.",
        durationSeconds: 20,
        poseKey: "march",
      },
      {
        text: "Slow down, stop and take a calm breath.",
        durationSeconds: 10,
        poseKey: "breathe-arms",
      },
    ],
  },

  // --- Family, level 1 ---
  {
    id: GAME_IDS.seatedBallPass,
    title: "Space Orb Pass",
    kind: "strength",
    mode: "family",
    level: 1,
    parentNote: "Passing a soft ball or balloon while sitting close together.",
    steps: [
      {
        text: "Sit close together with a soft ball or balloon.",
        durationSeconds: 10,
        poseKey: "tap-seated",
      },
      {
        text: "Pass the space orb gently to your partner with two hands.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
      {
        text: "Now pass the orb back and forth with one hand.",
        durationSeconds: 20,
        poseKey: "tap-seated",
      },
      {
        text: "Keep the flying orb in the air without touching the floor.",
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
        text: "Freeze again and try to keep a straight face.",
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
        text: "Copy three slow moves your grown-up makes.",
        durationSeconds: 20,
        poseKey: "reach-up",
      },
      {
        text: "Now you lead with three moves for them to copy.",
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
    title: "Detective Patrol",
    kind: "strength",
    mode: "family",
    level: 2,
    parentNote: "Walking together for about a minute, spotting things around the house.",
    steps: [
      {
        text: "Start your detective patrol together around the room.",
        durationSeconds: 15,
        poseKey: "walk",
      },
      {
        text: "Spot all the doors you pass and whisper their count.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Now spot chairs or windows like a spy on a mission.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Stop and report your favourite mystery discovery to each other.",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
    ],
  },
  {
    id: GAME_IDS.miniAdventure,
    title: "River of Lava",
    kind: "balance",
    mode: "family",
    level: 2,
    parentNote:
      "Stepping across cushions while holding hands. Use firm cushions on a non-slip floor.",
    steps: [
      {
        text: "Put cushions on the floor as stepping stones across the river.",
        durationSeconds: 15,
        poseKey: "carry",
      },
      {
        text: "Step from stone to stone while your grown-up holds your hand.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Cross back the other way, carefully avoiding the hot lava.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "You made it safely across the wild river together!",
        durationSeconds: 10,
        poseKey: "hold-pose",
      },
    ],
  },

  // --- Family, level 3 ---
  {
    id: GAME_IDS.energyDelivery,
    title: "Dragon Egg Express",
    kind: "strength",
    mode: "family",
    level: 3,
    parentNote: "Carrying a soft toy or cushion across the room in turns, walking briskly.",
    steps: [
      {
        text: "Pick a cushion or toy: it is a fragile dragon egg!",
        durationSeconds: 10,
        poseKey: "carry",
      },
      {
        text: "Walk briskly with the precious egg to the other side.",
        durationSeconds: 20,
        poseKey: "carry",
      },
      {
        text: "Hand the egg to your grown-up so they can carry it back.",
        durationSeconds: 20,
        poseKey: "carry",
      },
      {
        text: "Take turns making safe deliveries at your own pace.",
        durationSeconds: 20,
        poseKey: "carry",
      },
    ],
  },
  {
    id: GAME_IDS.outdoorMission,
    title: "Nature Scout",
    kind: "strength",
    mode: "family",
    level: 3,
    parentNote: "A short walking search in the hallway or the yard, together.",
    steps: [
      {
        text: "Head out to the hallway or the yard together on a mission.",
        durationSeconds: 15,
        poseKey: "walk",
      },
      {
        text: "Scout for something round, something soft and something green.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Walk briskly to each target you spot and point at it.",
        durationSeconds: 20,
        poseKey: "walk",
      },
      {
        text: "Walk back together and share your cool discoveries.",
        durationSeconds: 15,
        poseKey: "walk",
      },
    ],
  },
];
