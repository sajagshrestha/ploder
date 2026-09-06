import { and, count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import {
  exercises,
  sets,
  users,
  workoutExercises,
  workouts,
} from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";
import { idParam, workoutListQuery } from "#/server/validators";

export const workoutsRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  // Read-only: workouts belong to users, admins observe
  .get("/", async (context) => {
    const query = workoutListQuery.parse(context.req.query());
    const filters = [
      query.userId && eq(workouts.userId, query.userId),
      query.status && eq(workouts.status, query.status),
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: workouts.id,
          userId: workouts.userId,
          userName: users.name,
          splitDayId: workouts.splitDayId,
          name: workouts.name,
          startedAt: workouts.startedAt,
          completedAt: workouts.completedAt,
          status: workouts.status,
          notes: workouts.notes,
        })
        .from(workouts)
        .leftJoin(users, eq(users.id, workouts.userId))
        .where(where)
        .orderBy(desc(workouts.startedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(workouts).where(where),
    ]);

    return context.json({
      data: rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  })
  .get("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout) {
      return context.json({ error: "Workout not found" }, 404);
    }

    const loggedExercises = await db
      .select({
        id: workoutExercises.id,
        exerciseId: workoutExercises.exerciseId,
        exerciseName: exercises.name,
        target: exercises.target,
        orderIndex: workoutExercises.orderIndex,
        notes: workoutExercises.notes,
      })
      .from(workoutExercises)
      .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(workoutExercises.orderIndex);

    const allSets = await db
      .select({
        id: sets.id,
        workoutExerciseId: sets.workoutExerciseId,
        setNumber: sets.setNumber,
        weight: sets.weight,
        reps: sets.reps,
        rpe: sets.rpe,
        isWarmup: sets.isWarmup,
        completed: sets.completed,
      })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(workoutExercises.id, sets.workoutExerciseId),
      )
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(sets.setNumber);

    return context.json({
      data: {
        ...workout,
        exercises: loggedExercises.map((exercise) => ({
          ...exercise,
          sets: allSets.filter((set) => set.workoutExerciseId === exercise.id),
        })),
      },
    });
  });
