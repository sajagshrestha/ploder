import type { equipmentEnum, muscleGroupEnum } from "../schema";

type Equipment = (typeof equipmentEnum.enumValues)[number];
type MuscleGroup = (typeof muscleGroupEnum.enumValues)[number];

export type SeedExercise = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCompound: boolean;
};

export const seedExercises: SeedExercise[] = [
  // Chest
  {
    name: "Barbell Bench Press",
    muscleGroup: "chest",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Incline Barbell Bench Press",
    muscleGroup: "chest",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Dumbbell Bench Press",
    muscleGroup: "chest",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Incline Dumbbell Press",
    muscleGroup: "chest",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Dumbbell Fly",
    muscleGroup: "chest",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Cable Fly",
    muscleGroup: "chest",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Chest Press Machine",
    muscleGroup: "chest",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Pec Deck",
    muscleGroup: "chest",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Push-Up",
    muscleGroup: "chest",
    equipment: "bodyweight",
    isCompound: true,
  },
  {
    name: "Dip",
    muscleGroup: "chest",
    equipment: "bodyweight",
    isCompound: true,
  },

  // Back
  {
    name: "Deadlift",
    muscleGroup: "back",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Barbell Row",
    muscleGroup: "back",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Pendlay Row",
    muscleGroup: "back",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "T-Bar Row",
    muscleGroup: "back",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Pull-Up",
    muscleGroup: "back",
    equipment: "bodyweight",
    isCompound: true,
  },
  {
    name: "Chin-Up",
    muscleGroup: "back",
    equipment: "bodyweight",
    isCompound: true,
  },
  {
    name: "Lat Pulldown",
    muscleGroup: "back",
    equipment: "cable",
    isCompound: true,
  },
  {
    name: "Seated Cable Row",
    muscleGroup: "back",
    equipment: "cable",
    isCompound: true,
  },
  {
    name: "Single-Arm Dumbbell Row",
    muscleGroup: "back",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Chest-Supported Row",
    muscleGroup: "back",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Straight-Arm Pulldown",
    muscleGroup: "back",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Face Pull",
    muscleGroup: "back",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Shrug",
    muscleGroup: "back",
    equipment: "dumbbell",
    isCompound: false,
  },

  // Shoulders
  {
    name: "Overhead Press",
    muscleGroup: "shoulders",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Seated Dumbbell Shoulder Press",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Arnold Press",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Machine Shoulder Press",
    muscleGroup: "shoulders",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Lateral Raise",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Cable Lateral Raise",
    muscleGroup: "shoulders",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Front Raise",
    muscleGroup: "shoulders",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Reverse Pec Deck",
    muscleGroup: "shoulders",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Pike Push-Up",
    muscleGroup: "shoulders",
    equipment: "bodyweight",
    isCompound: true,
  },

  // Arms
  {
    name: "Barbell Curl",
    muscleGroup: "arms",
    equipment: "barbell",
    isCompound: false,
  },
  {
    name: "Dumbbell Curl",
    muscleGroup: "arms",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Hammer Curl",
    muscleGroup: "arms",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Incline Dumbbell Curl",
    muscleGroup: "arms",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Preacher Curl",
    muscleGroup: "arms",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Cable Curl",
    muscleGroup: "arms",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Close-Grip Bench Press",
    muscleGroup: "arms",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Triceps Pushdown",
    muscleGroup: "arms",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Overhead Cable Extension",
    muscleGroup: "arms",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Skull Crusher",
    muscleGroup: "arms",
    equipment: "barbell",
    isCompound: false,
  },
  {
    name: "Overhead Dumbbell Extension",
    muscleGroup: "arms",
    equipment: "dumbbell",
    isCompound: false,
  },
  {
    name: "Bench Dip",
    muscleGroup: "arms",
    equipment: "bodyweight",
    isCompound: false,
  },

  // Legs
  {
    name: "Back Squat",
    muscleGroup: "legs",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Front Squat",
    muscleGroup: "legs",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Hack Squat",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Leg Press",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: true,
  },
  {
    name: "Romanian Deadlift",
    muscleGroup: "legs",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Dumbbell Romanian Deadlift",
    muscleGroup: "legs",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Leg Extension",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Seated Leg Curl",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Lying Leg Curl",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Walking Lunge",
    muscleGroup: "legs",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Bulgarian Split Squat",
    muscleGroup: "legs",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Goblet Squat",
    muscleGroup: "legs",
    equipment: "dumbbell",
    isCompound: true,
  },
  {
    name: "Standing Calf Raise",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Seated Calf Raise",
    muscleGroup: "legs",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Bodyweight Squat",
    muscleGroup: "legs",
    equipment: "bodyweight",
    isCompound: true,
  },

  // Glutes
  {
    name: "Barbell Hip Thrust",
    muscleGroup: "glutes",
    equipment: "barbell",
    isCompound: true,
  },
  {
    name: "Glute Bridge",
    muscleGroup: "glutes",
    equipment: "bodyweight",
    isCompound: false,
  },
  {
    name: "Cable Kickback",
    muscleGroup: "glutes",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Hip Abduction Machine",
    muscleGroup: "glutes",
    equipment: "machine",
    isCompound: false,
  },
  {
    name: "Step-Up",
    muscleGroup: "glutes",
    equipment: "dumbbell",
    isCompound: true,
  },

  // Core
  {
    name: "Plank",
    muscleGroup: "core",
    equipment: "bodyweight",
    isCompound: false,
  },
  {
    name: "Hanging Leg Raise",
    muscleGroup: "core",
    equipment: "bodyweight",
    isCompound: false,
  },
  {
    name: "Cable Crunch",
    muscleGroup: "core",
    equipment: "cable",
    isCompound: false,
  },
  {
    name: "Ab Wheel Rollout",
    muscleGroup: "core",
    equipment: "bodyweight",
    isCompound: false,
  },
  {
    name: "Russian Twist",
    muscleGroup: "core",
    equipment: "bodyweight",
    isCompound: false,
  },
  {
    name: "Cable Woodchopper",
    muscleGroup: "core",
    equipment: "cable",
    isCompound: false,
  },
];
