import { z } from "zod";
import type { MyWorkout, MyWorkoutSummary } from "./my-queries";

export const historySearchSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).optional().catch(undefined),
  pageSize: z
    .union([z.literal(10), z.literal(25), z.literal(50)])
    .optional()
    .catch(undefined),
  search: z.string().max(120).optional().catch(undefined),
  from: z.iso.date().optional().catch(undefined),
  to: z.iso.date().optional().catch(undefined),
  status: z.enum(["completed", "in_progress"]).optional().catch(undefined),
  sort: z.enum(["newest", "oldest"]).optional().catch(undefined),
});

export type HistorySearch = z.infer<typeof historySearchSchema>;

export function localDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

// Use local midnights and an exclusive next-day end to include the entire
// selected day, including on daylight-saving transitions.
export function historyDateBounds(from?: string, to?: string) {
  const end = to ? new Date(`${to}T00:00:00`) : undefined;
  end?.setDate(end.getDate() + 1);
  return {
    from: from ? new Date(`${from}T00:00:00`).toISOString() : undefined,
    to: end?.toISOString(),
  };
}

export function workoutDuration(
  workout: Pick<MyWorkout, "startedAt" | "completedAt">,
): string {
  if (!workout.completedAt) return "In progress";
  const minutes = Math.max(
    0,
    Math.round(
      (new Date(workout.completedAt).getTime() -
        new Date(workout.startedAt).getTime()) /
        60000,
    ),
  );
  if (minutes < 1) return "<1 min";
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function csvCell(value: string | number): string {
  const text = String(value);
  // Keep user-written names/notes from becoming spreadsheet formulas.
  const safe = /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function historyCsv(workouts: MyWorkoutSummary[], unit: string): string {
  return [
    [
      "Workout",
      "Started at",
      "Completed at",
      "Status",
      "Exercises",
      "Logged sets",
      `Volume (${unit})`,
      "Notes",
    ],
    ...workouts.map((workout) => [
      workout.name,
      workout.startedAt,
      workout.completedAt ?? "",
      workout.status,
      workout.exerciseCount ?? 0,
      workout.setCount ?? 0,
      workout.volume ?? 0,
      workout.notes ?? "",
    ]),
  ]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n");
}

export function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
