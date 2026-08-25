import { and, asc, count, eq, ilike } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import { exercises } from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";
import {
  exerciseCreateSchema,
  exerciseListQuery,
  exerciseUpdateSchema,
  idParam,
} from "#/server/validators";

export const exercisesRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  .get("/", async (context) => {
    const query = exerciseListQuery.parse(context.req.query());
    const filters = [
      query.muscleGroup && eq(exercises.muscleGroup, query.muscleGroup),
      query.equipment && eq(exercises.equipment, query.equipment),
      query.search && ilike(exercises.name, `%${query.search}%`),
    ].filter(Boolean);

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select()
        .from(exercises)
        .where(filters.length ? and(...filters) : undefined)
        .orderBy(asc(exercises.muscleGroup), asc(exercises.name))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db
        .select({ value: count() })
        .from(exercises)
        .where(filters.length ? and(...filters) : undefined),
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
    const [row] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);

    if (!row) {
      return context.json({ error: "Exercise not found" }, 404);
    }
    return context.json({ data: row });
  })
  .post("/", async (context) => {
    const body = exerciseCreateSchema.parse(await context.req.json());
    const [row] = await db.insert(exercises).values(body).returning();
    return context.json({ data: row }, 201);
  })
  .patch("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const body = exerciseUpdateSchema.parse(await context.req.json());
    const [row] = await db
      .update(exercises)
      .set(body)
      .where(eq(exercises.id, id))
      .returning();

    if (!row) {
      return context.json({ error: "Exercise not found" }, 404);
    }
    return context.json({ data: row });
  })
  .delete("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const [row] = await db
      .delete(exercises)
      .where(eq(exercises.id, id))
      .returning();

    if (!row) {
      return context.json({ error: "Exercise not found" }, 404);
    }
    return context.json({ data: row });
  });
