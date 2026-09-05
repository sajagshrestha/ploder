// Common-name aliases for the hasaneyldrm/exercises-dataset catalog, whose
// machine-style names (e.g. "Lever Seated Fly") hide well-known movements
// (e.g. pec deck / chest fly). Keys are lowercase seeded names.

const COMMON_ALIASES: Record<string, string> = {
  // Chest
  "lever seated fly":
    "Pec Deck, Chest Fly, Pec Fly, Butterfly, Machine Fly, Seated Fly",
  "barbell bench press": "Bench Press, Flat Bench Press",
  "barbell incline bench press": "Incline Bench Press, Incline Barbell Press",
  "barbell decline bench press": "Decline Bench Press",
  "dumbbell bench press": "Bench Press, Flat Dumbbell Press",
  "dumbbell incline bench press": "Incline Bench Press, Incline Dumbbell Press",
  "dumbbell fly": "Dumbbell Flyes, Chest Fly",
  "cable middle fly": "Cable Fly, Chest Fly, Standing Cable Fly",
  "cable standing fly": "Cable Fly, Chest Fly",
  "cable decline fly": "Cable Fly, Chest Fly, Decline Cable Fly",
  "cable incline fly": "Cable Fly, Chest Fly, Incline Cable Fly",
  "smith bench press": "Bench Press, Smith Machine Bench Press",
  "lever chest press": "Chest Press Machine, Machine Chest Press",
  "chest dip": "Dip, Chest Dips",
  "dumbbell pullover": "Pullover, Dumbbell Pullovers",
  // Back
  "barbell deadlift": "Deadlift, Conventional Deadlift",
  "trap bar deadlift": "Deadlift, Trap Bar Deadlift, Hex Bar Deadlift",
  "barbell sumo deadlift": "Sumo Deadlift, Sumo Deadlifts",
  "barbell romanian deadlift": "Romanian Deadlift, RDL",
  "dumbbell romanian deadlift": "Romanian Deadlift, RDL, Dumbbell RDL",
  "barbell bent over row": "Barbell Row, Bent Over Row, Bent-Over Barbell Row",
  "inverted row": "Inverted Rows, Australian Pull-up, Bodyweight Row",
  "pull-up": "Pullup, Pull Up, Pullups",
  "weighted pull-up": "Pull-up, Weighted Pullup",
  "wide grip pull-up": "Pull-up, Wide-Grip Pullup",
  "reverse grip pull-up": "Pull-up, Reverse-Grip Pullup, Underhand Pull-up",
  "chin-up": "Chinup, Chin Up",
  "scapular pull-up": "Scapular Pullup, Scap Pull-up",
  "cable lat pulldown full range of motion": "Lat Pulldown",
  "reverse grip machine lat pulldown":
    "Lat Pulldown, Reverse-Grip Lat Pulldown",
  "cable seated row": "Seated Cable Row, Seated Row",
  "lever seated row": "Seated Row, Machine Row, Chest-Supported Row",
  "cable seated rear lateral raise": "Face Pull, Rear Delt Raise",
  "barbell shrug": "Shrug, Barbell Shrugs, Traps",
  "dumbbell shrug": "Shrug, Dumbbell Shrugs",
  // Shoulders
  "barbell seated overhead press":
    "Overhead Press, OHP, Shoulder Press, Military Press, Overhead Barbell Press",
  "dumbbell seated shoulder press":
    "Shoulder Press, Dumbbell Shoulder Press, Overhead Press, Seated Dumbbell Press",
  "dumbbell standing overhead press":
    "Overhead Press, Standing Dumbbell Press, OHP",
  "smith seated shoulder press": "Shoulder Press, Smith Machine Shoulder Press",
  "lever shoulder press": "Machine Shoulder Press, Shoulder Press",
  "dumbbell lateral raise": "Lateral Raise, Side Raise, Side Lateral Raise",
  "cable lateral raise": "Lateral Raise, Cable Side Raise",
  "dumbbell front raise": "Front Raise, Front Delt Raise",
  "barbell front raise": "Front Raise",
  "dumbbell rear lateral raise":
    "Rear Delt Fly, Reverse Fly, Rear Lateral Raise",
  // Arms
  "barbell curl": "Barbell Biceps Curl, Biceps Curl, Barbell Curls",
  "smith machine bicep curl": "Barbell Curl, Biceps Curl, Smith Machine Curl",
  "dumbbell biceps curl": "Dumbbell Curl, Biceps Curl, Dumbbell Curls",
  "dumbbell seated biceps curl (on stability ball)":
    "Dumbbell Curl, Seated Biceps Curl",
  "dumbbell hammer curl": "Hammer Curl, Hammer Curls",
  "cable hammer curl (with rope)": "Hammer Curl, Rope Hammer Curl",
  "dumbbell incline biceps curl":
    "Incline Dumbbell Curl, Incline Curl, Incline Biceps Curl",
  "cable curl": "Cable Biceps Curl, Cable Curls",
  "barbell close-grip bench press": "Close-Grip Bench Press, Close Grip Bench",
  "cable triceps pushdown (v-bar)":
    "Triceps Pushdown, Pushdown, Triceps Pressdown, Pressdown",
  "cable pushdown": "Triceps Pushdown, Pushdown",
  "cable overhead triceps extension (rope attachment)":
    "Overhead Cable Extension, Overhead Triceps Extension, Rope Triceps Extension",
  "barbell lying triceps extension skull crusher":
    "Skull Crusher, Skullcrusher, Lying Triceps Extension",
  "triceps dip": "Dip, Triceps Dips, Bench Dip",
  "bench dip (knees bent)": "Bench Dip, Triceps Dip",
  "weighted bench dip": "Bench Dip, Weighted Dip",
  // Legs
  "barbell full squat": "Back Squat, Squat",
  "barbell high bar squat": "Back Squat, High-Bar Squat, Squat",
  "barbell low bar squat": "Back Squat, Low-Bar Squat, Squat",
  "barbell front squat": "Front Squat",
  "barbell hack squat": "Hack Squat",
  "dumbbell goblet squat": "Goblet Squat",
  "dumbbell lunge": "Lunge, Dumbbell Lunges, Walking Lunge",
  "sled 45° leg press (side pov)": "Leg Press",
  "smith leg press": "Leg Press, Smith Machine Leg Press",
  "lever leg extension": "Leg Extension, Leg Extensions",
  "lever seated leg curl": "Seated Leg Curl, Leg Curl",
  "lever lying leg curl": "Lying Leg Curl, Leg Curl, Hamstring Curl",
  "standing single leg curl": "Standing Leg Curl, Leg Curl",
  "lever standing calf raise": "Standing Calf Raise, Calf Raise",
  "lever seated calf raise": "Seated Calf Raise, Calf Raise",
  "bodyweight standing calf raise": "Standing Calf Raise, Calf Raise",
  "donkey calf raise": "Donkey Calf Raises, Calf Raise",
  "dumbbell single leg split squat":
    "Bulgarian Split Squat, Split Squat, Bulgarian Squat",
  "split squats": "Split Squat, Bulgarian Split Squat",
  // Glutes
  "barbell glute bridge": "Glute Bridge, Hip Thrust, Barbell Hip Thrust",
  // Core
  "front plank with twist": "Plank",
  "hanging leg raise": "Hanging Leg Raises, Hanging Knee Raise",
  "cable kneeling crunch": "Cable Crunch",
  "crunch floor": "Crunch, Crunches, Ab Crunch",
  "russian twist": "Russian Twists",
};

const EQUIPMENT_PREFIXES = [
  "ez-bar ",
  "ez barbell ",
  "olympic barbell ",
  "resistance band ",
  "stability ball ",
  "upper body ergometer ",
  "bodyweight ",
  "weighted ",
  "assisted ",
  "barbell ",
  "dumbbell ",
  "kettlebell ",
  "cable ",
  "lever ",
  "smith ",
  "sled ",
  "band ",
  "trap bar ",
];

function stripEquipment(name: string): string {
  let result = name;
  let changed = true;
  while (changed) {
    changed = false;
    for (const prefix of EQUIPMENT_PREFIXES) {
      if (result.toLowerCase().startsWith(prefix)) {
        result = result.slice(prefix.length);
        changed = true;
        break;
      }
    }
  }
  return result;
}

// Build a comma-separated alias string for a seeded (title-cased) name:
// curated common names plus equipment-stripped and suffix-stripped variants.
export function buildAlias(name: string): string | null {
  const candidates: string[] = [];
  const curated = COMMON_ALIASES[name.toLowerCase()];
  if (curated) {
    candidates.push(...curated.split(",").map((part) => part.trim()));
  }

  const stripped = stripEquipment(name).trim();
  if (stripped && stripped.toLowerCase() !== name.toLowerCase()) {
    candidates.push(stripped);
  }
  const noParens = name.replace(/\s*\([^)]*\)\s*$/, "").trim();
  if (noParens && noParens.toLowerCase() !== name.toLowerCase()) {
    candidates.push(noParens);
    const noParensStripped = stripEquipment(noParens).trim();
    if (
      noParensStripped &&
      noParensStripped.toLowerCase() !== name.toLowerCase()
    ) {
      candidates.push(noParensStripped);
    }
  }
  const noVersion = name.replace(/\s+v\.\s*\d+\s*$/i, "").trim();
  if (noVersion && noVersion.toLowerCase() !== name.toLowerCase()) {
    candidates.push(noVersion);
  }

  const seen = new Set<string>();
  const aliases = candidates.filter((candidate) => {
    const key = candidate.toLowerCase();
    if (!candidate || key === name.toLowerCase() || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return aliases.length > 0 ? aliases.join(", ") : null;
}
