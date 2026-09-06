import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Download } from "lucide-react";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { DetailPageSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useMe, useMyWorkout } from "@/lib/my-queries";
import {
  csvCell,
  downloadCsv,
  historySearchSchema,
  workoutDuration,
} from "@/lib/workout-history";

export const Route = createFileRoute("/app/history/$id")({
  validateSearch: historySearchSchema,
  component: WorkoutDetailPage,
});

function WorkoutDetailPage() {
  const { id } = Route.useParams();
  const filters = Route.useSearch();
  const workoutId = Number(id);
  const workout = useMyWorkout(
    Number.isInteger(workoutId) && workoutId > 0 ? workoutId : null,
  );
  const unit = useMe().data?.data.preferredUnit ?? "kg";
  const back = (
    <Button asChild className="-ml-2" size="sm" variant="ghost">
      <Link to="/app/history" search={filters}>
        <ArrowLeft className="size-4" />
        Back to history
      </Link>
    </Button>
  );

  if (workout.isPending && Number.isInteger(workoutId) && workoutId > 0)
    return <DetailPageSkeleton />;
  if (workout.isError || !workout.data)
    return (
      <div className="space-y-4">
        {back}
        <div className="rounded-2xl border p-8 text-center">
          <h1 className="font-semibold">Couldn't load this workout</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been deleted, or your connection may have dropped.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => workout.refetch()}
          >
            Try again
          </Button>
        </div>
      </div>
    );

  const data = workout.data.data;
  const loggedSets = data.exercises.flatMap((exercise) =>
    exercise.sets.filter((set) => set.completed),
  );
  const totalVolume = loggedSets.reduce(
    (sum, set) => sum + Number(set.weight) * set.reps,
    0,
  );
  const totalReps = loggedSets.reduce((sum, set) => sum + set.reps, 0);
  const warmups = loggedSets.filter((set) => set.isWarmup).length;

  function exportSets() {
    const rows = [
      [
        "Workout",
        "Date",
        "Exercise",
        "Target muscle",
        "Set",
        `Weight (${unit})`,
        "Reps",
        "RPE",
        "Warmup",
        "Completed",
        "Exercise notes",
      ],
      ...data.exercises.flatMap((exercise) =>
        exercise.sets.map((set) => [
          data.name,
          data.startedAt,
          exercise.exerciseName ?? "Exercise",
          exercise.target ?? "",
          set.setNumber,
          set.weight,
          set.reps,
          set.rpe ?? "",
          set.isWarmup ? "Yes" : "No",
          set.completed ? "Yes" : "No",
          exercise.notes ?? "",
        ]),
      ),
    ];
    downloadCsv(
      rows.map((row) => row.map(csvCell).join(",")).join("\r\n"),
      `workout-${data.id}-sets.csv`,
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-2">
        {back}
        <Button variant="outline" size="sm" onClick={exportSets}>
          <Download className="size-4" />
          Export sets
        </Button>
      </div>
      <header className="space-y-3">
        <Badge
          variant="secondary"
          className={
            data.status === "completed"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-amber-700 dark:text-amber-400"
          }
        >
          {data.status === "completed" ? "Completed" : "In progress"}
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <CalendarDays className="mt-0.5 size-4 shrink-0" />
          {new Date(data.startedAt).toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
        {data.completedAt && (
          <p className="text-xs text-muted-foreground">
            Finished{" "}
            {new Date(data.completedAt).toLocaleString(undefined, {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
        )}
        {data.status === "in_progress" && (
          <Button asChild size="sm">
            <Link to="/app/train">Continue workout</Link>
          </Button>
        )}
      </header>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Duration", workoutDuration(data)],
          ["Exercises", data.exercises.length],
          ["Logged sets", loggedSets.length],
          [`Volume (${unit})`, Math.round(totalVolume).toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-card p-4">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-2xl font-semibold tabular-nums">
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground">
        {totalReps} total reps · {warmups} warmup{" "}
        {warmups === 1 ? "set" : "sets"}. Totals include completed sets and
        warmups.
      </p>
      {data.notes && (
        <section className="space-y-2 rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold">Session notes</h2>
          <p className="whitespace-pre-line text-sm text-muted-foreground">
            {data.notes}
          </p>
        </section>
      )}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">
          Exercise breakdown{" "}
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {data.exercises.length}
          </span>
        </h2>
        {data.exercises.map((exercise, index) => {
          const completed = exercise.sets.filter((set) => set.completed);
          const volume = completed.reduce(
            (sum, set) => sum + Number(set.weight) * set.reps,
            0,
          );
          return (
            <Card key={exercise.id} className="gap-0 overflow-hidden py-0">
              <CardHeader className="flex flex-row items-center gap-3 px-4 py-4 sm:px-5">
                <ExerciseThumbnail
                  src={exercise.imageUrl || exercise.gifUrl}
                  exerciseId={exercise.exerciseId}
                  name={exercise.exerciseName ?? "Exercise"}
                  className="exercise-thumbnail !size-14"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="text-base font-semibold">
                    <span className="mr-2 text-sm font-normal text-muted-foreground">
                      {index + 1}.
                    </span>
                    {exercise.exerciseName ?? "Exercise"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {exercise.target && (
                      <Badge variant="outline" className="capitalize">
                        {exercise.target}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {completed.length} logged sets ·{" "}
                      {Math.round(volume).toLocaleString()} {unit} volume
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-5">
                {exercise.notes && (
                  <p className="mb-3 whitespace-pre-line text-sm text-muted-foreground">
                    {exercise.notes}
                  </p>
                )}
                {exercise.sets.length ? (
                  <table className="w-full text-left text-sm">
                    <caption className="sr-only">
                      Sets for {exercise.exerciseName}
                    </caption>
                    <thead className="border-y bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="py-2 pl-2 font-medium">
                          Set
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-right font-medium"
                        >
                          Weight ({unit})
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-right font-medium"
                        >
                          Reps
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-2 text-right font-medium"
                        >
                          RPE
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {exercise.sets.map((set) => (
                        <tr
                          key={set.id}
                          className={
                            set.completed ? "" : "text-muted-foreground"
                          }
                        >
                          <td className="py-3 pl-2">
                            <span className="font-medium">{set.setNumber}</span>
                            {set.isWarmup && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">
                                Warmup
                              </span>
                            )}
                            {!set.completed && (
                              <span className="block text-[10px]">
                                Not logged
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3 text-right tabular-nums">
                            {Number(set.weight).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-2 py-3 text-right tabular-nums">
                            {set.reps}
                          </td>
                          <td className="px-2 py-3 text-right tabular-nums">
                            {set.rpe ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
                    No sets were logged for this exercise.
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {!data.exercises.length && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No exercises were added to this session.
          </p>
        )}
      </section>
    </div>
  );
}
