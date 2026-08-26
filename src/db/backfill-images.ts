import { writeFileSync } from "node:fs";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { exercises } from "./schema";
import { seedExercises } from "./seed-data/exercises";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional; DATABASE_URL may come from the environment
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const DATASET_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

type CatalogExercise = {
  name: string;
  images: string[];
  equipment: string;
  primaryMuscles: string[];
};

const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "with",
  "on",
  "of",
  "to",
  "and",
  "or",
  "in",
  "left",
  "right",
  "single",
  "one",
  "arm",
  "hand",
  "dumbbells",
  "barbell",
  "cable",
  "machine",
  "exercise",
  "grip",
  "variation",
  "standing",
  "seated",
  "alternating",
]);

// Manual catalog id overrides where auto-matching is ambiguous. Empty string = no image.
const OVERRIDES: Record<string, string> = {
  "Barbell Bench Press": "Barbell_Bench_Press_-_Medium_Grip",
  "Incline Barbell Bench Press": "Barbell_Incline_Bench_Press_-_Medium_Grip",
  "Cable Fly": "Flat_Bench_Cable_Flyes",
  "Chest Press Machine": "Cable_Chest_Press",
  "Push-Up": "Incline_Push-Up",
  Dip: "Dips_-_Triceps_Version",
  "Barbell Row": "Bent_Over_Barbell_Row",
  "Seated Cable Row": "Seated_Cable_Rows",
  "Lat Pulldown": "Wide-Grip_Lat_Pulldown",
  "Seated Dumbbell Shoulder Press": "Dumbbell_Shoulder_Press",
  "Machine Shoulder Press": "Leverage_Shoulder_Press",
  "Reverse Pec Deck": "Reverse_Flyes",
  "Skull Crusher": "EZ-Bar_Skullcrusher",
  "Leg Extension": "Leg_Extensions",
  "Dumbbell Fly": "Dumbbell_Flyes",
  "Pec Deck": "Butterfly",
  "Pendlay Row": "Bent_Over_Barbell_Row",
  "Standing Calf Raise": "Rocking_Standing_Calf_Raise",
  "Seated Calf Raise": "Seated_Calf_Raise",
  "Lying Leg Curl": "Lying_Leg_Curls",
  "Cable Curl": "",
  "Hip Abduction Machine": "",
  "Cable Woodchopper": "",
  "Chest-Supported Row": "",
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

function score(target: string, candidate: string): number {
  const a = normalize(target);
  const b = normalize(candidate);
  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  const aSet = new Set(a);
  const bSet = new Set(b);

  let overlap = 0;
  for (const word of aSet) {
    if (bSet.has(word)) {
      overlap += 1;
    }
  }

  const jaccard = overlap / Math.max(aSet.size + bSet.size - overlap, 1);
  const coverage = overlap / aSet.size;

  return 0.7 * coverage + 0.3 * jaccard;
}

async function main() {
  console.log(`Downloading dataset: ${DATASET_URL}`);
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to download dataset: ${response.status}`);
  }
  const catalog = (await response.json()) as CatalogExercise[];
  console.log(`Catalog: ${catalog.length} exercises`);

  const index = new Map<string, CatalogExercise[]>();
  for (const exercise of catalog) {
    const words = normalize(exercise.name).join(" ");
    const key = words.slice(0, 12);
    const list = index.get(key) ?? [];
    list.push(exercise);
    index.set(key, list);
  }

  let matched = 0;
  const unmatched: string[] = [];
  const imageMap: Record<string, string | null> = {};

  for (const seed of seedExercises) {
    let catalogId = OVERRIDES[seed.name];

    if (catalogId === "") {
      imageMap[seed.name] = null;
      await db
        .update(exercises)
        .set({ imageUrl: null })
        .where(eq(exercises.name, seed.name));
      console.log(`- ${seed.name}  (no image)`);
      continue;
    }

    if (!catalogId) {
      const best = catalog.reduce<{
        exercise: CatalogExercise | null;
        score: number;
      }>(
        (current, candidate) => {
          const s = score(seed.name, candidate.name);
          return s > current.score
            ? { exercise: candidate, score: s }
            : current;
        },
        { exercise: null, score: 0 },
      );
      catalogId = best.exercise && best.score >= 0.45 ? best.exercise.id : "";
      if (!catalogId) {
        imageMap[seed.name] = null;
        unmatched.push(seed.name);
        console.log(
          `✗ ${seed.name}  (best: ${best.exercise?.name ?? "-"} @ ${best.score.toFixed(2)})`,
        );
        continue;
      }
    }

    const match = catalog.find((exercise) => exercise.id === catalogId);
    if (!match) {
      imageMap[seed.name] = null;
      unmatched.push(seed.name);
      console.log(`✗ ${seed.name}  (override not found: ${catalogId})`);
      continue;
    }

    const image = match.images[0];
    const imageUrl = image ? `${IMAGE_BASE}/${image}` : null;
    imageMap[seed.name] = imageUrl;
    await db
      .update(exercises)
      .set({ imageUrl })
      .where(eq(exercises.name, seed.name));
    matched += 1;
    console.log(`✓ ${seed.name}  <=  ${match.name}`);
  }

  writeFileSync(
    "src/db/seed-data/image-map.ts",
    `// Generated by src/db/backfill-images.ts — do not edit by hand.\nexport const seedImageMap: Record<string, string | null> = ${JSON.stringify(
      imageMap,
      null,
      2,
    )};\n`,
  );

  console.log(`\nWrote seed-data/image-map.ts`);

  console.log(`\nMatched ${matched}/${seedExercises.length}`);
  if (unmatched.length > 0) {
    console.log(`Unmatched: ${unmatched.join(", ")}`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
