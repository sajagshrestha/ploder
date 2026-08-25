import { Hono } from "hono";
import { ZodError } from "zod";

import { type AppEnv, requireAuth } from "#/server/auth";
import { bodyWeightsRoutes } from "#/server/routes/bodyWeights";
import { exercisesRoutes } from "#/server/routes/exercises";
import { splitsRoutes } from "#/server/routes/splits";
import { statsRoutes } from "#/server/routes/stats";
import { usersRoutes } from "#/server/routes/users";
import { workoutsRoutes } from "#/server/routes/workouts";

export const api = new Hono<AppEnv>()
  .basePath("/api")
  .onError((error, context) => {
    if (error instanceof ZodError) {
      return context.json(
        { error: "Validation failed", issues: error.issues },
        422,
      );
    }
    console.error("[api]", error);
    return context.json({ error: "Internal server error" }, 500);
  })
  .get("/me", requireAuth, (context) => {
    const user = context.get("user");
    return context.json({ data: user });
  })
  .route("/exercises", exercisesRoutes)
  .route("/splits", splitsRoutes)
  .route("/users", usersRoutes)
  .route("/workouts", workoutsRoutes)
  .route("/body-weights", bodyWeightsRoutes)
  .route("/stats", statsRoutes);
