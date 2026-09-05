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
            exerciseName: "Dumbbell Seated Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Incline Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Middle Fly",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Cable Triceps Pushdown (v-bar)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Cable Overhead Triceps Extension (rope Attachment)",
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
            exerciseName: "Barbell Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Cable Lat Pulldown Full Range Of Motion",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Seated Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Seated Rear Lateral Raise",
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
            exerciseName: "Dumbbell Hammer Curl",
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
            exerciseName: "Barbell Full Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Sled 45° Leg Press (side Pov)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Standing Calf Raise",
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
            exerciseName: "Barbell Seated Overhead Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Incline Bench Press",
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
            exerciseName: "Dumbbell Lateral Raise",
            targetSets: 4,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Barbell Close-grip Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Lying Triceps Extension Skull Crusher",
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
            exerciseName: "Pull-up",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Bent Over Row",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 10,
          },
          {
            exerciseName: "Lever Seated Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Straight Arm Pulldown",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Dumbbell Incline Biceps Curl",
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
            exerciseName: "Barbell Front Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Dumbbell Single Leg Split Squat",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lever Lying Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Leg Extension",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Calf Raise",
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
            exerciseName: "Dumbbell Seated Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Incline Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Lateral Raise",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Cable Triceps Pushdown (v-bar)",
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
            exerciseName: "Barbell Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Pull-up",
            targetSets: 3,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Bent Over Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Seated Rear Lateral Raise",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Dumbbell Biceps Curl",
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
            exerciseName: "Barbell Full Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Sled 45° Leg Press (side Pov)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Standing Calf Raise",
            targetSets: 4,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Front Plank With Twist",
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
            exerciseName: "Barbell Bent Over Row",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Dumbbell Seated Shoulder Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Lat Pulldown Full Range Of Motion",
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
            exerciseName: "Cable Triceps Pushdown (v-bar)",
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
            exerciseName: "Barbell Full Squat",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Sled 45° Leg Press (side Pov)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Standing Calf Raise",
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
            exerciseName: "Barbell Seated Overhead Press",
            targetSets: 4,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Pull-up",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Incline Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Seated Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Dumbbell Lateral Raise",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Dumbbell Hammer Curl",
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
            exerciseName: "Barbell Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Dumbbell Single Leg Split Squat",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lever Lying Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Leg Extension",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Calf Raise",
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
            exerciseName: "Barbell Full Squat",
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
            exerciseName: "Barbell Bent Over Row",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Dumbbell Lateral Raise",
            targetSets: 2,
            targetRepMin: 12,
            targetRepMax: 20,
          },
          {
            exerciseName: "Front Plank With Twist",
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
            exerciseName: "Barbell Deadlift",
            targetSets: 3,
            targetRepMin: 3,
            targetRepMax: 6,
          },
          {
            exerciseName: "Barbell Seated Overhead Press",
            targetSets: 3,
            targetRepMin: 5,
            targetRepMax: 8,
          },
          {
            exerciseName: "Cable Lat Pulldown Full Range Of Motion",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Lever Leg Extension",
            targetSets: 2,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Dumbbell Biceps Curl",
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
            exerciseName: "Sled 45° Leg Press (side Pov)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Dumbbell Incline Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Seated Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Cable Triceps Pushdown (v-bar)",
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
  {
    name: "Arnold Split (3-Day)",
    description:
      "Arnold Schwarzenegger's classic split: chest+back, shoulders+arms, legs. Antagonist pairing lets you superset and keep intensity high.",
    days: [
      {
        name: "Chest & Back",
        exercises: [
          {
            exerciseName: "Barbell Bench Press",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            exerciseName: "Dumbbell Incline Bench Press",
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
            exerciseName: "Pull-up",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Bent Over Row",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 10,
          },
          {
            exerciseName: "Cable Seated Row",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
        ],
      },
      {
        name: "Shoulders & Arms",
        exercises: [
          {
            exerciseName: "Dumbbell Seated Shoulder Press",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 10,
          },
          {
            exerciseName: "Dumbbell Lateral Raise",
            targetSets: 4,
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
            exerciseName: "Dumbbell Hammer Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Barbell Close-grip Bench Press",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Barbell Lying Triceps Extension Skull Crusher",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
        ],
      },
      {
        name: "Legs",
        exercises: [
          {
            exerciseName: "Barbell Full Squat",
            targetSets: 4,
            targetRepMin: 6,
            targetRepMax: 8,
          },
          {
            exerciseName: "Barbell Romanian Deadlift",
            targetSets: 3,
            targetRepMin: 8,
            targetRepMax: 12,
          },
          {
            exerciseName: "Sled 45° Leg Press (side Pov)",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Seated Leg Curl",
            targetSets: 3,
            targetRepMin: 10,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Leg Extension",
            targetSets: 3,
            targetRepMin: 12,
            targetRepMax: 15,
          },
          {
            exerciseName: "Lever Standing Calf Raise",
            targetSets: 4,
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
