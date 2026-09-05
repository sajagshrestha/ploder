// Exercise catalog loader — mirrors
// https://github.com/hasaneyldrm/exercises-dataset (1,324 exercises).
// Run `pnpm db:seed` to wipe the catalog (plus splits/workouts that reference
// it) and reseed from the upstream JSON.

import { buildAlias } from "./exercise-aliases";

export const DATASET_URL =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

const MEDIA_BASE =
  "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main";

export type SeedExercise = {
  externalId: string;
  name: string;
  alias: string | null;
  muscleGroup: string;
  equipment: string;
  target: string | null;
  secondaryMuscles: string | null;
  instructionsEn: string | null;
  gifUrl: string | null;
  isCompound: boolean;
  imageUrl: string | null;
};

type DatasetExercise = {
  id: string;
  name: string;
  category: string;
  equipment: string;
  target: string;
  secondary_muscles: string[];
  instructions: Record<string, string>;
  image: string;
  gif_url: string;
};

function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
}

export async function loadDatasetExercises(): Promise<SeedExercise[]> {
  const response = await fetch(DATASET_URL);
  if (!response.ok) {
    throw new Error(`Failed to download dataset: ${response.status}`);
  }
  const dataset = (await response.json()) as DatasetExercise[];

  const seen = new Set<string>();
  return dataset.map((exercise) => {
    const baseName = titleCase(exercise.name.trim());
    // The dataset contains 6 case-insensitive duplicate names; our name
    // column is unique, so disambiguate with the dataset id.
    const key = baseName.toLowerCase();
    const name = seen.has(key) ? `${baseName} (${exercise.id})` : baseName;
    seen.add(key);

    return {
      externalId: exercise.id,
      name,
      alias: buildAlias(baseName),
      muscleGroup: exercise.category,
      equipment: exercise.equipment,
      target: exercise.target || null,
      secondaryMuscles: exercise.secondary_muscles.join(", ") || null,
      instructionsEn: exercise.instructions?.en || null,
      gifUrl: exercise.gif_url ? `${MEDIA_BASE}/${exercise.gif_url}` : null,
      isCompound: false,
      imageUrl: exercise.image ? `${MEDIA_BASE}/${exercise.image}` : null,
    };
  });
}
