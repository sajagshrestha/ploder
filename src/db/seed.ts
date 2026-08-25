import { eq } from "drizzle-orm";

import { db } from "./index";
import { exercises, splitDayExercises, splitDays, splits } from "./schema";
import { seedExercises } from "./seed-data/exercises";
import { seedSplits } from "./seed-data/splits";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional; DATABASE_URL may come from the environment
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

async function seed() {
  console.log(`Seeding ${seedExercises.length} exercises...`);
  await db.insert(exercises).values(seedExercises).onConflictDoNothing();

  const exerciseRows = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises);
  const exerciseIds = new Map(exerciseRows.map((row) => [row.name, row.id]));

  const existingTemplates = await db
    .select({ name: splits.name })
    .from(splits)
    .where(eq(splits.isActive, false));

  for (const template of seedSplits) {
    if (existingTemplates.some((row) => row.name === template.name)) {
      console.log(`Split "${template.name}" already seeded, skipping.`);
      continue;
    }

    const [split] = await db
      .insert(splits)
      .values({
        userId: null,
        name: template.name,
        description: template.description,
        isActive: false,
      })
      .returning({ id: splits.id });

    for (const [dayIndex, day] of template.days.entries()) {
      const [splitDay] = await db
        .insert(splitDays)
        .values({
          splitId: split.id,
          name: day.name,
          orderIndex: dayIndex,
        })
        .returning({ id: splitDays.id });

      const rows = day.exercises.map((entry, exerciseIndex) => {
        const exerciseId = exerciseIds.get(entry.exerciseName);
        if (!exerciseId) {
          throw new Error(`Unknown exercise: ${entry.exerciseName}`);
        }
        return {
          splitDayId: splitDay.id,
          exerciseId,
          orderIndex: exerciseIndex,
          targetSets: entry.targetSets,
          targetRepMin: entry.targetRepMin,
          targetRepMax: entry.targetRepMax,
        };
      });
      await db.insert(splitDayExercises).values(rows);
    }
    console.log(
      `Seeded split "${template.name}" (${template.days.length} days).`,
    );
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
