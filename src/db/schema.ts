import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const muscleGroupEnum = pgEnum("muscle_group", [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
]);

export const equipmentEnum = pgEnum("equipment", [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
]);

export const unitEnum = pgEnum("unit", ["kg", "lb"]);

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const workoutStatusEnum = pgEnum("workout_status", [
  "in_progress",
  "completed",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  preferredUnit: unitEnum("preferred_unit").default("kg").notNull(),
  role: roleEnum("role").default("user").notNull(),
  heightCm: integer("height_cm"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  muscleGroup: muscleGroupEnum("muscle_group").notNull(),
  equipment: equipmentEnum("equipment").notNull(),
  isCompound: boolean("is_compound").default(false).notNull(),
});

export const splits = pgTable("splits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const splitDays = pgTable("split_days", {
  id: serial("id").primaryKey(),
  splitId: integer("split_id")
    .references(() => splits.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull(),
});

export const splitDayExercises = pgTable("split_day_exercises", {
  id: serial("id").primaryKey(),
  splitDayId: integer("split_day_id")
    .references(() => splitDays.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: integer("exercise_id")
    .references(() => exercises.id, { onDelete: "restrict" })
    .notNull(),
  orderIndex: integer("order_index").notNull(),
  targetSets: integer("target_sets").default(3).notNull(),
  targetRepMin: integer("target_rep_min").default(8).notNull(),
  targetRepMax: integer("target_rep_max").default(12).notNull(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  splitDayId: integer("split_day_id").references(() => splitDays.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  status: workoutStatusEnum("status").default("in_progress").notNull(),
  notes: text("notes"),
});

export const workoutExercises = pgTable("workout_exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id")
    .references(() => workouts.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: integer("exercise_id")
    .references(() => exercises.id, { onDelete: "restrict" })
    .notNull(),
  orderIndex: integer("order_index").notNull(),
  notes: text("notes"),
});

export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  workoutExerciseId: integer("workout_exercise_id")
    .references(() => workoutExercises.id, { onDelete: "cascade" })
    .notNull(),
  setNumber: integer("set_number").notNull(),
  weight: numeric("weight", { precision: 6, scale: 2 }).notNull(),
  reps: integer("reps").notNull(),
  rpe: numeric("rpe", { precision: 3, scale: 1 }),
  isWarmup: boolean("is_warmup").default(false).notNull(),
  completed: boolean("completed").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bodyWeights = pgTable(
  "body_weights",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    weight: numeric("weight", { precision: 5, scale: 2 }).notNull(),
    recordedAt: date("recorded_at").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    unique("body_weights_user_date_unique").on(table.userId, table.recordedAt),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  splits: many(splits),
  workouts: many(workouts),
  bodyWeights: many(bodyWeights),
}));

export const splitsRelations = relations(splits, ({ one, many }) => ({
  user: one(users, { fields: [splits.userId], references: [users.id] }),
  days: many(splitDays),
}));

export const splitDaysRelations = relations(splitDays, ({ one, many }) => ({
  split: one(splits, { fields: [splitDays.splitId], references: [splits.id] }),
  exercises: many(splitDayExercises),
}));

export const splitDayExercisesRelations = relations(
  splitDayExercises,
  ({ one }) => ({
    splitDay: one(splitDays, {
      fields: [splitDayExercises.splitDayId],
      references: [splitDays.id],
    }),
    exercise: one(exercises, {
      fields: [splitDayExercises.exerciseId],
      references: [exercises.id],
    }),
  }),
);

export const exercisesRelations = relations(exercises, ({ many }) => ({
  splitDayExercises: many(splitDayExercises),
  workoutExercises: many(workoutExercises),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, { fields: [workouts.userId], references: [users.id] }),
  splitDay: one(splitDays, {
    fields: [workouts.splitDayId],
    references: [splitDays.id],
  }),
  exercises: many(workoutExercises),
}));

export const workoutExercisesRelations = relations(
  workoutExercises,
  ({ one, many }) => ({
    workout: one(workouts, {
      fields: [workoutExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [workoutExercises.exerciseId],
      references: [exercises.id],
    }),
    sets: many(sets),
  }),
);

export const setsRelations = relations(sets, ({ one }) => ({
  workoutExercise: one(workoutExercises, {
    fields: [sets.workoutExerciseId],
    references: [workoutExercises.id],
  }),
}));

export const bodyWeightsRelations = relations(bodyWeights, ({ one }) => ({
  user: one(users, { fields: [bodyWeights.userId], references: [users.id] }),
}));
