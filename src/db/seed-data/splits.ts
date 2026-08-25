export type SeedSplitDay = {
  name: string;
  exercises: {
    exerciseName: string;
    targetSets: number;
    targetRepMin: number;
    targetRepMax: number;
  }[];
};

export type SeedSplit = {
  name: string;
  description: string;
  days: SeedSplitDay[];
};

export const seedSplits: SeedSplit[] = [
  {
    name: "Push Pull Legs (6-Day)",
    description:
      "High-frequency PPL. Each muscle group is hit twice per week with rotating A/B sessions for more volume.",
    days: [
      {
        name: "Push A",
        exercises: [
          {
            exerciseName: "Barbell Bench Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Seated Dumbbell Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Incline Dumbbell Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Fly",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Triceps Pushdown",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Overhead Cable Extension",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Pull A",
        exercises: [
          {
            exerciseName: "Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Lat Pulldown",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Seated Cable Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Face Pull",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Barbell Curl",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Hammer Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Legs A",
        exercises: [
          {
            exerciseName: "Back Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Leg Press",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Standing Calf Raise",
            targetSets: 4,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Push B",
        exercises: [
          {
            exerciseName: "Overhead Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Incline Barbell Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Fly",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lateral Raise",
            targetSets: 4,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Close-Grip Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Skull Crusher",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Pull B",
        exercises: [
          {
            exerciseName: "Pull-Up",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Row",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 10,
          },
          {
            exerciseName: "Chest-Supported Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Straight-Arm Pulldown",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Incline Dumbbell Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Cable Curl",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Legs B",
        exercises: [
          {
            exerciseName: "Front Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Bulgarian Split Squat",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lying Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Leg Extension",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Seated Calf Raise",
            targetSets: 4,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Hanging Leg Raise",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
    ],
  },
  {
    name: "Push Pull Legs (3-Day)",
    description:
      "Time-friendly PPL run three days a week (e.g. Mon/Wed/Fri). One session per pattern, full recovery between.",
    days: [
      {
        name: "Push",
        exercises: [
          {
            exerciseName: "Barbell Bench Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Seated Dumbbell Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Incline Dumbbell Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lateral Raise",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Triceps Pushdown",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Pull",
        exercises: [
          {
            exerciseName: "Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Pull-Up",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Face Pull",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Dumbbell Curl",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
        ],
      },
      {
        name: "Legs",
        exercises: [
          {
            exerciseName: "Back Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Leg Press",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Standing Calf Raise",
            targetSets: 4,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Plank",
            targetSets: 3,
            targetRepMin: 30,
            targetRepMax: 60,
          },
        ],
      },
    ],
  },
  {
    name: "Upper Lower (4-Day)",
    description:
      "Classic four-day upper/lower split. Balanced frequency with A/B sessions to vary intensity and exercise selection.",
    days: [
      {
        name: "Upper A",
        exercises: [
          {
            exerciseName: "Barbell Bench Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Row",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Seated Dumbbell Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lat Pulldown",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Curl",
            targetSets: 2,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Triceps Pushdown",
            targetSets: 2,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Lower A",
        exercises: [
          {
            exerciseName: "Back Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Leg Press",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Standing Calf Raise",
            targetSets: 4,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Upper B",
        exercises: [
          {
            exerciseName: "Overhead Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Pull-Up",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Incline Dumbbell Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Seated Cable Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lateral Raise",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Hammer Curl",
            targetSets: 2,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Lower B",
        exercises: [
          {
            exerciseName: "Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Bulgarian Split Squat",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lying Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Leg Extension",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Seated Calf Raise",
            targetSets: 4,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Hanging Leg Raise",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
    ],
  },
  {
    name: "Full Body (3-Day)",
    description:
      "Three full-body sessions per week. Best for beginners or busy schedules — every major pattern trained each session.",
    days: [
      {
        name: "Full Body A",
        exercises: [
          {
            exerciseName: "Back Squat",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Bench Press",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Row",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Lateral Raise",
            targetSets: 2,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Plank",
            targetSets: 3,
            targetRepMin: 30,
            targetRepMax: 60,
          },
        ],
      },
      {
        name: "Full Body B",
        exercises: [
          {
            exerciseName: "Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Overhead Press",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Lat Pulldown",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Leg Extension",
            targetSets: 2,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Dumbbell Curl",
            targetSets: 2,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Full Body C",
        exercises: [
          {
            exerciseName: "Leg Press",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Incline Dumbbell Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Seated Cable Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Triceps Pushdown",
            targetSets: 2,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Hanging Leg Raise",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
    ],
  },
];
