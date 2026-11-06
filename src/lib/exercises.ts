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

export type Gear = "barbell" | "dumbbell" | "cable" | "bench" | "seat" | "bar" | "mat" | "box" | "bike" | "none";
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
  /** which way knees bend (default -1 = forward); 1 for moves like a lying leg curl */
  kneeSign?: 1 | -1;
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
  // ---------------- added: isolation, core, conditioning ----------------
  raise: {
    key: "raise",
    title: "Raise",
    muscles: ["Shoulders", "Upper traps"],
    cues: ["Soft bend in the elbows", "Lift to shoulder height, no higher", "Lead with the elbows, thumbs neutral", "Lower slowly over 2–3 seconds"],
    mistake: "Swinging the weights up with your back instead of lifting with the shoulders.",
    a: { pelvis: [100, STAND], torso: 0, hand: [6, 52], foot: [100, 172] },
    b: { pelvis: [100, STAND], torso: 0, hand: [50, 4], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["upperArm"],
  },
  fly: {
    key: "fly",
    title: "Chest fly",
    muscles: ["Chest", "Front shoulders"],
    cues: ["Slight, fixed bend in the elbows", "Open wide until you feel a chest stretch", "Hug the weights back together over your chest", "Keep shoulder blades pinned to the bench"],
    mistake: "Bending the elbows more and more until it turns into a press.",
    a: { pelvis: [118, 134], shoulder: [72, 132], hand: [-6, 24], foot: [150, 172] },
    b: { pelvis: [118, 134], shoulder: [72, 132], hand: [2, -50], foot: [150, 172] },
    gear: ["bench", "dumbbell"],
    highlight: ["torso", "upperArm"],
  },
  reardelt: {
    key: "reardelt",
    title: "Rear delt fly",
    muscles: ["Rear shoulders", "Upper back"],
    cues: ["Hinge forward with a flat back", "Arms nearly straight", "Raise out to the sides, squeeze the shoulder blades", "Light weight, slow lowering"],
    mistake: "Using heavy weights and shrugging instead of moving from the rear shoulders.",
    a: { pelvis: [88, 104], torso: 70, hand: [0, 52], foot: [100, 172] },
    b: { pelvis: [88, 104], torso: 70, hand: [-24, 18], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["upperArm", "torso"],
  },
  shrug: {
    key: "shrug",
    title: "Shrug",
    muscles: ["Traps"],
    cues: ["Stand tall, arms long", "Lift the shoulders straight up to your ears", "Pause 1 second at the top", "No rolling the shoulders"],
    mistake: "Rolling the shoulders or bending the elbows to move more weight.",
    a: { pelvis: [100, STAND], shoulder: [100, 52], hand: [0, 52], foot: [100, 172] },
    b: { pelvis: [100, STAND], shoulder: [100, 42], hand: [0, 52], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["torso"],
    tempo: 2000,
  },
  uprightrow: {
    key: "uprightrow",
    title: "Upright row",
    muscles: ["Shoulders", "Traps"],
    cues: ["Hands about shoulder-width", "Lead with the elbows", "Stop when elbows reach shoulder height", "Bar stays close to the body"],
    mistake: "Pulling too high with a narrow grip, which pinches the shoulders.",
    a: { pelvis: [100, STAND], torso: 0, hand: [6, 52], foot: [100, 172] },
    b: { pelvis: [100, STAND], torso: 0, hand: [12, 6], foot: [100, 172] },
    gear: ["barbell"],
    highlight: ["upperArm"],
  },
  legcurl: {
    key: "legcurl",
    title: "Leg curl",
    muscles: ["Hamstrings", "Calves"],
    cues: ["Hips pressed into the pad", "Curl your heels towards your glutes", "Squeeze at the top", "Lower slowly to almost straight"],
    mistake: "Lifting the hips off the pad to swing the weight.",
    a: { pelvis: [112, 132], shoulder: [64, 130], hand: [-14, 8], foot: [186, 132] },
    b: { pelvis: [112, 132], shoulder: [64, 130], hand: [-14, 8], foot: [156, 96] },
    gear: ["bench"],
    highlight: ["thigh"],
    kneeSign: 1,
  },
  legext: {
    key: "legext",
    title: "Leg extension",
    muscles: ["Quads"],
    cues: ["Back against the pad, hold the handles", "Straighten the legs fully", "Squeeze the quads for 1 second", "Lower slowly without letting the stack touch"],
    mistake: "Kicking the weight up fast and dropping it back down.",
    a: { pelvis: [96, 136], torso: -8, hand: [8, 46], foot: [122, 174] },
    b: { pelvis: [96, 136], torso: -8, hand: [8, 46], foot: [168, 128] },
    gear: ["seat"],
    highlight: ["thigh"],
  },
  sidelying: {
    key: "sidelying",
    title: "Hip abduction",
    muscles: ["Outer glutes", "Hips"],
    cues: ["Hips stacked, don't roll back", "Lift the top leg with the toes pointing forward", "Pause at the top", "Lower with control"],
    mistake: "Rolling the hips backwards so the front of the thigh does the work.",
    a: { pelvis: [104, 168], shoulder: [58, 162], hand: [8, -14], foot: [178, 172], footFar: [178, 172] },
    b: { pelvis: [104, 168], shoulder: [58, 162], hand: [8, -14], foot: [172, 136], footFar: [178, 172] },
    gear: ["mat"],
    highlight: ["hip"],
  },
  kickback: {
    key: "kickback",
    title: "Glute kickback",
    muscles: ["Glutes", "Hamstrings"],
    cues: ["Hands under shoulders, knees under hips", "Push the heel back and up", "Squeeze the glute, don't arch the lower back", "Return with control"],
    mistake: "Arching the lower back instead of extending from the hip.",
    a: { pelvis: [120, 130], shoulder: [72, 124], hand: [-2, 46], foot: [156, 172], footFar: [156, 172] },
    b: { pelvis: [120, 128], shoulder: [72, 124], hand: [-2, 46], foot: [180, 104], footFar: [156, 172] },
    gear: ["mat"],
    highlight: ["hip"],
  },
  crunch: {
    key: "crunch",
    title: "Crunch",
    muscles: ["Abs"],
    cues: ["Feet flat, knees bent", "Hands lightly behind the head, don't pull the neck", "Curl the ribs towards the hips", "Exhale as you lift, lower slowly"],
    mistake: "Yanking on the neck instead of curling with the abs.",
    a: { pelvis: [112, 172], shoulder: [66, 172], hand: [-4, -16], foot: [148, 172] },
    b: { pelvis: [112, 172], shoulder: [80, 146], hand: [-4, -16], foot: [148, 172] },
    gear: ["mat"],
    highlight: ["torso"],
  },
  twist: {
    key: "twist",
    title: "Russian twist",
    muscles: ["Obliques", "Abs"],
    cues: ["Lean back to about 45°, chest up", "Rotate from the ribs, not just the arms", "Touch beside each hip", "Feet down to make it easier"],
    mistake: "Rounding the back and only moving the hands.",
    a: { pelvis: [96, 168], torso: -40, hand: [30, 22], handFar: [30, 22], foot: [146, 150] },
    b: { pelvis: [96, 168], torso: -34, hand: [8, 40], handFar: [8, 40], foot: [146, 150] },
    gear: ["mat"],
    highlight: ["torso"],
    tempo: 1600,
  },
  climber: {
    key: "climber",
    title: "Mountain climber",
    muscles: ["Core", "Hip flexors", "Shoulders"],
    cues: ["Hands under shoulders, body in a straight line", "Drive one knee towards the chest", "Switch quickly, hips stay low", "Breathe steadily"],
    mistake: "Hips piking up high so the core switches off.",
    a: { pelvis: [80, 147], shoulder: [124, 128], hand: [2, 50], foot: [8, 170], footFar: [92, 162] },
    b: { pelvis: [80, 147], shoulder: [124, 128], hand: [2, 50], foot: [92, 162], footFar: [8, 170] },
    gear: ["mat"],
    highlight: ["torso", "thigh"],
    tempo: 900,
  },
  jump: {
    key: "jump",
    title: "Jump",
    muscles: ["Quads", "Glutes", "Calves"],
    cues: ["Sink into a quarter-to-half squat", "Swing the arms and jump tall", "Land softly through the whole foot", "Knees track over toes on landing"],
    mistake: "Landing stiff-legged or with knees caving in.",
    a: { pelvis: [84, 132], torso: 34, hand: [-6, 40], foot: [16, 40] },
    b: { pelvis: [100, 80], torso: 0, hand: [10, -46], foot: [2, 76] },
    gear: ["none"],
    feetFromPelvis: true,
    highlight: ["thigh", "hip"],
    tempo: 1300,
  },
  swing: {
    key: "swing",
    title: "Kettlebell swing",
    muscles: ["Glutes", "Hamstrings", "Core"],
    cues: ["Hinge, don't squat: hips go back", "Snap the hips forward to float the bell", "Arms are just ropes", "Stand tall and squeeze glutes at the top"],
    mistake: "Lifting the bell with the arms or squatting it up.",
    a: { pelvis: [82, 108], torso: 66, hand: [-14, 48], foot: [100, 172] },
    b: { pelvis: [100, STAND], torso: 0, hand: [50, 4], foot: [100, 172] },
    gear: ["dumbbell"],
    highlight: ["hip", "thigh"],
    tempo: 1500,
  },
  rollout: {
    key: "rollout",
    title: "Ab rollout",
    muscles: ["Abs", "Lats"],
    cues: ["Kneel, hands under shoulders on the wheel", "Brace like a plank, ribs down", "Roll out only as far as you can keep a flat back", "Pull back with the abs"],
    mistake: "Letting the lower back sag as you roll out.",
    a: { pelvis: [92, 138], torso: 58, hand: [2, 52], foot: [56, 172] },
    b: { pelvis: [104, 150], torso: 80, hand: [40, 22], foot: [56, 172] },
    gear: ["mat"],
    highlight: ["torso"],
    tempo: 3000,
  },
  bike: {
    key: "bike",
    title: "Bike",
    muscles: ["Quads", "Heart & lungs"],
    cues: ["Seat at hip height", "Smooth, round pedal strokes", "Relaxed upper body", "Pick a pace you can hold"],
    mistake: "Bouncing in the saddle with too little resistance.",
    a: { pelvis: [90, 118], torso: 34, hand: [30, 30], foot: [122, 168], footFar: [102, 142] },
    b: { pelvis: [90, 118], torso: 34, hand: [30, 30], foot: [102, 142], footFar: [122, 168] },
    gear: ["bike"],
    highlight: ["thigh"],
    tempo: 900,
  },
  rower: {
    key: "rower",
    title: "Rowing",
    muscles: ["Legs", "Back", "Heart & lungs"],
    cues: ["Push with the legs first", "Then lean back slightly and pull to the lower ribs", "Return: arms, body, then knees", "Powerful drive, relaxed return"],
    mistake: "Pulling with the arms before the legs have pushed.",
    a: { pelvis: [114, 160], torso: 24, hand: [30, 22], foot: [156, 168] },
    b: { pelvis: [84, 160], torso: -18, hand: [12, 28], foot: [156, 168] },
    gear: ["none"],
    highlight: ["thigh", "torso"],
    tempo: 1800,
  },
  ropes: {
    key: "ropes",
    title: "Battle ropes",
    muscles: ["Shoulders", "Core", "Heart & lungs"],
    cues: ["Half squat, chest up", "Fast alternating waves", "Move from the shoulders", "Breathe, keep the waves to the anchor"],
    mistake: "Standing up straight so the legs and core stop helping.",
    a: { pelvis: [92, 124], torso: 14, hand: [40, 14], handFar: [40, 40], foot: [100, 172] },
    b: { pelvis: [92, 124], torso: 14, hand: [40, 40], handFar: [40, 14], foot: [100, 172] },
    gear: ["none"],
    highlight: ["upperArm"],
    tempo: 700,
  },
  hop: {
    key: "hop",
    title: "Jump rope",
    muscles: ["Calves", "Heart & lungs"],
    cues: ["Small, quick hops on the balls of the feet", "Wrists turn the rope, elbows close", "Stay light and relaxed", "Land softly"],
    mistake: "Jumping too high and landing heavily.",
    a: { pelvis: [100, STAND], torso: 0, hand: [16, 40], foot: [0, 74] },
    b: { pelvis: [100, STAND - 10], torso: 0, hand: [16, 40], foot: [0, 76] },
    gear: ["none"],
    feetFromPelvis: true,
    highlight: ["shin"],
    tempo: 600,
  },
};

/** Match a plan exercise name to an animation. Order matters: specific words first. */
const RULES: [RegExp, keyof typeof MOVES][] = [
  // conditioning & machines first (their names contain words used below)
  [/rowing machine|rower|stationary.*row/i, "rower"],
  [/treadmill|elliptical|stair climber|stairmaster|incline walk/i, "cardio"],
  [/bike|cycling|cycl/i, "bike"],
  [/jump rope|skipping|rope jumping/i, "hop"],
  [/battle rope|battling rope/i, "ropes"],
  [/box jump|jump squat|star jump|burpee|plyo(?!.*push)|pogo/i, "jump"],
  [/kettlebell swing|swing|pull-through|pull through/i, "swing"],
  [/mountain climber/i, "climber"],
  [/ab rollout|rollout|ab wheel/i, "rollout"],
  [/russian twist|twist/i, "twist"],
  [/crunch|sit-up|situp|flutter/i, "crunch"],
  [/leg curl|hamstring curl/i, "legcurl"],
  [/leg extension/i, "legext"],
  [/abduction|adduction|side-lying|clam/i, "sidelying"],
  [/glute kick/i, "kickback"],
  [/step-up|step up/i, "stepup"],
  [/calf/i, "calf"],
  [/lying leg raise/i, "crunch"],
  [/rear delt|reverse fl(y|ies)|face pull/i, "reardelt"],
  [/lateral raise|front raise|side raise|y-raise/i, "raise"],
  [/upright row/i, "uprightrow"],
  [/shrug/i, "shrug"],
  [/fly|flye|crossover|pec deck/i, "fly"],
  // original rules
  [/leg press|hack squat/i, "goblet"],
  [/knee raise|leg raise|hanging|captain/i, "kneeraise"],
  [/plank|side plank|hollow|side bridge/i, "plank"],
  [/dead bug|pallof|core|ab /i, "deadbug"],
  [/calf|tempo calf/i, "calf"],
  [/curl(?!.*leg)|hammer/i, "curl"],
  [/tricep|skull|pushdown|dip|overhead triceps|triceps extension/i, "triceps"],
  [/hip thrust|glute bridge|bridge/i, "bridge"],
  [/romanian|rdl|deadlift|good morning|good-morning|hinge|back extension|hyperextension|rack pull/i, "hinge"],
  [/step-up|step up/i, "stepup"],
  [/lunge|split squat|bulgarian|cossack/i, "lunge"],
  [/goblet|front squat/i, "goblet"],
  [/squat|leg press|hack|thruster/i, "squat"],
  [/pull-up|pullup|chin-up/i, "pullup"],
  [/pulldown|pullover|lat pull|towel lat|straight-arm/i, "pulldown"],
  [/row|pull-apart|y-t-w|superman|renegade/i, "row"],
  [/push-up|pushup|shoulder tap|inchworm/i, "pushup"],
  [/bench|chest press|floor press|incline|decline/i, "bench"],
  [/press|arnold|pike|handstand/i, "press"],
  [/walk|run|cardio|jog|zone|interval|march|treadmill|elliptical|stair|climber/i, "cardio"],
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
