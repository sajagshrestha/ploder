import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// Muscle group / equipment are free-form text matching the
// hasaneyldrm/exercises-dataset catalog (10 categories, 29 equipment types).
export const muscleGroupSchema = z.string().min(1).max(60);

export const equipmentSchema = z.string().min(1).max(60);

// Exercises
export const imageUrlSchema = z.string().url().max(2048).nullable().optional();

export const exerciseCreateSchema = z.object({
  name: z.string().min(1).max(120),
  alias: z.string().max(500).nullable().optional(),
  muscleGroup: muscleGroupSchema,
  equipment: equipmentSchema,
  target: z.string().max(120).nullable().optional(),
  secondaryMuscles: z.string().max(500).nullable().optional(),
  instructionsEn: z.string().max(5000).nullable().optional(),
  gifUrl: imageUrlSchema,
  externalId: z.string().max(16).nullable().optional(),
  isCompound: z.boolean().default(false),
  imageUrl: imageUrlSchema,
});

export const exerciseUpdateSchema = exerciseCreateSchema.partial();

export const exerciseListQuery = paginationQuery.extend({
  muscleGroup: muscleGroupSchema.optional(),
  equipment: equipmentSchema.optional(),
  search: z.string().optional(),
});

// Splits
export const splitCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(false),
});

export const splitUpdateSchema = splitCreateSchema.partial();

export const splitDayCreateSchema = z.object({
  name: z.string().min(1).max(120),
  orderIndex: z.number().int().min(0),
});

export const splitDayUpdateSchema = splitDayCreateSchema.partial();

export const splitDayExerciseCreateSchema = z.object({
  exerciseId: z.number().int().positive(),
  orderIndex: z.number().int().min(0),
  targetSets: z.number().int().min(1).max(20).default(3),
  targetRepMin: z.number().int().min(1).max(100).default(8),
  targetRepMax: z.number().int().min(1).max(100).default(12),
});

export const splitDayExerciseUpdateSchema =
  splitDayExerciseCreateSchema.partial();

// Users
export const userListQuery = paginationQuery.extend({
  role: z.enum(["user", "admin"]).optional(),
  search: z.string().optional(),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  role: z.enum(["user", "admin"]).optional(),
  preferredUnit: z.enum(["kg", "lb"]).optional(),
  heightCm: z.number().int().min(50).max(300).nullable().optional(),
});

// Workouts
export const workoutListQuery = paginationQuery.extend({
  userId: z.coerce.number().int().positive().optional(),
  status: z.enum(["in_progress", "completed"]).optional(),
});

export const myWorkoutHistoryQuery = workoutListQuery
  .extend({
    search: z.string().trim().max(120).optional(),
    from: z.iso.datetime().optional(),
    to: z.iso.datetime().optional(),
    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .refine(
    (value) =>
      !value.from || !value.to || Date.parse(value.from) < Date.parse(value.to),
    {
      message: "Start date must be before end date",
      path: ["to"],
    },
  );

export const myWorkoutBulkDeleteSchema = z.object({
  ids: z
    .array(z.number().int().positive())
    .min(1)
    .max(100)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate workouts"),
});

// Body weights
export const bodyWeightListQuery = paginationQuery.extend({
  userId: z.coerce.number().int().positive().optional(),
});

// User-scoped (/api/my) schemas — caller is authenticated, ownership is
// enforced against their own user id, no admin role required.
export const mySplitCloneSchema = z.object({
  templateId: z.number().int().positive(),
});

export const mySplitUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const myWorkoutStartSchema = z.object({
  name: z.string().min(1).max(120),
  splitDayId: z.number().int().positive().nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const myWorkoutExerciseAddSchema = z.object({
  exerciseId: z.number().int().positive(),
  notes: z.string().max(500).nullable().optional(),
});

export const mySetCreateSchema = z.object({
  weight: z.number().min(0).max(2000),
  reps: z.number().int().min(1).max(500),
  rpe: z.number().min(1).max(10).nullable().optional(),
  isWarmup: z.boolean().default(false),
  setNumber: z.number().int().min(1).optional(),
});

export const myBodyWeightCreateSchema = z.object({
  weight: z.number().min(20).max(500),
  recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  notes: z.string().max(500).nullable().optional(),
});

export const myWorkoutExerciseOrderSchema = z.object({
  exerciseIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(500)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Exercise IDs must be unique",
    ),
});

export const myWorkoutExercisesAddSchema = z.object({
  exerciseIds: z
    .array(z.number().int().positive())
    .min(1)
    .max(50)
    .refine(
      (ids) => new Set(ids).size === ids.length,
      "Choose each exercise only once",
    ),
});
