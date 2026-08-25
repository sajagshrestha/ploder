import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { Hono } from "hono";

import { db } from "#/db";
import { users } from "#/db/schema";
import { type AppEnv, requireAdmin, requireAuth } from "#/server/auth";
import { idParam, userListQuery, userUpdateSchema } from "#/server/validators";

export const usersRoutes = new Hono<AppEnv>()
  .use(requireAuth, requireAdmin)
  .get("/", async (context) => {
    const query = userListQuery.parse(context.req.query());
    const filters = [
      query.role && eq(users.role, query.role),
      query.search &&
        or(
          ilike(users.name, `%${query.search}%`),
          ilike(users.email, `%${query.search}%`),
        ),
    ].filter(Boolean);
    const where = filters.length ? and(...filters) : undefined;

    const [rows, [{ value: total }]] = await Promise.all([
      db
        .select({
          id: users.id,
          clerkId: users.clerkId,
          name: users.name,
          email: users.email,
          role: users.role,
          preferredUnit: users.preferredUnit,
          heightCm: users.heightCm,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(query.pageSize)
        .offset((query.page - 1) * query.pageSize),
      db.select({ value: count() }).from(users).where(where),
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
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!row) {
      return context.json({ error: "User not found" }, 404);
    }
    return context.json({ data: row });
  })
  .patch("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());
    const body = userUpdateSchema.parse(await context.req.json());
    const [row] = await db
      .update(users)
      .set(body)
      .where(eq(users.id, id))
      .returning();

    if (!row) {
      return context.json({ error: "User not found" }, 404);
    }
    return context.json({ data: row });
  })
  .delete("/:id", async (context) => {
    const { id } = idParam.parse(context.req.param());

    if (id === context.get("user").id) {
      return context.json({ error: "You cannot delete your own account" }, 400);
    }

    const [row] = await db.delete(users).where(eq(users.id, id)).returning();

    if (!row) {
      return context.json({ error: "User not found" }, 404);
    }
    return context.json({ data: { id: row.id } });
  });
