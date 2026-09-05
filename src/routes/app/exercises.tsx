import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyExercises } from "@/lib/my-queries";

export const Route = createFileRoute("/app/exercises")({
  component: LibraryPage,
});

const MUSCLE_GROUPS = [
  "upper arms",
  "upper legs",
  "back",
  "waist",
  "chest",
  "shoulders",
  "lower legs",
  "lower arms",
  "cardio",
  "neck",
] as const;

function LibraryPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [muscle, setMuscle] = useState<string | null>(null);
  const library = useMyExercises({
    search: search || undefined,
    muscleGroup: muscle ?? undefined,
    pageSize: 24,
    page,
  });

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">BUILD YOUR MOVEMENT TOOLKIT</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Find your next movement.
        </h1>
        <p className="text-sm text-muted-foreground">
          Browse every movement your coaches programmed.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search exercises…"
          value={search}
          aria-label="Search exercises"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            muscle === null
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          type="button"
          aria-pressed={muscle === null}
          onClick={() => {
            setMuscle(null);
            setPage(1);
          }}
        >
          All
        </button>
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              muscle === group
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
            type="button"
            aria-pressed={muscle === group}
            onClick={() => {
              setMuscle(muscle === group ? null : group);
              setPage(1);
            }}
          >
            {group}
          </button>
        ))}
      </div>

      {library.isError && (
        <div className="inline-error">
          Couldn’t load exercises.{" "}
          <button type="button" onClick={() => library.refetch()}>
            Retry
          </button>
        </div>
      )}
      {library.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      <div className="library-grid">
        {library.data?.data.map((exercise) => (
          <Card key={exercise.id}>
            <CardContent className="flex items-center gap-3 py-3">
              {(exercise.gifUrl ?? exercise.imageUrl) ? (
                <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-white">
                  <img
                    alt={exercise.name}
                    className="size-full object-cover mix-blend-multiply"
                    loading="lazy"
                    src={exercise.gifUrl ?? exercise.imageUrl ?? ""}
                  />
                </div>
              ) : (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Dumbbell className="size-5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {exercise.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {exercise.muscleGroup} · {exercise.equipment}
                </p>
              </div>
              {exercise.isCompound && (
                <Badge variant="secondary">Compound</Badge>
              )}
            </CardContent>
          </Card>
        ))}
        {library.data?.data.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No exercises match your search.
          </p>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Exercise images © Gym visual — https://gymvisual.com/
      </p>
      {library.data && library.data.total > library.data.pageSize && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {library.data.total} exercises · Page {page} of{" "}
            {Math.ceil(library.data.total / library.data.pageSize)}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * library.data.pageSize >= library.data.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
