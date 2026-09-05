import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe, useMyWorkout } from "@/lib/my-queries";

export const Route = createFileRoute("/app/history/$id")({
  component: WorkoutDetailPage,
});

function WorkoutDetailPage() {
  const { id } = Route.useParams();
  const workoutId = Number(id);
  const workout = useMyWorkout(Number.isFinite(workoutId) ? workoutId : null);
  const me = useMe();
  const unit = me.data?.data.preferredUnit ?? "kg";

  if (workout.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (workout.isError || !workout.data) {
    return (
      <div className="space-y-2 pt-8 text-center">
        <p className="font-semibold">Workout not found</p>
        <Button asChild variant="outline">
          <Link to="/app/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const data = workout.data.data;
  const totalSets = data.exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const totalVolume = data.exercises.reduce(
    (total, exercise) =>
      total +
      exercise.sets.reduce(
        (sum, set) => sum + Number(set.weight) * set.reps,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-4">
      <Button asChild className="-ml-2" size="sm" variant="ghost">
        <Link to="/app/history">
          <ArrowLeft className="size-4" />
          History
        </Link>
      </Button>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
            {data.name}
          </h1>
          <Badge
            variant={data.status === "completed" ? "default" : "secondary"}
          >
            {data.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(data.startedAt).toLocaleString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="px-3 py-4 text-center">
            <p className="text-xl font-bold">{totalSets}</p>
            <p className="text-[11px] text-muted-foreground">Sets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-3 py-4 text-center">
            <p className="text-xl font-bold">
              {Math.round(totalVolume).toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground">Volume ({unit})</p>
          </CardContent>
        </Card>
      </div>

      {data.notes && (
        <Card>
          <CardContent className="py-3 text-sm">{data.notes}</CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data.exercises.map((exercise) => (
          <Card key={exercise.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {exercise.exerciseName ?? "Exercise"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {exercise.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  <span className="font-semibold">#{set.setNumber}</span>
                  {set.isWarmup && (
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                      WARMUP
                    </span>
                  )}
                  <span>
                    {set.weight} {unit} × {set.reps}
                  </span>
                  {set.rpe && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      RPE {set.rpe}
                    </span>
                  )}
                </div>
              ))}
              {exercise.sets.length === 0 && (
                <p className="text-sm text-muted-foreground">No sets logged.</p>
              )}
            </CardContent>
          </Card>
        ))}
        {data.exercises.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No exercises in this workout.
          </p>
        )}
      </div>
    </div>
  );
}
