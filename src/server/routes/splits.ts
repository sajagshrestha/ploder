import { asc, eq, isNull } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import { exercises, splitDayExercises, splitDays, splits } from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";
import {
  idParam,
  splitCreateSchema,
  splitDayCreateSchema,
  splitDayExerciseCreateSchema,
  splitDayExerciseUpdateSchema,
  splitDayUpdateSchema,
  splitUpdateSchema,
} from "#/server/validators";

export const splitsRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  // Split templates only (userId is null)
  .get("/", async (context) => {
    const rows = await db
      .select()
      .from(splits)
      .where(isNull(splits.userId))
      .orderBy(asc(splits.id));
    return context.json({ data: rows, total: rows.length });
  })
  .post("/", async (context) => {
    const body = splitCreateSchema.parse(await context.req.json());
    const [row] = await db
      .insert(splits)
      .values({ ...body, userId: null })
      .returning();
    return context.json({ data: row }, 201);
  })
  .get("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [row] = await db
      .select()
      .from(splits)
      .where(eq(splits.id, id))
      .limit(1);

    if (!row || row.userId !== null) {
      return context.json({ error: "Split not found" }, 404);
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
        imageUrl: exercises.imageUrl,
        gifUrl: exercises.gifUrl,
        exerciseOrderIndex: splitDayExercises.orderIndex,
        targetSets: splitDayExercises.targetSets,
        targetRepMin: splitDayExercises.targetRepMin,
        targetRepMax: splitDayExercises.targetRepMax,
      })
      .from(splitDays)
      .leftJoin(
        splitDayExercises,
        eq(splitDayExercises.splitDayId, splitDays.id),
      )
      .leftJoin(exercises, eq(exercises.id, splitDayExercises.exerciseId))
      .where(eq(splitDays.splitId, id))
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
          imageUrl: day.imageUrl,
          gifUrl: day.gifUrl,
          orderIndex: day.exerciseOrderIndex,
          targetSets: day.targetSets,
          targetRepMin: day.targetRepMin,
          targetRepMax: day.targetRepMax,
        });
      }
    }

    return context.json({ data: { ...row, days: [...grouped.values()] } });
  })
  .patch("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const body = splitUpdateSchema.parse(await context.req.json());
    const [row] = await db
      .update(splits)
      .set(body)
      .where(eq(splits.id, id))
      .returning();

    if (!row || row.userId !== null) {
      return context.json({ error: "Split not found" }, 404);
    }
    return context.json({ data: row });
  })
  .delete("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [row] = await db.delete(splits).where(eq(splits.id, id)).returning();

    if (!row || row.userId !== null) {
      return context.json({ error: "Split not found" }, 404);
    }
    return context.json({ data: row });
  })
  // Days within a split template
  .post("/:id/days", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const body = splitDayCreateSchema.parse(await context.req.json());

    const [split] = await db
      .select({ id: splits.id })
      .from(splits)
      .where(eq(splits.id, id))
      .limit(1);
    if (!split) {
      return context.json({ error: "Split not found" }, 404);
    }

    const [row] = await db
      .insert(splitDays)
      .values({ splitId: id, name: body.name, orderIndex: body.orderIndex })
      .returning();
    return context.json({ data: row }, 201);
  })
  .patch("/days/:dayId", async (context) => {
    const { id: dayId } = idParam.parse({ id: context.req.param("dayId") });
    const body = splitDayUpdateSchema.parse(await context.req.json());
    const [row] = await db
      .update(splitDays)
      .set(body)
      .where(eq(splitDays.id, dayId))
      .returning();

    if (!row) {
      return context.json({ error: "Split day not found" }, 404);
    }
    return context.json({ data: row });
  })
  .delete("/days/:dayId", async (context) => {
    const { id: dayId } = idParam.parse({ id: context.req.param("dayId") });
    const [row] = await db
      .delete(splitDays)
      .where(eq(splitDays.id, dayId))
      .returning();

    if (!row) {
      return context.json({ error: "Split day not found" }, 404);
    }
    return context.json({ data: row });
  })
  // Exercises within a split day
  .post("/days/:dayId/exercises", async (context) => {
    const { id: dayId } = idParam.parse({ id: context.req.param("dayId") });
    const body = splitDayExerciseCreateSchema.parse(await context.req.json());
    const [row] = await db
      .insert(splitDayExercises)
      .values({ splitDayId: dayId, ...body })
      .returning();
    return context.json({ data: row }, 201);
  })
  .patch("/day-exercises/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const body = splitDayExerciseUpdateSchema.parse(await context.req.json());
    const [row] = await db
      .update(splitDayExercises)
      .set(body)
      .where(eq(splitDayExercises.id, id))
      .returning();

    if (!row) {
      return context.json({ error: "Split day exercise not found" }, 404);
    }
    return context.json({ data: row });
  })
  .delete("/day-exercises/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [row] = await db
      .delete(splitDayExercises)
      .where(eq(splitDayExercises.id, id))
      .returning();

    if (!row) {
      return context.json({ error: "Split day exercise not found" }, 404);
    }
    return context.json({ data: row });
  });
