"""
Builds src/data/exercises.json from yuhonas/free-exercise-db (public domain / Unlicense).
Usage: python3 scripts/build-exercise-library.py /path/to/free-exercise-db
Needs Pillow (pip install pillow).
"""
import json, sys, subprocess

SRC = sys.argv[1]
COMMIT = subprocess.check_output(["git", "-C", SRC, "rev-parse", "HEAD"]).decode().strip()

# id -> friendly name (None = keep original). Ordered roughly by popularity within groups.
PICK = {
  # chest
  "Barbell_Bench_Press_-_Medium_Grip": "Bench Press (Barbell)",
  "Dumbbell_Bench_Press": "Bench Press (Dumbbell)",
  "Barbell_Incline_Bench_Press_-_Medium_Grip": "Incline Bench Press (Barbell)",
  "Incline_Dumbbell_Press": "Incline Bench Press (Dumbbell)",
  "Decline_Barbell_Bench_Press": "Decline Bench Press (Barbell)",
  "Smith_Machine_Bench_Press": "Bench Press (Smith Machine)",
  "Machine_Bench_Press": "Chest Press (Machine)",
  "Leverage_Incline_Chest_Press": "Incline Chest Press (Machine)",
  "Cable_Chest_Press": "Chest Press (Cable)",
  "Dumbbell_Flyes": "Chest Fly (Dumbbell)",
  "Incline_Dumbbell_Flyes": "Incline Chest Fly (Dumbbell)",
  "Cable_Crossover": "Cable Crossover",
  "Low_Cable_Crossover": "Low-to-High Cable Fly",
  "Butterfly": "Pec Deck (Machine)",
  "Dumbbell_Floor_Press": "Floor Press (Dumbbell)",
  "Dips_-_Chest_Version": "Chest Dip",
  "Pushups": "Push-Up",
  "Push-Up_Wide": "Wide Push-Up",
  "Incline_Push-Up": "Incline Push-Up",
  "Decline_Push-Up": "Decline Push-Up",
  "Push-Ups_-_Close_Triceps_Position": "Close-Grip Push-Up",
  "Plyo_Push-up": "Plyo Push-Up",
  # back
  "Barbell_Deadlift": "Deadlift (Barbell)",
  "Trap_Bar_Deadlift": "Trap Bar Deadlift",
  "Sumo_Deadlift": "Sumo Deadlift",
  "Rack_Pulls": "Rack Pull",
  "Bent_Over_Barbell_Row": "Bent-Over Row (Barbell)",
  "Bent_Over_Two-Dumbbell_Row": "Bent-Over Row (Dumbbell)",
  "One-Arm_Dumbbell_Row": "One-Arm Row (Dumbbell)",
  "Dumbbell_Incline_Row": "Chest-Supported Row (Dumbbell)",
  "T-Bar_Row_with_Handle": "T-Bar Row",
  "Seated_Cable_Rows": "Seated Row (Cable)",
  "Leverage_Iso_Row": "Row (Machine)",
  "Wide-Grip_Lat_Pulldown": "Lat Pulldown (Wide Grip)",
  "Close-Grip_Front_Lat_Pulldown": "Lat Pulldown (Close Grip)",
  "V-Bar_Pulldown": "Lat Pulldown (V-Bar)",
  "Underhand_Cable_Pulldowns": "Lat Pulldown (Underhand)",
  "Straight-Arm_Pulldown": "Straight-Arm Pulldown",
  "Pullups": "Pull-Up",
  "Chin-Up": "Chin-Up",
  "Band_Assisted_Pull-Up": "Assisted Pull-Up (Band)",
  "Inverted_Row": "Inverted Row",
  "Face_Pull": "Face Pull",
  "Band_Pull_Apart": "Band Pull-Apart",
  "Straight-Arm_Dumbbell_Pullover": "Pullover (Dumbbell)",
  "Hyperextensions_Back_Extensions": "Back Extension",
  "Barbell_Shrug": "Shrug (Barbell)",
  "Dumbbell_Shrug": "Shrug (Dumbbell)",
  "Alternating_Renegade_Row": "Renegade Row",
  # shoulders
  "Standing_Military_Press": "Overhead Press (Barbell)",
  "Seated_Barbell_Military_Press": "Seated Overhead Press (Barbell)",
  "Dumbbell_Shoulder_Press": "Shoulder Press (Dumbbell)",
  "Seated_Dumbbell_Press": "Seated Shoulder Press (Dumbbell)",
  "Arnold_Dumbbell_Press": "Arnold Press",
  "Machine_Shoulder_Military_Press": "Shoulder Press (Machine)",
  "Push_Press": "Push Press",
  "Side_Lateral_Raise": "Lateral Raise (Dumbbell)",
  "Cable_Seated_Lateral_Raise": "Lateral Raise (Cable)",
  "Front_Dumbbell_Raise": "Front Raise (Dumbbell)",
  "Reverse_Flyes": "Rear Delt Fly (Dumbbell)",
  "Reverse_Machine_Flyes": "Rear Delt Fly (Machine)",
  "Cable_Rear_Delt_Fly": "Rear Delt Fly (Cable)",
  "Upright_Barbell_Row": "Upright Row (Barbell)",
  "Handstand_Push-Ups": "Handstand Push-Up",
  # biceps
  "Barbell_Curl": "Bicep Curl (Barbell)",
  "Dumbbell_Bicep_Curl": "Bicep Curl (Dumbbell)",
  "Dumbbell_Alternate_Bicep_Curl": "Alternating Curl (Dumbbell)",
  "EZ-Bar_Curl": "EZ-Bar Curl",
  "Hammer_Curls": "Hammer Curl",
  "Cable_Hammer_Curls_-_Rope_Attachment": "Hammer Curl (Cable Rope)",
  "Preacher_Curl": "Preacher Curl (Barbell)",
  "Machine_Preacher_Curls": "Preacher Curl (Machine)",
  "Incline_Dumbbell_Curl": "Incline Curl (Dumbbell)",
  "Concentration_Curls": "Concentration Curl",
  "Standing_Biceps_Cable_Curl": "Bicep Curl (Cable)",
  "Spider_Curl": "Spider Curl",
  "Zottman_Curl": "Zottman Curl",
  "Reverse_Barbell_Curl": "Reverse Curl (Barbell)",
  # triceps
  "Triceps_Pushdown": "Triceps Pushdown (Bar)",
  "Triceps_Pushdown_-_Rope_Attachment": "Triceps Pushdown (Rope)",
  "Cable_Rope_Overhead_Triceps_Extension": "Overhead Triceps Extension (Cable)",
  "Standing_Dumbbell_Triceps_Extension": "Overhead Triceps Extension (Dumbbell)",
  "EZ-Bar_Skullcrusher": "Skull Crusher (EZ-Bar)",
  "Lying_Dumbbell_Tricep_Extension": "Skull Crusher (Dumbbell)",
  "Close-Grip_Barbell_Bench_Press": "Close-Grip Bench Press",
  "Dips_-_Triceps_Version": "Triceps Dip",
  "Bench_Dips": "Bench Dip",
  "Tricep_Dumbbell_Kickback": "Triceps Kickback",
  "Machine_Triceps_Extension": "Triceps Extension (Machine)",
  # legs
  "Barbell_Squat": "Squat (Barbell)",
  "Barbell_Full_Squat": "Full Squat (Barbell)",
  "Front_Barbell_Squat": "Front Squat (Barbell)",
  "Goblet_Squat": "Goblet Squat",
  "Dumbbell_Squat": "Squat (Dumbbell)",
  "Bodyweight_Squat": "Bodyweight Squat",
  "Box_Squat": "Box Squat",
  "Smith_Machine_Squat": "Squat (Smith Machine)",
  "Hack_Squat": "Hack Squat (Machine)",
  "Leg_Press": "Leg Press",
  "Leg_Extensions": "Leg Extension",
  "Lying_Leg_Curls": "Lying Leg Curl",
  "Seated_Leg_Curl": "Seated Leg Curl",
  "Romanian_Deadlift": "Romanian Deadlift (Barbell)",
  "Stiff-Legged_Dumbbell_Deadlift": "Romanian Deadlift (Dumbbell)",
  "Kettlebell_One-Legged_Deadlift": "Single-Leg Deadlift",
  "Good_Morning": "Good Morning",
  "Barbell_Lunge": "Lunge (Barbell)",
  "Dumbbell_Lunges": "Lunge (Dumbbell)",
  "Dumbbell_Rear_Lunge": "Reverse Lunge (Dumbbell)",
  "Bodyweight_Walking_Lunge": "Walking Lunge",
  "Barbell_Walking_Lunge": "Walking Lunge (Barbell)",
  "Split_Squat_with_Dumbbells": "Bulgarian Split Squat (Dumbbell)",
  "Smith_Single-Leg_Split_Squat": "Bulgarian Split Squat (Smith)",
  "Dumbbell_Step_Ups": "Step-Up (Dumbbell)",
  "Step-up_with_Knee_Raise": "Step-Up with Knee Raise",
  "Freehand_Jump_Squat": "Jump Squat",
  "Thigh_Abductor": "Hip Abduction (Machine)",
  "Thigh_Adductor": "Hip Adduction (Machine)",
  "Plie_Dumbbell_Squat": "Sumo Squat (Dumbbell)",
  # glutes
  "Barbell_Hip_Thrust": "Hip Thrust (Barbell)",
  "Barbell_Glute_Bridge": "Glute Bridge (Barbell)",
  "Butt_Lift_Bridge": "Glute Bridge",
  "Single_Leg_Glute_Bridge": "Single-Leg Glute Bridge",
  "Glute_Kickback": "Glute Kickback",
  "One-Legged_Cable_Kickback": "Glute Kickback (Cable)",
  "Pull_Through": "Cable Pull-Through",
  "One-Arm_Kettlebell_Swings": "Kettlebell Swing",
  # calves
  "Standing_Calf_Raises": "Standing Calf Raise (Machine)",
  "Seated_Calf_Raise": "Seated Calf Raise",
  "Standing_Dumbbell_Calf_Raise": "Calf Raise (Dumbbell)",
  "Calf_Press_On_The_Leg_Press_Machine": "Leg Press Calf Raise",
  # core
  "Plank": "Plank",
  "Side_Bridge": "Side Plank",
  "Dead_Bug": "Dead Bug",
  "Crunches": "Crunch",
  "Cable_Crunch": "Cable Crunch",
  "Hanging_Leg_Raise": "Hanging Leg Raise",
  "Knee_Hip_Raise_On_Parallel_Bars": "Captain's Chair Knee Raise",
  "Flat_Bench_Lying_Leg_Raise": "Lying Leg Raise",
  "Reverse_Crunch": "Reverse Crunch",
  "Russian_Twist": "Russian Twist",
  "Pallof_Press": "Pallof Press",
  "Barbell_Ab_Rollout_-_On_Knees": "Ab Rollout",
  "Mountain_Climbers": "Mountain Climber",
  "Sit-Up": "Sit-Up",
  "Elbow_to_Knee": "Cross-Body Crunch",
  "Flutter_Kicks": "Flutter Kicks",
  "Oblique_Crunches_-_On_The_Floor": "Oblique Crunch",
  "Ab_Crunch_Machine": "Ab Crunch (Machine)",
  # cardio / conditioning
  "Running_Treadmill": "Treadmill Run",
  "Walking_Treadmill": "Incline Walk (Treadmill)",
  "Bicycling_Stationary": "Stationary Bike",
  "Rowing_Stationary": "Rowing Machine",
  "Elliptical_Trainer": "Elliptical",
  "Stairmaster": "Stair Climber",
  "Rope_Jumping": "Jump Rope",
  "Battling_Ropes": "Battle Ropes",
  "Front_Box_Jump": "Box Jump",
  "Star_Jump": "Star Jump",
  "Kettlebell_Thruster": "Thruster (Kettlebell)",
  "Inchworm": "Inchworm",
}

MUSCLE = {"abdominals": "Abs", "middle back": "Upper Back", "lower back": "Lower Back", "lats": "Lats", "quadriceps": "Quads"}
EQUIP = {"body only": "Bodyweight", "e-z curl bar": "Barbell", "kettlebells": "Kettlebell", "bands": "Band", "exercise ball": "Other", "medicine ball": "Other", "other": "Other", None: "Bodyweight"}
GROUP = {
  "chest": "Chest", "lats": "Back", "middle back": "Back", "lower back": "Back", "traps": "Back",
  "shoulders": "Shoulders", "biceps": "Arms", "triceps": "Arms", "forearms": "Arms",
  "quadriceps": "Legs", "hamstrings": "Legs", "adductors": "Legs", "abductors": "Glutes", "glutes": "Glutes", "calves": "Legs",
  "abdominals": "Core",
}

def title(m): return MUSCLE.get(m, m.title())

data = {x["id"]: x for x in json.load(open(f"{SRC}/dist/exercises.json"))}
out = []
for i, (eid, nice) in enumerate(PICK.items()):
  x = data[eid]  # KeyError = typo in PICK
  equip = EQUIP.get(x["equipment"], (x["equipment"] or "").title())
  if eid in ("Walking_Treadmill", "Running_Treadmill", "Bicycling_Stationary", "Rowing_Stationary", "Elliptical_Trainer", "Stairmaster"): equip = "Machine"
  group = "Cardio" if x["category"] in ("cardio",) or eid in ("Rope_Jumping", "Battling_Ropes", "Front_Box_Jump", "Star_Jump", "Kettlebell_Thruster", "Inchworm") else GROUP.get(x["primaryMuscles"][0], "Other")
  home = equip in ("Bodyweight", "Dumbbell", "Kettlebell", "Band")
  out.append({
    "id": eid,
    "name": nice or x["name"],
    "group": group,
    "equipment": equip,
    "where": "both" if home else "gym",
    "level": x["level"],
    "primary": [title(m) for m in x["primaryMuscles"]],
    "secondary": [title(m) for m in x["secondaryMuscles"]],
    "steps": [s.strip() for s in x["instructions"] if s.strip()],
    "rank": i,
  })

# Photos: resized to small WebP and served from /public/ex (≈5 MB total).
import os
from PIL import Image
os.makedirs("public/ex", exist_ok=True)
for x in out:
  for f in (0, 1):
    im = Image.open(f"{SRC}/exercises/{x['id']}/{f}.jpg").convert("RGB")
    im.thumbnail((560, 560))
    im.save(f"public/ex/{x['id']}_{f}.webp", "WEBP", quality=68, method=6)

json.dump({"source": "/ex/", "license": f"Public domain (Unlicense), yuhonas/free-exercise-db@{COMMIT[:7]}", "exercises": out}, open("src/data/exercises.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "exercises,", COMMIT[:7])
