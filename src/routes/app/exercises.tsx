import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/ui/search-bar";
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
    <div className="space-y-4 app-exercise-library">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercises.</h1>
      </div>

      <SearchBar
        placeholder="Search exercises…"
        value={search}
        aria-label="Search exercises"
        onValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

      <ScrollArea className="w-full whitespace-nowrap" orientation="horizontal">
        <div className="flex w-max gap-2 pb-2">
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
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {library.isError && (
        <div className="inline-error">
          Couldn't load.{" "}
          <button type="button" onClick={() => library.refetch()}>
            Retry
          </button>
        </div>
      )}
      {library.isPending && (
        <ListSkeleton count={6} media className="library-grid" />
      )}

      <div className="library-grid">
        {library.data?.data.map((exercise) => (
          <Card key={exercise.id} className="gap-0 py-0">
            <CardContent className="flex items-center gap-3 py-3">
              <ExerciseThumbnail
                src={exercise.gifUrl ?? exercise.imageUrl}
                exerciseId={exercise.id}
                name={exercise.name}
                className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-white sm:size-24 [&_img]:size-full [&_img]:object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {exercise.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {exercise.muscleGroup} · {exercise.equipment}
                </p>
                <Badge
                  variant="outline"
                  className="mt-1 max-w-full truncate capitalize"
                >
                  {exercise.target || exercise.muscleGroup}
                </Badge>
              </div>
              {exercise.isCompound && (
                <Badge variant="secondary">Compound</Badge>
              )}
              <Button asChild size="sm" variant="outline" className="shrink-0">
                <Link to="/app/splits">Add</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {library.data?.data.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No matches.
          </p>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Images © Gym visual
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
