import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import {
  bodyWeights,
  exercises,
  sets,
  splitDayExercises,
  splitDays,
  splits,
  workoutExercises,
  workouts,
} from "#/db/schema";
import { type AppEnv, requireAuth } from "#/server/auth";
import { idempotency } from "#/server/idempotency";
import {
  exerciseListQuery,
  idParam,
  myBodyWeightCreateSchema,
  mySetCreateSchema,
  mySplitCloneSchema,
  mySplitUpdateSchema,
  myWorkoutBulkDeleteSchema,
  myWorkoutExerciseAddSchema,
  myWorkoutExerciseOrderSchema,
  myWorkoutExercisesAddSchema,
  myWorkoutHistoryQuery,
  myWorkoutStartSchema,
  paginationQuery,
} from "#/server/validators";

type User = AppEnv["Variables"]["user"];

function ownSplit(splitId: number, userId: number) {
  return db
    .select({ id: splits.id })
    .from(splits)
    .where(and(eq(splits.id, splitId), eq(splits.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

function ownWorkout(workoutId: number, userId: number) {
  return db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, workoutId), eq(workouts.userId, userId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function splitDetail(splitId: number) {
  const [row] = await db
    .select()
    .from(splits)
    .where(eq(splits.id, splitId))
    .limit(1);
  if (!row) {
    return null;
  }

  const days = await db
    .select({
      id: splitDays.id,
      name: splitDays.name,
      dayOrderIndex: splitDays.orderIndex,
      splitDayExerciseId: splitDayExercises.id,
      exerciseId: splitDayExercises.exerciseId,
      exerciseName: exercises.name,
      target: exercises.target,
      exerciseOrderIndex: splitDayExercises.orderIndex,
      targetSets: splitDayExercises.targetSets,
      targetRepMin: splitDayExercises.targetRepMin,
      targetRepMax: splitDayExercises.targetRepMax,
    })
    .from(splitDays)
    .leftJoin(splitDayExercises, eq(splitDayExercises.splitDayId, splitDays.id))
    .leftJoin(exercises, eq(exercises.id, splitDayExercises.exerciseId))
    .where(eq(splitDays.splitId, splitId))
    .orderBy(asc(splitDays.orderIndex), asc(splitDayExercises.orderIndex));

  const grouped = new Map<
    number,
    { id: number; name: string; orderIndex: number; exercises: unknown[] }
  >();
  for (const day of days) {
    let entry = grouped.get(day.id);
    if (!entry) {
      entry = {
        id: day.id,
        name: day.name,
        orderIndex: day.dayOrderIndex,
        exercises: [],
      };
      grouped.set(day.id, entry);
    }
    if (day.exerciseId !== null) {
      entry.exercises.push({
        splitDayExerciseId: day.splitDayExerciseId,
        exerciseId: day.exerciseId,
        exerciseName: day.exerciseName,
        target: day.target,
        orderIndex: day.exerciseOrderIndex,
        targetSets: day.targetSets,
        targetRepMin: day.targetRepMin,
        targetRepMax: day.targetRepMax,
      });
    }
  }

  return { ...row, days: [...grouped.values()] };
}

async function workoutDetail(workoutId: number) {
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);
  if (!workout) {
    return null;
  }

  const loggedExercises = await db
    .select({
      id: workoutExercises.id,
      exerciseId: workoutExercises.exerciseId,
      exerciseName: exercises.name,
      imageUrl: exercises.imageUrl,
      gifUrl: exercises.gifUrl,
      target: exercises.target,
      orderIndex: workoutExercises.orderIndex,
      notes: workoutExercises.notes,
    })
    .from(workoutExercises)
    .leftJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(eq(workoutExercises.workoutId, workoutId))
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
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(sets.setNumber);

  return {
    ...workout,
    exercises: loggedExercises.map((exercise) => ({
      ...exercise,
      sets: allSets.filter((set) => set.workoutExerciseId === exercise.id),
    })),
  };
}

export const myRoutes = new Hono<AppEnv>()
  .use(requireAuth)
  .use(idempotency)
  // A complete rolling year, independent of workout history pagination.
  .get("/activity", async (context) => {
    const since = new Date();
    since.setDate(since.getDate() - 378);
    const rows = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        startedAt: workouts.startedAt,
        completedAt: workouts.completedAt,
      })
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, context.get("user").id),
          eq(workouts.status, "completed"),
          gte(workouts.startedAt, since),
        ),
      )
      .orderBy(asc(workouts.startedAt));
    return context.json({ data: rows });
  })
  // Training analytics from completed working sets. Warm-ups are excluded so
  // frequency, volume, and progression reflect stimulus-bearing work.
  .get("/analytics", async (context) => {
    const requestedWeeks = Number(context.req.query("weeks") ?? 12);
    const periodWeeks = [4, 8, 12, 24].includes(requestedWeeks)
      ? requestedWeeks
      : 12;
    const since = new Date();
    since.setDate(since.getDate() - periodWeeks * 7);

    const rows = await db
      .select({
        workoutId: workouts.id,
        workoutDate: workouts.startedAt,
        exerciseId: exercises.id,
        exerciseName: exercises.name,
        muscleGroup: exercises.muscleGroup,
        weight: sets.weight,
        reps: sets.reps,
      })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(workoutExercises.id, sets.workoutExerciseId),
      )
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(
        and(
          eq(workouts.userId, context.get("user").id),
          eq(workouts.status, "completed"),
          eq(sets.completed, true),
          eq(sets.isWarmup, false),
          gte(workouts.startedAt, since),
        ),
      )
      .orderBy(asc(workouts.startedAt), asc(sets.setNumber));

    const weekStart = (date: Date) => {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return start;
    };
    const keyFor = (date: Date) => date.toISOString().slice(0, 10);
    const weekly = Array.from({ length: periodWeeks }, (_, index) => {
      const date = weekStart(new Date());
      date.setDate(date.getDate() - (periodWeeks - 1 - index) * 7);
      return {
        key: keyFor(date),
        label: date.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        hardSets: 0,
        reps: 0,
        volume: 0,
      };
    });
    const weeklyByKey = new Map(weekly.map((week) => [week.key, week]));
    const muscles = new Map<
      string,
      { workoutIds: Set<number>; totalSets: number; totalVolume: number }
    >();
    const exerciseSessions = new Map<
      number,
      Map<
        number,
        {
          date: Date;
          name: string;
          muscleGroup: string;
          sets: { weight: number; reps: number }[];
        }
      >
    >();

    for (const row of rows) {
      const weight = Number(row.weight);
      const volume = weight * row.reps;
      const week = weeklyByKey.get(keyFor(weekStart(row.workoutDate)));
      if (week) {
        week.hardSets += 1;
        week.reps += row.reps;
        week.volume += volume;
      }

      const muscle = muscles.get(row.muscleGroup) ?? {
        workoutIds: new Set<number>(),
        totalSets: 0,
        totalVolume: 0,
      };
      muscle.workoutIds.add(row.workoutId);
      muscle.totalSets += 1;
      muscle.totalVolume += volume;
      muscles.set(row.muscleGroup, muscle);

      const sessions = exerciseSessions.get(row.exerciseId) ?? new Map();
      const session = sessions.get(row.workoutId) ?? {
        date: row.workoutDate,
        name: row.exerciseName,
        muscleGroup: row.muscleGroup,
        sets: [],
      };
      session.sets.push({ weight, reps: row.reps });
      sessions.set(row.workoutId, session);
      exerciseSessions.set(row.exerciseId, sessions);
    }

    const summariseSession = (session: {
      date: Date;
      sets: { weight: number; reps: number }[];
    }) => {
      const best = session.sets.reduce((winner, set) => {
        const estimate = set.weight * (1 + set.reps / 30);
        const winnerEstimate = winner.weight * (1 + winner.reps / 30);
        return estimate > winnerEstimate ? set : winner;
      });
      return {
        date: session.date,
        weight: best.weight,
        reps: best.reps,
        estimated1rm: best.weight * (1 + best.reps / 30),
        totalReps: session.sets.reduce((sum, set) => sum + set.reps, 0),
        volume: session.sets.reduce(
          (sum, set) => sum + set.weight * set.reps,
          0,
        ),
      };
    };

    const exerciseProgress = [...exerciseSessions.entries()]
      .map(([exerciseId, sessions]) => {
        const ordered = [...sessions.values()].sort(
          (a, b) => b.date.getTime() - a.date.getTime(),
        );
        const current = summariseSession(ordered[0]);
        const previous = ordered[1] ? summariseSession(ordered[1]) : null;
        return {
          exerciseId,
          name: ordered[0].name,
          muscleGroup: ordered[0].muscleGroup,
          current,
          previous,
          estimated1rmChange: previous
            ? current.estimated1rm - previous.estimated1rm
            : null,
        };
      })
      .sort((a, b) => b.current.date.getTime() - a.current.date.getTime());

    return context.json({
      data: {
        periodWeeks,
        weekly: weekly.map((week) => ({
          ...week,
          volume: Math.round(week.volume),
        })),
        muscleGroups: [...muscles.entries()]
          .map(([muscleGroup, value]) => ({
            muscleGroup,
            sessionsPerWeek: value.workoutIds.size / periodWeeks,
            setsPerWeek: value.totalSets / periodWeeks,
            totalSets: value.totalSets,
            totalVolume: Math.round(value.totalVolume),
          }))
          .sort((a, b) => b.sessionsPerWeek - a.sessionsPerWeek),
        exercises: exerciseProgress,
        totals: {
          hardSets: rows.length,
          reps: rows.reduce((sum, row) => sum + row.reps, 0),
          volume: Math.round(
            rows.reduce((sum, row) => sum + Number(row.weight) * row.reps, 0),
          ),
        },
      },
    });
  })
  // Exercise library (read-only for signed-in users)
  .get("/exercises/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [exercise] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);
    if (!exercise) return context.json({ error: "Exercise not found" }, 404);
    return context.json({ data: exercise });
  })
  .get("/exercises", async (context) => {
    const query = exerciseListQuery.parse(context.req.query());
    const filters = [
      query.muscleGroup
        ? eq(exercises.muscleGroup, query.muscleGroup)
        : undefined,
      query.equipment ? eq(exercises.equipment, query.equipment) : undefined,
      query.search
        ? or(
            ilike(exercises.name, `%${query.search}%`),
            ilike(exercises.alias, `%${query.search}%`),
          )
        : undefined,
    ].filter((filter) => filter !== undefined);

    const where = filters.length ? and(...filters) : undefined;
    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(exercises)
        .where(where)
        .orderBy(asc(exercises.name))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(exercises).where(where),
    ]);
    return context.json({
      data: rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  })
  // Split templates published by admins
  .get("/templates", async (context) => {
    const rows = await db
      .select()
      .from(splits)
      .where(isNull(splits.userId))
      .orderBy(asc(splits.id));
    return context.json({ data: rows, total: rows.length });
  })
  .get("/templates/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const detail = await splitDetail(id);
    if (!detail || detail.userId !== null) {
      return context.json({ error: "Template not found" }, 404);
    }
    return context.json({ data: detail });
  })
  // Own splits
  .get("/splits", async (context) => {
    const user = context.get("user");
    const rows = await db
      .select()
      .from(splits)
      .where(eq(splits.userId, user.id))
      .orderBy(desc(splits.isActive), asc(splits.id));
    return context.json({ data: rows, total: rows.length });
  })
  .post("/splits/clone", async (context) => {
    const user: User = context.get("user");
    const { templateId } = mySplitCloneSchema.parse(await context.req.json());

    const template = await splitDetail(templateId);
    if (!template || template.userId !== null) {
      return context.json({ error: "Template not found" }, 404);
    }

    // Note: neon-http has no transaction support, so inserts run
    // sequentially with best-effort cleanup of the parent row on failure
    // (children cascade-delete).
    const [split] = await db
      .insert(splits)
      .values({
        userId: user.id,
        name: template.name,
        description: template.description,
        isActive: false,
      })
      .returning();

    if (!split) {
      throw new Error("Failed to clone split");
    }

    try {
      for (const day of template.days as {
        name: string;
        orderIndex: number;
        exercises: {
          exerciseId: number;
          orderIndex: number;
          targetSets: number;
          targetRepMin: number;
          targetRepMax: number;
        }[];
      }[]) {
        const [newDay] = await db
          .insert(splitDays)
          .values({
            splitId: split.id,
            name: day.name,
            orderIndex: day.orderIndex,
          })
          .returning();
        if (!newDay) {
          throw new Error("Failed to clone split day");
        }
        for (const item of day.exercises) {
          await db.insert(splitDayExercises).values({
            splitDayId: newDay.id,
            exerciseId: item.exerciseId,
            orderIndex: item.orderIndex,
            targetSets: item.targetSets,
            targetRepMin: item.targetRepMin,
            targetRepMax: item.targetRepMax,
          });
        }
      }
    } catch (error) {
      await db.delete(splits).where(eq(splits.id, split.id));
      throw error;
    }

    return context.json({ data: split }, 201);
  })
  .get("/splits/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const detail = await splitDetail(id);
    if (!detail || detail.userId !== user.id) {
      return context.json({ error: "Split not found" }, 404);
    }
    return context.json({ data: detail });
  })
  .patch("/splits/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const body = mySplitUpdateSchema.parse(await context.req.json());

    const existing = await ownSplit(id, user.id);
    if (!existing) {
      return context.json({ error: "Split not found" }, 404);
    }

    const [row] = await db
      .update(splits)
      .set(body)
      .where(eq(splits.id, id))
      .returning();

    if (body.isActive) {
      await db
        .update(splits)
        .set({ isActive: false })
        .where(and(eq(splits.userId, user.id), ne(splits.id, id)));
    }

    return context.json({ data: row });
  })
  .delete("/splits/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const existing = await ownSplit(id, user.id);
    if (!existing) {
      return context.json({ error: "Split not found" }, 404);
    }
    const [row] = await db.delete(splits).where(eq(splits.id, id)).returning();
    return context.json({ data: row });
  })
  // Own workouts
  .get("/workouts", async (context) => {
    const user: User = context.get("user");
    const query = myWorkoutHistoryQuery.parse(context.req.query());
    const filters = [
      eq(workouts.userId, user.id),
      query.status ? eq(workouts.status, query.status) : undefined,
      query.search
        ? ilike(workouts.name, `%${query.search.replace(/[\\%_]/g, "\\$&")}%`)
        : undefined,
      query.from ? gte(workouts.startedAt, new Date(query.from)) : undefined,
      query.to ? lt(workouts.startedAt, new Date(query.to)) : undefined,
    ].filter(Boolean);
    const where = and(...filters);

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(workouts)
        .where(where)
        .orderBy(
          query.sort === "oldest"
            ? asc(workouts.startedAt)
            : desc(workouts.startedAt),
          query.sort === "oldest" ? asc(workouts.id) : desc(workouts.id),
        )
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(workouts).where(where),
    ]);
    const totals = rows.length
      ? await db
          .select({
            workoutId: workoutExercises.workoutId,
            exerciseCount:
              sql<number>`count(distinct ${workoutExercises.id})`.mapWith(
                Number,
              ),
            setCount: count(sets.id),
            volume:
              sql<number>`coalesce(sum(${sets.weight} * ${sets.reps}), 0)`.mapWith(
                Number,
              ),
          })
          .from(workoutExercises)
          .leftJoin(
            sets,
            and(
              eq(sets.workoutExerciseId, workoutExercises.id),
              eq(sets.completed, true),
            ),
          )
          .where(
            inArray(
              workoutExercises.workoutId,
              rows.map((row) => row.id),
            ),
          )
          .groupBy(workoutExercises.workoutId)
      : [];
    const totalsById = new Map(totals.map((row) => [row.workoutId, row]));
    return context.json({
      data: rows.map((row) => ({
        ...row,
        exerciseCount: totalsById.get(row.id)?.exerciseCount ?? 0,
        setCount: totalsById.get(row.id)?.setCount ?? 0,
        volume: totalsById.get(row.id)?.volume ?? 0,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  })
  .post("/workouts", async (context) => {
    const user: User = context.get("user");
    const body = myWorkoutStartSchema.parse(await context.req.json());

    let dayExercises: { exerciseId: number; orderIndex: number }[] = [];
    if (body.splitDayId) {
      const [day] = await db
        .select({
          dayId: splitDays.id,
          ownerId: splits.userId,
        })
        .from(splitDays)
        .innerJoin(splits, eq(splits.id, splitDays.splitId))
        .where(eq(splitDays.id, body.splitDayId))
        .limit(1);
      if (!day || (day.ownerId !== null && day.ownerId !== user.id)) {
        return context.json({ error: "Training day not found" }, 404);
      }
      dayExercises = await db
        .select({
          exerciseId: splitDayExercises.exerciseId,
          orderIndex: splitDayExercises.orderIndex,
        })
        .from(splitDayExercises)
        .where(eq(splitDayExercises.splitDayId, body.splitDayId))
        .orderBy(asc(splitDayExercises.orderIndex));
    }

    const [workout] = await db
      .insert(workouts)
      .values({
        userId: user.id,
        name: body.name,
        splitDayId: body.splitDayId ?? null,
        notes: body.notes ?? null,
        status: "in_progress",
      })
      .returning();
    if (!workout) {
      throw new Error("Failed to start workout");
    }
    try {
      for (const [index, item] of dayExercises.entries()) {
        await db.insert(workoutExercises).values({
          workoutId: workout.id,
          exerciseId: item.exerciseId,
          orderIndex: item.orderIndex ?? index,
        });
      }
    } catch (error) {
      await db.delete(workouts).where(eq(workouts.id, workout.id));
      throw error;
    }

    const detail = await workoutDetail(workout.id);
    return context.json({ data: detail }, 201);
  })
  .post("/workouts/bulk-delete", async (context) => {
    const { ids } = myWorkoutBulkDeleteSchema.parse(await context.req.json());
    const deleted = await db
      .delete(workouts)
      .where(
        and(
          eq(workouts.userId, context.get("user").id),
          inArray(workouts.id, ids),
        ),
      )
      .returning({ id: workouts.id });
    return context.json({ data: deleted });
  })
  .get("/workouts/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const workout = await ownWorkout(id, user.id);
    if (!workout) {
      return context.json({ error: "Workout not found" }, 404);
    }
    return context.json({ data: await workoutDetail(id) });
  })
  .post("/workouts/:id/complete", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const workout = await ownWorkout(id, user.id);
    if (!workout) {
      return context.json({ error: "Workout not found" }, 404);
    }
    if (workout.status !== "in_progress") {
      return context.json({ error: "Workout is already completed" }, 409);
    }
    const [row] = await db
      .update(workouts)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(workouts.id, id))
      .returning();
    return context.json({ data: row });
  })
  .delete("/workouts/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const workout = await ownWorkout(id, user.id);
    if (!workout) {
      return context.json({ error: "Workout not found" }, 404);
    }
    const [row] = await db
      .delete(workouts)
      .where(eq(workouts.id, id))
      .returning();
    return context.json({ data: row });
  })
  .post("/workouts/:id/exercises", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const body = myWorkoutExerciseAddSchema.parse(await context.req.json());

    const workout = await ownWorkout(id, user.id);
    if (!workout) {
      return context.json({ error: "Workout not found" }, 404);
    }
    if (workout.status !== "in_progress") {
      return context.json({ error: "Workout is already completed" }, 409);
    }
    const [exercise] = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(eq(exercises.id, body.exerciseId))
      .limit(1);
    if (!exercise) {
      return context.json({ error: "Exercise not found" }, 404);
    }

    const existing = await db
      .select({ orderIndex: workoutExercises.orderIndex })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(desc(workoutExercises.orderIndex))
      .limit(1);

    const [row] = await db
      .insert(workoutExercises)
      .values({
        workoutId: id,
        exerciseId: body.exerciseId,
        orderIndex: (existing[0]?.orderIndex ?? -1) + 1,
        notes: body.notes ?? null,
      })
      .returning();
    return context.json({ data: row }, 201);
  })
  .post("/workouts/:id/exercises/batch", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const { exerciseIds } = myWorkoutExercisesAddSchema.parse(
      await context.req.json(),
    );
    const workout = await ownWorkout(id, user.id);
    if (!workout) return context.json({ error: "Workout not found" }, 404);
    if (workout.status !== "in_progress")
      return context.json({ error: "Workout is already completed" }, 409);
    const selected = await db
      .select({ id: exercises.id })
      .from(exercises)
      .where(inArray(exercises.id, exerciseIds));
    if (selected.length !== exerciseIds.length)
      return context.json(
        { error: "An exercise is no longer available. Refresh and try again." },
        400,
      );
    const [last] = await db
      .select({ orderIndex: workoutExercises.orderIndex })
      .from(workoutExercises)
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(desc(workoutExercises.orderIndex))
      .limit(1);
    // One INSERT keeps a batch all-or-nothing and preserves the selection order.
    const rows = await db
      .insert(workoutExercises)
      .values(
        exerciseIds.map((exerciseId, index) => ({
          workoutId: id,
          exerciseId,
          orderIndex: (last?.orderIndex ?? -1) + index + 1,
          notes: null,
        })),
      )
      .returning();
    return context.json({ data: rows }, 201);
  })
  .patch("/workouts/:id/exercises/order", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const { exerciseIds } = myWorkoutExerciseOrderSchema.parse(
      await context.req.json(),
    );
    const workout = await ownWorkout(id, user.id);
    if (!workout) return context.json({ error: "Workout not found" }, 404);
    if (workout.status !== "in_progress")
      return context.json({ error: "Workout is already completed" }, 409);
    const ids = sql.join(
      exerciseIds.map((exerciseId) => sql`${exerciseId}`),
      sql`, `,
    );
    // One statement: validate the complete membership and write every position atomically.
    // The guards also reject stale lists after another client adds or removes an exercise.
    const rows = await db
      .update(workoutExercises)
      .set({
        orderIndex: sql`case ${workoutExercises.id} ${sql.join(
          exerciseIds.map(
            (exerciseId, index) =>
              sql`when ${exerciseId} then ${index}::integer`,
          ),
          sql` `,
        )} else ${workoutExercises.orderIndex} end`,
      })
      .where(
        and(
          eq(workoutExercises.workoutId, id),
          sql`(select count(*) from workout_exercises as members where members.workout_id = ${id}) = ${exerciseIds.length}`,
          sql`not exists (select 1 from workout_exercises as members where members.workout_id = ${id} and members.id not in (${ids}))`,
          sql`exists (select 1 from workouts as owner where owner.id = ${id} and owner.user_id = ${user.id} and owner.status = 'in_progress')`,
        ),
      )
      .returning({
        id: workoutExercises.id,
        orderIndex: workoutExercises.orderIndex,
      });
    if (rows.length !== exerciseIds.length)
      return context.json(
        { error: "This workout changed. Refresh and try again." },
        409,
      );
    return context.json({ data: rows });
  })
  .delete("/workout-exercises/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());

    const [entry] = await db
      .select({
        id: workoutExercises.id,
        ownerId: workouts.userId,
        status: workouts.status,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(eq(workoutExercises.id, id))
      .limit(1);

    if (!entry || entry.ownerId !== user.id) {
      return context.json({ error: "Exercise not found" }, 404);
    }
    if (entry.status !== "in_progress") {
      return context.json({ error: "Workout is already completed" }, 409);
    }
    const [row] = await db
      .delete(workoutExercises)
      .where(eq(workoutExercises.id, id))
      .returning();
    return context.json({ data: row });
  })
  .post("/workout-exercises/:id/sets", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const body = mySetCreateSchema.parse(await context.req.json());

    const [entry] = await db
      .select({
        id: workoutExercises.id,
        workoutId: workoutExercises.workoutId,
        ownerId: workouts.userId,
        status: workouts.status,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(eq(workoutExercises.id, id))
      .limit(1);

    if (!entry || entry.ownerId !== user.id) {
      return context.json({ error: "Exercise not found" }, 404);
    }
    if (entry.status !== "in_progress") {
      return context.json({ error: "Workout is already completed" }, 409);
    }

    const existingSets = await db
      .select({ setNumber: sets.setNumber })
      .from(sets)
      .where(eq(sets.workoutExerciseId, id))
      .orderBy(desc(sets.setNumber))
      .limit(1);

    const [row] = await db
      .insert(sets)
      .values({
        workoutExerciseId: id,
        setNumber: body.setNumber ?? (existingSets[0]?.setNumber ?? 0) + 1,
        weight: String(body.weight),
        reps: body.reps,
        rpe:
          body.rpe === undefined || body.rpe === null ? null : String(body.rpe),
        isWarmup: body.isWarmup,
        completed: true,
      })
      .returning();
    return context.json({ data: row }, 201);
  })
  .delete("/sets/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());

    const [entry] = await db
      .select({ id: sets.id, ownerId: workouts.userId })
      .from(sets)
      .innerJoin(
        workoutExercises,
        eq(workoutExercises.id, sets.workoutExerciseId),
      )
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(eq(sets.id, id))
      .limit(1);

    if (!entry || entry.ownerId !== user.id) {
      return context.json({ error: "Set not found" }, 404);
    }
    const [row] = await db.delete(sets).where(eq(sets.id, id)).returning();
    return context.json({ data: row });
  })
  // Own body weight history
  .get("/body-weights", async (context) => {
    const user: User = context.get("user");
    const query = paginationQuery.parse(context.req.query());
    const where = eq(bodyWeights.userId, user.id);
    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(bodyWeights)
        .where(where)
        .orderBy(desc(bodyWeights.recordedAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(bodyWeights).where(where),
    ]);
    return context.json({
      data: rows,
      total,
      page: query.page,
      pageSize: query.pageSize,
    });
  })
  .post("/body-weights", async (context) => {
    const user: User = context.get("user");
    const body = myBodyWeightCreateSchema.parse(await context.req.json());

    const [existing] = await db
      .select({ id: bodyWeights.id })
      .from(bodyWeights)
      .where(
        and(
          eq(bodyWeights.userId, user.id),
          eq(bodyWeights.recordedAt, body.recordedAt),
        ),
      )
      .limit(1);
    if (existing) {
      return context.json(
        { error: "An entry for this date already exists" },
        409,
      );
    }

    const [row] = await db
      .insert(bodyWeights)
      .values({
        userId: user.id,
        weight: String(body.weight),
        recordedAt: body.recordedAt,
        notes: body.notes ?? null,
      })
      .returning();
    return context.json({ data: row }, 201);
  })
  .delete("/body-weights/:id", async (context) => {
    const user: User = context.get("user");
    const { id } = idParam.parse(context.req.param());
    const [existing] = await db
      .select({ id: bodyWeights.id })
      .from(bodyWeights)
      .where(and(eq(bodyWeights.id, id), eq(bodyWeights.userId, user.id)))
      .limit(1);
    if (!existing) {
      return context.json({ error: "Entry not found" }, 404);
    }
    const [row] = await db
      .delete(bodyWeights)
      .where(eq(bodyWeights.id, id))
      .returning();
    return context.json({ data: row });
  })
  // Home-screen summary
  .get("/summary", async (context) => {
    const user: User = context.get("user");

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      activeSplits,
      activeWorkouts,
      [workoutCount],
      [completedCount],
      [weekCount],
      [setCount],
      latestWeights,
    ] = await Promise.all([
      db
        .select()
        .from(splits)
        .where(and(eq(splits.userId, user.id), eq(splits.isActive, true)))
        .limit(1),
      db
        .select()
        .from(workouts)
        .where(
          and(eq(workouts.userId, user.id), eq(workouts.status, "in_progress")),
        )
        .orderBy(desc(workouts.startedAt))
        .limit(1),
      db
        .select({ value: count() })
        .from(workouts)
        .where(eq(workouts.userId, user.id)),
      db
        .select({ value: count() })
        .from(workouts)
        .where(
          and(eq(workouts.userId, user.id), eq(workouts.status, "completed")),
        ),
      db
        .select({ value: count() })
        .from(workouts)
        .where(
          and(eq(workouts.userId, user.id), gte(workouts.startedAt, weekAgo)),
        ),
      db
        .select({ value: count() })
        .from(sets)
        .innerJoin(
          workoutExercises,
          eq(workoutExercises.id, sets.workoutExerciseId),
        )
        .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
        .where(eq(workouts.userId, user.id)),
      db
        .select()
        .from(bodyWeights)
        .where(eq(bodyWeights.userId, user.id))
        .orderBy(desc(bodyWeights.recordedAt))
        .limit(1),
    ]);

    return context.json({
      data: {
        activeSplit: activeSplits[0] ?? null,
        activeWorkout: activeWorkouts[0] ?? null,
        totals: {
          workouts: workoutCount?.value ?? 0,
          completedWorkouts: completedCount?.value ?? 0,
          weekWorkouts: weekCount?.value ?? 0,
          sets: setCount?.value ?? 0,
        },
        latestBodyWeight: latestWeights[0] ?? null,
      },
    });
  });
