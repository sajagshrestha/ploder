import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";

import { db } from "#/db";
import { users } from "#/db/schema";

export type AppEnv = {
  Variables: {
    user: typeof users.$inferSelect;
  };
};

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function upsertUser(input: {
  clerkId: string;
  email: string;
  name: string;
}): Promise<typeof users.$inferSelect> {
  const isAdmin = adminEmails().includes(input.email.toLowerCase());

  const [row] = await db
    .insert(users)
    .values({
      clerkId: input.clerkId,
      email: input.email,
      name: input.name || input.email,
      role: isAdmin ? "admin" : "user",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { clerkId: input.clerkId },
    })
    .returning();

  if (!row) {
    throw new Error("Failed to upsert user");
  }

  if (isAdmin && row.role !== "admin") {
    const [promoted] = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.id, row.id))
      .returning();
    return promoted ?? row;
  }

  return row;
}

export async function requireAuth(context: Context<AppEnv>, next: Next) {
  const authState = await auth();

  if (!authState?.userId) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, authState.userId))
    .limit(1);

  let user = existing;

  if (!user) {
    const client = clerkClient();
    const clerkUser = await client.users.getUser(authState.userId);
    const email =
      clerkUser.primaryEmailAddress?.emailAddress ??
      clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      return context.json({ error: "User account has no email address" }, 403);
    }

    const name = [clerkUser.firstName, clerkUser.lastName]
      .filter(Boolean)
      .join(" ");

    user = await upsertUser({ clerkId: authState.userId, email, name });
  }

  context.set("user", user);
  await next();
}

export async function requireAdmin(context: Context<AppEnv>, next: Next) {
  const user = context.get("user");

  if (user.role !== "admin") {
    return context.json({ error: "Forbidden" }, 403);
  }

  await next();
}
