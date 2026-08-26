import { z } from "zod";

export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const muscleGroupSchema = z.enum([
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
]);

export const equipmentSchema = z.enum([
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
]);

// Exercises
export const imageUrlSchema = z.string().url().max(2048).nullable().optional();

export const exerciseCreateSchema = z.object({
  name: z.string().min(1).max(120),
  muscleGroup: muscleGroupSchema,
  equipment: equipmentSchema,
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

// Body weights
export const bodyWeightListQuery = paginationQuery.extend({
  userId: z.coerce.number().int().positive().optional(),
});
