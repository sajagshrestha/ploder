import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger";
import { InlineNote } from "@/components/ui/inline-note";
import { NoData } from "@/components/ui/no-data";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useInfiniteMyExercises } from "@/lib/my-queries";

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
  const [muscle, setMuscle] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search);
  const library = useInfiniteMyExercises({
    search: debouncedSearch || undefined,
    muscleGroup: muscle ?? undefined,
    pageSize: 24,
  });
  const exercises = library.data?.pages.flatMap((page) => page.data) ?? [];
  const total = library.data?.pages[0]?.total;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Exercises.</h1>
      </div>

      <SearchBar
        placeholder="Search exercises…"
        value={search}
        aria-label="Search exercises"
        onValueChange={(value) => {
          setSearch(value);
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
              }}
            >
              {group}
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {library.isError && (
        <InlineNote>
          Couldn't load.{" "}
          <button
            type="button"
            className="underline underline-offset-[3px]"
            onClick={() => library.refetch()}
          >
            Retry
          </button>
        </InlineNote>
      )}
      {library.isPending && (
        <ListSkeleton
          count={6}
          media
          className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4 max-mobile:grid-cols-1"
        />
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4 max-mobile:grid-cols-1 [&_[data-slot=card]]:overflow-hidden [&_[data-slot=card-content]]:flex-wrap">
        {exercises.map((exercise) => (
          <Card
            key={exercise.id}
            className="group min-w-0 gap-0 py-0 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--foreground)_28%,var(--border))]"
            data-exercise-card
          >
            <ExerciseThumbnail
              src={exercise.gifUrl ?? exercise.imageUrl}
              exerciseId={exercise.id}
              name={exercise.name}
              triggerClassName="block w-full rounded-none"
              className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#f5f7fa] max-mobile:aspect-[16/9] group-hover:[&_img]:scale-[1.035] [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_img]:transition-transform [&_img]:duration-200"
            />
            <CardContent className="flex min-h-[148px] flex-col gap-2.5 p-[14px]">
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">
                  {exercise.name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {exercise.muscleGroup} · {exercise.equipment}
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant="outline"
                  className="max-w-full truncate capitalize"
                >
                  {exercise.target || exercise.muscleGroup}
                </Badge>
                {exercise.isCompound && (
                  <Badge variant="secondary">Compound</Badge>
                )}
              </div>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="mt-auto w-full"
              >
                <Link to="/app/splits">Add to split</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        {exercises.length === 0 && !library.isPending && (
          <NoData
            title="No exercises found"
            description="Try another name or clear your muscle-group filter."
          >
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setMuscle(null);
              }}
            >
              Clear filters
            </Button>
          </NoData>
        )}
      </div>
      <InfiniteScrollTrigger
        hasMore={library.hasNextPage}
        isLoading={library.isFetchingNextPage}
        onLoadMore={library.fetchNextPage}
        loadedCount={exercises.length}
        totalCount={total}
      />
      <p className="text-center text-xs text-muted-foreground">
        Images © Gym visual
      </p>
    </div>
  );
}
