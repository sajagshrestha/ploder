import { and, eq, lt } from "drizzle-orm";
import type { MiddlewareHandler } from "hono";

import { db } from "#/db";
import { idempotencyKeys } from "#/db/schema";
import type { AppEnv } from "#/server/auth";

const MAX_STORED_BODY = 50_000;
const RETENTION_DAYS = 7;

/**
 * Makes mutating requests safely replayable: when a request carries an
 * `Idempotency-Key` header, a repeat with the same key (same user) returns the
 * stored response instead of applying the mutation again. Powers the client's
 * offline outbox and retry logic. Must run after authentication.
 */
export const idempotency: MiddlewareHandler<AppEnv> = async (context, next) => {
  const key = context.req.header("idempotency-key");
  const method = context.req.method;
  if (
    !key ||
    (method !== "POST" && method !== "PATCH" && method !== "DELETE")
  ) {
    await next();
    return;
  }

  const user = context.get("user");
  const scope = and(
    eq(idempotencyKeys.key, key),
    eq(idempotencyKeys.userId, user.id),
  );
  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(scope)
    .limit(1);
  if (existing) {
    return new Response(existing.body, {
      status: existing.status,
      headers: {
        "Content-Type": "application/json",
        "Idempotent-Replayed": "true",
      },
    });
  }

  await next();

  if (!context.res.ok) {
    return;
  }
  try {
    const body = await context.res.clone().text();
    if (body.length > MAX_STORED_BODY) {
      return;
    }
    await db
      .insert(idempotencyKeys)
      .values({ key, userId: user.id, status: context.res.status, body })
      .onConflictDoNothing();
    // Opportunistic retention cleanup; no cron needed.
    if (Math.random() < 0.02) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
      await db
        .delete(idempotencyKeys)
        .where(lt(idempotencyKeys.createdAt, cutoff));
    }
  } catch {
    // Idempotency bookkeeping must never fail the actual mutation.
  }
};
