/**
 * Exercise animation library.
 * Each movement is two key poses (A = start, B = end) for a side-view figure. The renderer
 * interpolates between them and solves elbows/knees with 2-link IK, so poses only need
 * pelvis, torso and hand/foot targets.
 *
 * Coordinates: 200×200 viewBox, y grows downward, ground at y = 178, figure faces right.
 */

export type Vec = [number, number];

export interface Pose {
  pelvis: Vec;
  /** torso lean in degrees from vertical (positive = forward/right). Ignored if `shoulder` is set. */
  torso?: number;
  /** explicit shoulder position (for lying moves) */
  shoulder?: Vec;
  /** near hand, relative to shoulder */
  hand: Vec;
  /** far hand, relative to shoulder (defaults to near hand) */
  handFar?: Vec;
  /** near ankle: world position, or relative to pelvis when move.feetFromPelvis */
  foot: Vec;
  footFar?: Vec;
}

export type Gear = "barbell" | "dumbbell" | "cable" | "bench" | "seat" | "bar" | "mat" | "box" | "none";
export type Highlight = "thigh" | "shin" | "upperArm" | "forearm" | "torso" | "hip";

export interface Move {
  key: string;
  title: string;
  muscles: string[];
  cues: string[];
  mistake: string;
  a: Pose;
  b: Pose;
  gear: Gear[];
  /** where the barbell/dumbbell sits: at the hands (default) */
  highlight: Highlight[];
  feetFromPelvis?: boolean;
  cableFrom?: Vec;
  /** ms for one full rep (A → B → A) */
  tempo?: number;
  /** hold at B (isometric moves) */
  hold?: boolean;
}

const STAND = 98;

export const MOVES: Record<string, Move> = {
  squat: {
    key: "squat",
    title: "Squat",
    muscles: ["Quads", "Glutes", "Core"],
    cues: ["Feet shoulder-width, toes slightly out", "Brace your core and take a breath", "Sit hips back and down, knees track over toes", "Drive up through the whole foot"],
    mistake: "Knees caving in or heels lifting off the floor.",
    a: { pelvis: [98, STAND], torso: 6, hand: [-4, 8], foot: [100, 172] },
    b: { pelvis: [76, 136], torso: 40, hand: [-4, 8], foot: [100, 172] },
    gear: ["barbell"],
    highlight: ["thigh", "hip"],
  },
  goblet: {
    key: "goblet",
    title: "Goblet / front squat",
    muscles: ["Quads", "Glutes", "Upper back"],
    cues: ["Hold the weight tight at your chest", "Elbows point down, chest stays tall", "Squat between your heels until thighs are parallel", "Stand up by pushing the floor away"],
    mistake: "Letting the chest drop and the weight pull you forward.",
    a: { pelvis: [98, STAND], torso: 4, hand: [14, 12], foot: [100, 172] },
    b: { pelvis: [80, 138], torso: 22, hand: [14, 12], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["thigh", "hip"],
  },
  hinge: {
    key: "hinge",
    title: "Hip hinge / deadlift",
    muscles: ["Hamstrings", "Glutes", "Lower back"],
    cues: ["Soft knees, bar or weights close to your legs", "Push your hips back like closing a car door", "Keep a flat back, chest proud", "Squeeze glutes to stand tall"],
    mistake: "Rounding the lower back or squatting the weight down.",
    a: { pelvis: [98, STAND], torso: 4, hand: [0, 52], foot: [100, 172] },
    b: { pelvis: [84, 106], torso: 76, hand: [0, 52], foot: [100, 172] },
    gear: ["barbell"],
    highlight: ["thigh", "hip"],
  },
  bridge: {
    key: "bridge",
    title: "Hip thrust / glute bridge",
    muscles: ["Glutes", "Hamstrings"],
    cues: ["Feet flat, about a shin-length from your hips", "Tuck your chin and ribs down", "Drive through your heels and lift your hips", "Squeeze glutes hard at the top for a second"],
    mistake: "Arching the lower back instead of using the glutes.",
    a: { pelvis: [106, 172], shoulder: [60, 170], hand: [53, 5], foot: [136, 172] },
    b: { pelvis: [106, 140], shoulder: [60, 170], hand: [53, 5], foot: [136, 172] },
    gear: ["mat"],
    highlight: ["hip", "thigh"],
  },
  bench: {
    key: "bench",
    title: "Chest press",
    muscles: ["Chest", "Front shoulders", "Triceps"],
    cues: ["Shoulder blades pulled back and down", "Feet planted, slight arch in the upper back", "Lower to the middle of your chest with control", "Press up and slightly back over your shoulders"],
    mistake: "Flaring elbows straight out to the sides.",
    a: { pelvis: [118, 134], shoulder: [72, 132], hand: [0, -54], foot: [150, 172] },
    b: { pelvis: [118, 134], shoulder: [72, 132], hand: [4, -14], foot: [150, 172] },
    gear: ["bench", "barbell"],
    highlight: ["torso", "upperArm"],
  },
  pushup: {
    key: "pushup",
    title: "Push-up",
    muscles: ["Chest", "Triceps", "Core"],
    cues: ["Hands under shoulders, body in one straight line", "Squeeze glutes and brace your core", "Lower your chest towards the floor", "Push the floor away to the top"],
    mistake: "Hips sagging or piking up.",
    a: { pelvis: [80, 147], shoulder: [124, 128], hand: [2, 50], foot: [8, 170] },
    b: { pelvis: [80, 166], shoulder: [124, 161], hand: [2, 17], foot: [8, 170] },
    gear: ["mat"],
    highlight: ["torso", "upperArm"],
  },
  press: {
    key: "press",
    title: "Shoulder press",
    muscles: ["Shoulders", "Triceps", "Upper chest"],
    cues: ["Stand tall, squeeze glutes and brace", "Start with weights at chin height", "Press straight up until arms are locked", "Lower slowly back to your shoulders"],
    mistake: "Leaning back and turning it into a standing incline press.",
    a: { pelvis: [100, STAND + 6], torso: 0, hand: [8, -2], foot: [100, 172] },
    b: { pelvis: [100, STAND + 6], torso: 0, hand: [3, -48], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["upperArm"],
  },
  row: {
    key: "row",
    title: "Row",
    muscles: ["Upper back", "Lats", "Biceps"],
    cues: ["Hinge forward with a flat back", "Let your arms hang straight", "Pull elbows back towards your hips", "Squeeze shoulder blades, then lower slowly"],
    mistake: "Jerking the weight with your lower back.",
    a: { pelvis: [88, 104], torso: 70, hand: [0, 52], foot: [100, 172] },
    b: { pelvis: [88, 104], torso: 70, hand: [-12, 20], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["torso", "upperArm"],
  },
  pulldown: {
    key: "pulldown",
    title: "Lat pulldown",
    muscles: ["Lats", "Upper back", "Biceps"],
    cues: ["Grip just wider than shoulders", "Lean back slightly, chest up", "Pull the bar to your upper chest", "Control it back up to a full stretch"],
    mistake: "Pulling behind the neck or swinging your body.",
    a: { pelvis: [96, 136], torso: -8, hand: [8, -54], foot: [130, 172] },
    b: { pelvis: [96, 136], torso: -8, hand: [12, 2], foot: [130, 172] },
    gear: ["seat", "cable"],
    cableFrom: [104, 6],
    highlight: ["torso", "upperArm"],
  },
  pullup: {
    key: "pullup",
    title: "Pull-up",
    muscles: ["Lats", "Biceps", "Core"],
    cues: ["Hang with straight arms, shoulders engaged", "Pull your chest towards the bar", "Chin clears the bar", "Lower all the way down with control"],
    mistake: "Kipping or only doing half reps.",
    a: { pelvis: [100, 126], torso: 0, hand: [4, -52], foot: [12, 44] },
    b: { pelvis: [100, 96], torso: 0, hand: [4, -22], foot: [12, 44] },
    gear: ["bar"],
    feetFromPelvis: true,
    highlight: ["torso", "upperArm"],
  },
  lunge: {
    key: "lunge",
    title: "Lunge / split squat",
    muscles: ["Quads", "Glutes", "Balance"],
    cues: ["Take a long stride, torso upright", "Lower straight down", "Back knee hovers just above the floor", "Drive through the front heel to stand"],
    mistake: "Front knee collapsing inwards.",
    a: { pelvis: [96, 100], torso: 0, hand: [0, 52], foot: [128, 172], footFar: [60, 172] },
    b: { pelvis: [94, 134], torso: 0, hand: [0, 52], foot: [128, 172], footFar: [60, 172] },
    gear: ["dumbbell"],
    highlight: ["thigh", "hip"],
  },
  stepup: {
    key: "stepup",
    title: "Step-up",
    muscles: ["Quads", "Glutes"],
    cues: ["Whole foot on the step", "Lean slightly forward", "Drive through the top heel to stand", "Step down slowly"],
    mistake: "Pushing off the bottom foot instead of the top leg.",
    a: { pelvis: [96, 110], torso: 14, hand: [0, 52], foot: [124, 140], footFar: [82, 172] },
    b: { pelvis: [118, 66], torso: 2, hand: [0, 52], foot: [124, 140], footFar: [116, 140] },
    gear: ["box", "dumbbell"],
    highlight: ["thigh", "hip"],
  },
  plank: {
    key: "plank",
    title: "Plank",
    muscles: ["Core", "Shoulders", "Glutes"],
    cues: ["Elbows under shoulders", "Squeeze glutes, tuck the ribs", "Body straight from head to heels", "Breathe slowly and hold"],
    mistake: "Hips sagging towards the floor.",
    a: { pelvis: [80, 155], shoulder: [122, 146], hand: [24, 30], foot: [10, 170] },
    b: { pelvis: [80, 152], shoulder: [122, 145], hand: [24, 31], foot: [10, 170] },
    gear: ["mat"],
    highlight: ["torso"],
    tempo: 3600,
    hold: true,
  },
  deadbug: {
    key: "deadbug",
    title: "Core control",
    muscles: ["Deep core", "Abs"],
    cues: ["Lower back pressed into the floor", "Arms up, knees over hips", "Slowly reach opposite arm and leg away", "Return and switch sides"],
    mistake: "Lower back lifting off the floor.",
    a: { pelvis: [112, 172], shoulder: [66, 172], hand: [2, -50], handFar: [2, -50], foot: [150, 136], footFar: [150, 136] },
    b: { pelvis: [112, 172], shoulder: [66, 172], hand: [-44, -6], handFar: [2, -50], foot: [184, 166], footFar: [150, 136] },
    gear: ["mat"],
    highlight: ["torso"],
    tempo: 3200,
  },
  kneeraise: {
    key: "kneeraise",
    title: "Hanging knee raise",
    muscles: ["Lower abs", "Hip flexors", "Grip"],
    cues: ["Hang with shoulders engaged", "Curl your pelvis and lift your knees", "Bring knees to hip height or higher", "Lower slowly without swinging"],
    mistake: "Swinging to throw the legs up.",
    a: { pelvis: [100, 126], torso: 0, hand: [4, -52], foot: [10, 46] },
    b: { pelvis: [98, 122], torso: -4, hand: [4, -52], foot: [36, 12] },
    gear: ["bar"],
    feetFromPelvis: true,
    highlight: ["torso", "thigh"],
  },
  curl: {
    key: "curl",
    title: "Biceps curl",
    muscles: ["Biceps", "Forearms"],
    cues: ["Elbows pinned to your sides", "Curl up without swinging", "Squeeze at the top", "Lower slowly for 2–3 seconds"],
    mistake: "Swinging your body to lift the weight.",
    a: { pelvis: [100, STAND], torso: 0, hand: [4, 52], foot: [100, 172] },
    b: { pelvis: [100, STAND], torso: 0, hand: [18, 6], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["upperArm", "forearm"],
  },
  triceps: {
    key: "triceps",
    title: "Triceps extension",
    muscles: ["Triceps"],
    cues: ["Elbows tucked and still", "Only your forearms move", "Fully straighten your arms", "Return slowly to the start"],
    mistake: "Elbows drifting forward and shoulders taking over.",
    a: { pelvis: [100, STAND], torso: 8, hand: [20, 20], foot: [100, 172] },
    b: { pelvis: [100, STAND], torso: 8, hand: [10, 52], foot: [100, 172] },
    gear: ["cable"],
    cableFrom: [140, 6],
    highlight: ["upperArm"],
  },
  calf: {
    key: "calf",
    title: "Calf raise",
    muscles: ["Calves"],
    cues: ["Stand tall, balls of feet planted", "Rise as high as you can", "Pause at the top", "Lower heels slowly below the step if you can"],
    mistake: "Bouncing quickly with no pause.",
    a: { pelvis: [100, STAND], torso: 0, hand: [0, 52], foot: [100, 172] },
    b: { pelvis: [100, STAND - 10], torso: 0, hand: [0, 52], foot: [100, 162] },
    gear: ["none"],
    highlight: ["shin"],
    tempo: 1800,
  },
  cardio: {
    key: "cardio",
    title: "Cardio",
    muscles: ["Heart & lungs", "Legs"],
    cues: ["Stay at a pace where you can still talk", "Relaxed shoulders, steady breathing", "Land softly", "Keep it consistent rather than all-out"],
    mistake: "Going too hard and burning out early.",
    a: { pelvis: [100, STAND], torso: 4, hand: [-14, 38], handFar: [14, 38], foot: [114, 158], footFar: [92, 172] },
    b: { pelvis: [100, STAND], torso: 4, hand: [14, 38], handFar: [-14, 38], foot: [92, 172], footFar: [114, 158] },
    gear: ["none"],
    highlight: ["thigh"],
    tempo: 1000,
  },
};

/** Match a plan exercise name to an animation. Order matters: specific words first. */
const RULES: [RegExp, keyof typeof MOVES][] = [
  [/leg extension|leg press|hack squat/i, "goblet"],
  [/knee raise|leg raise|hanging/i, "kneeraise"],
  [/plank|side plank|hollow/i, "plank"],
  [/dead bug|crunch|pallof|core|ab /i, "deadbug"],
  [/calf|pogo/i, "calf"],
  [/curl(?!.*leg)|hammer/i, "curl"],
  [/tricep|skull|pushdown|dip|overhead triceps|triceps extension/i, "triceps"],
  [/hip thrust|glute bridge|bridge/i, "bridge"],
  [/romanian|rdl|deadlift|good-morning|hinge/i, "hinge"],
  [/step-up|step up/i, "stepup"],
  [/lunge|split squat|bulgarian|cossack/i, "lunge"],
  [/goblet|front squat|leg extension/i, "goblet"],
  [/squat|leg press|hack/i, "squat"],
  [/pull-up|pullup|chin-up/i, "pullup"],
  [/pulldown|pullover|lat pull|towel lat/i, "pulldown"],
  [/row|pull-apart|y-t-w|superman/i, "row"],
  [/push-up|pushup|shoulder tap/i, "pushup"],
  [/bench|chest press|floor press|incline/i, "bench"],
  [/press|arnold|pike/i, "press"],
  [/walk|run|cycl|cardio|jog|zone|interval|march/i, "cardio"],
];

export function moveFor(name: string): Move {
  for (const [re, key] of RULES) if (re.test(name)) return MOVES[key];
  return MOVES.squat;
}

/** "90 s" → 90, "2–3 min" → 120, "60–75 s" → 60 */
export function restSeconds(rest: string) {
  const n = parseFloat(rest.replace(",", "."));
  if (!Number.isFinite(n)) return 90;
  return /min/i.test(rest) ? Math.round(n * 60) : Math.round(n);
}

/** "8–12" → 8, "6–8" → 6 */
export function repTarget(reps: string) {
  const n = parseInt(reps, 10);
  return Number.isFinite(n) ? n : 10;
}
