import { count, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import {
  bodyWeights,
  exercises,
  sets,
  splits,
  users,
  workouts,
} from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";

export const statsRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  .get("/", async (context) => {
    const [
      [{ value: totalExercises }],
      [{ value: totalSplits }],
      [{ value: totalUsers }],
      [{ value: totalAdmins }],
      [{ value: totalWorkouts }],
      [{ value: completedWorkouts }],
      [{ value: totalSets }],
      [{ value: totalBodyWeights }],
    ] = await Promise.all([
      db.select({ value: count() }).from(exercises),
      db.select({ value: count() }).from(splits),
      db.select({ value: count() }).from(users).where(eq(users.role, "user")),
      db.select({ value: count() }).from(users).where(eq(users.role, "admin")),
      db.select({ value: count() }).from(workouts),
      db
        .select({ value: count() })
        .from(workouts)
        .where(eq(workouts.status, "completed")),
      db.select({ value: count() }).from(sets),
      db.select({ value: count() }).from(bodyWeights),
    ]);

    return context.json({
      data: {
        exercises: totalExercises,
        splits: totalSplits,
        users: totalUsers,
        admins: totalAdmins,
        workouts: totalWorkouts,
        completedWorkouts,
        sets: totalSets,
        bodyWeights: totalBodyWeights,
      },
    });
  });
