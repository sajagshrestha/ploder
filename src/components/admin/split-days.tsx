import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/ui/search-bar";
import {
  type SplitDetail,
  useCreateSplitDay,
  useCreateSplitDayExercise,
  useDeleteSplitDay,
  useDeleteSplitDayExercise,
  useExercises,
  useSplit,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function SplitDays({ splitId }: { splitId: number }) {
  const { data, isPending, isError, refetch } = useSplit(splitId);
  const createDay = useCreateSplitDay();
  const [dayName, setDayName] = useState("");

  if (isError)
    return (
      <p role="alert">
        Couldn’t load days.{" "}
        <Button variant="link" onClick={() => refetch()}>
          Try again
        </Button>
      </p>
    );

  if (isPending || !data) {
    return <ListSkeleton count={2} tall />;
  }

  return (
    <div className="space-y-3">
      {data.data.days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          toast.promise(
            createDay.mutateAsync({
              splitId,
              name: dayName.trim(),
              orderIndex:
                Math.max(-1, ...data.data.days.map((day) => day.orderIndex)) +
                1,
            }),
            {
              loading: "Adding day…",
              success: () => {
                setDayName("");
                return "Day added";
              },
              error: (error) => error.message,
            },
          );
        }}
      >
        <div className="w-56 space-y-1.5">
          <Label htmlFor={`day-name-${splitId}`}>New day</Label>
          <Input
            id={`day-name-${splitId}`}
            placeholder="e.g. Push A"
            required
            value={dayName}
            onChange={(event) => setDayName(event.target.value)}
          />
        </div>
        <Button
          disabled={createDay.isPending || !dayName.trim()}
          type="submit"
          variant="outline"
        >
          <Plus className="size-4" />
          Add day
        </Button>
      </form>
    </div>
  );
}

function DayCard({ day }: { day: SplitDetail["days"][number] }) {
  const deleteEntry = useDeleteSplitDayExercise();
  const deleteDay = useDeleteSplitDay();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<number[]>([]);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(false);
  const [deletingEntry, setDeletingEntry] = useState<{
    id: number;
    name: string | null;
  } | null>(null);

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{day.name}</p>
          <Badge variant="secondary">{day.exercises.length} exercises</Badge>
        </div>
        <Button
          onClick={() => setConfirmDeleteDay(true)}
          size="sm"
          variant="ghost"
          aria-label={`Delete day ${day.name}`}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>

      {day.exercises.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() =>
              setSelectedEntries(
                selectedEntries.length === day.exercises.length
                  ? []
                  : day.exercises.map((entry) => entry.splitDayExerciseId),
              )
            }
          >
            Select / clear all
          </Button>
          {selectedEntries.length > 0 && (
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => setConfirmRemove(true)}
            >
              Remove {selectedEntries.length} selected
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {day.exercises.reduce(
              (total, entry) => total + entry.targetSets,
              0,
            )}{" "}
            total sets
          </span>
        </div>
      )}
      <ul className="mb-3 space-y-1.5 text-sm">
        {day.exercises.map((entry) => (
          <li
            key={entry.splitDayExerciseId}
            className="flex items-center gap-2"
          >
            <input
              type="checkbox"
              className="size-4 accent-primary"
              disabled={busy}
              aria-label={`Select ${entry.exerciseName}`}
              checked={selectedEntries.includes(entry.splitDayExerciseId)}
              onChange={(event) =>
                setSelectedEntries((current) =>
                  event.target.checked
                    ? [...current, entry.splitDayExerciseId]
                    : current.filter((id) => id !== entry.splitDayExerciseId),
                )
              }
            />
            <ExerciseThumbnail
              src={entry.imageUrl ?? entry.gifUrl}
              exerciseId={entry.exerciseId}
              name={entry.exerciseName ?? "Exercise"}
            />
            <span className="min-w-0 flex-1">
              <span className="font-medium">{entry.exerciseName}</span>
              <Badge variant="outline" className="ml-2 capitalize">
                {entry.target || "Target muscle"}
              </Badge>
              <span className="block text-xs text-muted-foreground">
                {entry.targetSets} sets × {entry.targetRepMin}–
                {entry.targetRepMax} reps
              </span>
            </span>
            <Button
              disabled={deleteEntry.isPending || busy}
              onClick={() =>
                setDeletingEntry({
                  id: entry.splitDayExerciseId,
                  name: entry.exerciseName,
                })
              }
              size="sm"
              variant="ghost"
              aria-label={`Remove ${entry.exerciseName ?? "exercise"} from ${day.name}`}
            >
              <Trash2 className="size-3.5 text-destructive" />
            </Button>
          </li>
        ))}
        {day.exercises.length === 0 && (
          <li className="text-muted-foreground">No exercises yet.</li>
        )}
      </ul>

      <Button
        variant="outline"
        onClick={() => setPickerOpen(!pickerOpen)}
        aria-expanded={pickerOpen}
      >
        <Plus className="size-4" />
        {pickerOpen ? "Close exercise picker" : "Add exercises"}
      </Button>
      {pickerOpen && <ExercisePicker day={day} />}
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${plural(selectedEntries.length, "exercise")}?`}
        description="These exercises will be removed from this day. The exercise library will not be changed."
        confirmLabel="Remove selected"
        loading={busy}
        onConfirm={() => {
          setBusy(true);
          toast.promise(
            (async () => {
              for (const id of selectedEntries) {
                await deleteEntry.mutateAsync(id);
                setSelectedEntries((current) =>
                  current.filter((value) => value !== id),
                );
              }
            })().finally(() => setBusy(false)),
            {
              loading: "Removing exercises…",
              success: "Selected exercises removed",
              error:
                "Some exercises could not be removed. Remaining items are still selected; try again.",
            },
          );
        }}
      />
      <ConfirmDialog
        open={confirmDeleteDay}
        onOpenChange={setConfirmDeleteDay}
        title={`Delete day "${day.name}"?`}
        description="This training day and all its exercises will be permanently removed. This can't be undone."
        confirmLabel="Delete day"
        loading={deleteDay.isPending}
        onConfirm={() => {
          toast.promise(deleteDay.mutateAsync(day.id), {
            loading: "Deleting…",
            success: () => {
              setConfirmDeleteDay(false);
              return "Day deleted";
            },
            error: (error) => {
              setConfirmDeleteDay(false);
              return error.message;
            },
          });
        }}
      />
      <ConfirmDialog
        open={deletingEntry !== null}
        onOpenChange={(open) => !open && setDeletingEntry(null)}
        title={
          deletingEntry?.name
            ? `Remove "${deletingEntry.name}"?`
            : "Remove this exercise?"
        }
        description={`This exercise will be removed from "${day.name}". This can't be undone.`}
        confirmLabel="Remove exercise"
        loading={deleteEntry.isPending}
        onConfirm={() => {
          if (!deletingEntry) return;
          toast.promise(deleteEntry.mutateAsync(deletingEntry.id), {
            loading: "Removing…",
            success: () => {
              setSelectedEntries((current) =>
                current.filter((id) => id !== deletingEntry.id),
              );
              setDeletingEntry(null);
              return "Exercise removed";
            },
            error: (error) => {
              setDeletingEntry(null);
              return error.message;
            },
          });
        }}
      />
    </div>
  );
}

function ExercisePicker({ day }: { day: SplitDetail["days"][number] }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [selected, setSelected] = useState<Map<number, string>>(
    () => new Map(),
  );
  const [sets, setSets] = useState(3);
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);
  const [busy, setBusy] = useState(false);
  const createEntry = useCreateSplitDayExercise();
  useEffect(() => {
    const timer = setTimeout(
      () => setQuery({ search: search.trim(), page: 1 }),
      250,
    );
    return () => clearTimeout(timer);
  }, [search]);
  const exercises = useExercises({ ...query, pageSize: 12 });
  const existing = new Set(day.exercises.map((entry) => entry.exerciseId));
  const available = (exercises.data?.data ?? []).filter(
    (exercise) => !existing.has(exercise.id),
  );
  const waiting = search.trim() !== query.search || exercises.isFetching;
  const valid =
    Number.isInteger(sets) &&
    sets >= 1 &&
    sets <= 20 &&
    Number.isInteger(repMin) &&
    repMin >= 1 &&
    Number.isInteger(repMax) &&
    repMax >= repMin &&
    repMax <= 100;
  const toggle = (id: number, name: string) =>
    setSelected((current) => {
      const next = new Map(current);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
      return next;
    });
  return (
    <form
      className="mt-4 space-y-4 rounded-xl border bg-muted/25 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid || busy || selected.size === 0) return;
        setBusy(true);
        const ids = [...selected.keys()].filter((id) => !existing.has(id));
        const start =
          Math.max(-1, ...day.exercises.map((entry) => entry.orderIndex)) + 1;
        toast.promise(
          (async () => {
            for (const [index, exerciseId] of ids.entries()) {
              await createEntry.mutateAsync({
                dayId: day.id,
                exerciseId,
                orderIndex: start + index,
                targetSets: sets,
                targetRepMin: repMin,
                targetRepMax: repMax,
              });
              setSelected((current) => {
                const next = new Map(current);
                next.delete(exerciseId);
                return next;
              });
            }
          })().finally(() => setBusy(false)),
          {
            loading: "Adding exercises…",
            success: `Added ${plural(ids.length, "exercise")}`,
            error:
              "Some exercises could not be added. Remaining selections are saved; try again.",
          },
        );
      }}
    >
      <div>
        <h3 className="text-sm font-semibold">Build this training day</h3>
        <p className="text-xs text-muted-foreground">
          Search the full library, select exercises, then add them together.
        </p>
      </div>
      <fieldset disabled={busy} className="min-w-0 space-y-3">
        <SearchBar
          aria-label={`Search exercises for ${day.name}`}
          placeholder="Search exercises by name or alias…"
          value={search}
          onValueChange={setSearch}
        />
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span role="status">
            {waiting ? "Searching…" : `${exercises.data?.total ?? 0} results`}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={waiting || !available.length}
            onClick={() =>
              setSelected((current) => {
                const next = new Map(current);
                for (const exercise of available)
                  next.set(exercise.id, exercise.name);
                return next;
              })
            }
          >
            Select this page
          </Button>
        </div>
        {exercises.isError ? (
          <p role="alert" className="text-sm">
            Couldn’t load exercises.{" "}
            <Button
              type="button"
              variant="link"
              onClick={() => exercises.refetch()}
            >
              Try again
            </Button>
          </p>
        ) : waiting ? (
          <p className="py-4 text-sm text-muted-foreground">
            Loading exercises…
          </p>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-lg border bg-background">
            {exercises.data?.data.map((exercise) => (
              <label
                key={exercise.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 border-b p-3 last:border-0 hover:bg-muted/50",
                  selected.has(exercise.id) && "bg-primary/10",
                  existing.has(exercise.id) && "opacity-60",
                )}
              >
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-primary"
                  checked={selected.has(exercise.id)}
                  disabled={existing.has(exercise.id)}
                  onChange={() => toggle(exercise.id, exercise.name)}
                />
                <ExerciseThumbnail
                  src={exercise.imageUrl ?? exercise.gifUrl}
                  exerciseId={exercise.id}
                  name={exercise.name}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {exercise.name}
                  </span>
                  <span className="block text-xs capitalize text-muted-foreground">
                    {exercise.muscleGroup} · {exercise.equipment}
                  </span>
                </span>
                {existing.has(exercise.id) && (
                  <span className="text-xs">In this day</span>
                )}
              </label>
            ))}
            {exercises.data?.data.length === 0 && (
              <p className="p-5 text-center text-sm text-muted-foreground">
                No exercises found. Try a different name.
              </p>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={waiting || query.page === 1}
            onClick={() =>
              setQuery((current) => ({ ...current, page: current.page - 1 }))
            }
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {query.page} of{" "}
            {Math.max(1, Math.ceil((exercises.data?.total ?? 0) / 12))}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              waiting || query.page * 12 >= (exercises.data?.total ?? 0)
            }
            onClick={() =>
              setQuery((current) => ({ ...current, page: current.page + 1 }))
            }
          >
            Next
          </Button>
        </div>
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-2">
            {[...selected].map(([id, name]) => (
              <Button
                type="button"
                key={id}
                size="sm"
                variant="secondary"
                aria-label={`Deselect ${name}`}
                onClick={() => toggle(id, name)}
              >
                {name} ×
              </Button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-end gap-3 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor={`sets-${day.id}`}>Sets</Label>
            <Input
              id={`sets-${day.id}`}
              className="w-20"
              type="number"
              min={1}
              max={20}
              value={sets}
              onChange={(event) => setSets(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`min-${day.id}`}>Min reps</Label>
            <Input
              id={`min-${day.id}`}
              className="w-20"
              type="number"
              min={1}
              max={100}
              value={repMin}
              onChange={(event) => setRepMin(Number(event.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`max-${day.id}`}>Max reps</Label>
            <Input
              id={`max-${day.id}`}
              className="w-20"
              type="number"
              min={repMin || 1}
              max={100}
              value={repMax}
              onChange={(event) => setRepMax(Number(event.target.value))}
            />
          </div>
          <Button type="submit" disabled={!valid || selected.size === 0}>
            <Plus className="size-4" />
            {busy ? "Adding…" : `Add ${plural(selected.size, "exercise")}`}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Targets apply to all selected exercises.{" "}
          {selected.size > 0 && `${selected.size * sets} sets will be added.`}
        </p>
        {!valid && (
          <p role="alert" className="text-sm text-destructive">
            Use 1–20 sets and 1–100 reps, with max reps at least min reps.
          </p>
        )}
      </fieldset>
    </form>
  );
}
