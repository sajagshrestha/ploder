import { count, desc, eq } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import { bodyWeights, users } from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";
import { bodyWeightListQuery } from "#/server/validators";

export const bodyWeightsRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  .get("/", async (context) => {
    const query = bodyWeightListQuery.parse(context.req.query());
    const where = query.userId
      ? eq(bodyWeights.userId, query.userId)
      : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: bodyWeights.id,
          userId: bodyWeights.userId,
          userName: users.name,
          weight: bodyWeights.weight,
          recordedAt: bodyWeights.recordedAt,
          notes: bodyWeights.notes,
        })
        .from(bodyWeights)
        .leftJoin(users, eq(users.id, bodyWeights.userId))
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
  });
