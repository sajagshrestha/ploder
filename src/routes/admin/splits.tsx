import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type SplitDetail,
  useCreateSplit,
  useCreateSplitDay,
  useCreateSplitDayExercise,
  useDeleteSplit,
  useDeleteSplitDay,
  useDeleteSplitDayExercise,
  useExercises,
  useSplit,
  useSplits,
} from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/splits")({
  component: AdminSplits,
});

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function SelectionDot({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-3" strokeWidth={3} />
    </span>
  ) : (
    <span className="size-5 rounded-full border-2 border-muted-foreground/40" />
  );
}

function AdminSplits() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [confirmBulk, setConfirmBulk] = useState(false);

  const splits = useSplits();
  const createSplit = useCreateSplit();
  const deleteSplit = useDeleteSplit();

  const rows = splits.data?.data ?? [];

  const toggle = (id: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const runBulkDelete = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      return;
    }
    toast.promise(
      (async () => {
        for (const id of ids) {
          await deleteSplit.mutateAsync(id);
        }
        setExpandedId((current) =>
          current !== null && ids.includes(current) ? null : current,
        );
        exitSelect();
      })(),
      {
        loading: `Deleting ${plural(ids.length, "split")}…`,
        success: () => `Deleted ${plural(ids.length, "split")}`,
        error: (error) => {
          exitSelect();
          return error instanceof Error
            ? error.message
            : "Couldn't delete splits";
        },
      },
    );
  };

  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRAINING PLANS</p>
          <h1>
            Plans members follow<span className="heading-dot">.</span>
          </h1>
          <p>Users clone these templates into their own training splits.</p>
        </div>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">NEW TEMPLATE</p>
            <h2>Add split template</h2>
          </div>
        </div>
        <Card style={{ border: 0, boxShadow: "none", padding: 0 }}>
          <CardHeader>
            <CardTitle className="text-base">Add split template</CardTitle>
            <CardDescription>
              Give the split a name, then add training days and exercises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                toast.promise(
                  createSplit.mutateAsync({
                    name: name.trim(),
                    description: description.trim() || undefined,
                  }),
                  {
                    loading: "Creating…",
                    success: () => {
                      setName("");
                      setDescription("");
                      return "Split created";
                    },
                    error: (error) => error.message,
                  },
                );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="split-name">Name</Label>
                <Input
                  className="w-56"
                  id="split-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="split-description">Description</Label>
                <Input
                  id="split-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <Button disabled={createSplit.isPending} type="submit">
                <Plus className="size-4" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {splits.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {!selecting && rows.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelecting(true)}
              >
                <Check className="size-4" />
                Select
              </Button>
            </div>
          )}
          {selecting && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <span className="text-sm font-medium">
                {plural(selected.size, "split")} selected
              </span>
              <div className="flex gap-2">
                <Button
                  disabled={deleteSplit.isPending}
                  size="sm"
                  variant="ghost"
                  onClick={exitSelect}
                >
                  Cancel
                </Button>
                <Button
                  disabled={selected.size === 0 || deleteSplit.isPending}
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmBulk(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
          {rows.map((row) => {
            const isSelected = selected.has(row.id);
            return (
              <Card
                key={row.id}
                className={cn(
                  selecting && isSelected && "border-primary bg-muted/50",
                )}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {selecting && (
                        <label className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isSelected}
                            onChange={() => toggle(row.id)}
                            aria-label={`Select split ${row.name}`}
                          />
                          <span className="rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                            <SelectionDot selected={isSelected} />
                          </span>
                        </label>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{row.name}</CardTitle>
                        <CardDescription>{row.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        disabled={selecting}
                        onClick={() =>
                          setExpandedId(expandedId === row.id ? null : row.id)
                        }
                        size="sm"
                        variant="outline"
                      >
                        {expandedId === row.id ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                        Days
                      </Button>
                      <Button
                        disabled={selecting}
                        onClick={() =>
                          setDeleting({ id: row.id, name: row.name })
                        }
                        size="sm"
                        variant="outline"
                        aria-label={`Delete split ${row.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {expandedId === row.id && (
                  <CardContent className="border-t pt-4">
                    <SplitDays splitId={row.id} />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title={`Delete ${plural(selected.size, "split")}?`}
        description="These split templates and all their training days will be permanently removed. Users who cloned them keep their own copies."
        confirmLabel={`Delete ${plural(selected.size, "split")}`}
        loading={deleteSplit.isPending}
        onConfirm={() => {
          setConfirmBulk(false);
          runBulkDelete();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete split "${deleting.name}"?` : "Delete split?"}
        description="This split template and all its training days will be permanently removed. Users who cloned it keep their own copies."
        confirmLabel="Delete split"
        loading={deleteSplit.isPending}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          toast.promise(deleteSplit.mutateAsync(id), {
            loading: "Deleting…",
            success: () => {
              if (expandedId === id) {
                setExpandedId(null);
              }
              setDeleting(null);
              return "Split deleted";
            },
            error: (error) => {
              setDeleting(null);
              return error.message;
            },
          });
        }}
      />
    </div>
  );
}

function SplitDays({ splitId }: { splitId: number }) {
  const { data, isPending } = useSplit(splitId);
  const createDay = useCreateSplitDay();
  const [dayName, setDayName] = useState("");

  if (isPending || !data) {
    return <Skeleton className="h-20 w-full" />;
  }

  return (
    <div className="space-y-3">
      {data.data.days.map((day) => (
        <DayCard key={day.id} day={day} />
      ))}

      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          toast.promise(
            createDay.mutateAsync({
              splitId,
              name: dayName.trim(),
              orderIndex: data.data.days.length,
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
        <Button disabled={createDay.isPending} type="submit" variant="outline">
          <Plus className="size-4" />
          Add day
        </Button>
      </form>
    </div>
  );
}

function DayCard({ day }: { day: SplitDetail["days"][number] }) {
  const exercises = useExercises({ page: 1, pageSize: 100 });
  const createEntry = useCreateSplitDayExercise();
  const deleteEntry = useDeleteSplitDayExercise();
  const deleteDay = useDeleteSplitDay();

  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState(3);
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);
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

      <ul className="mb-3 space-y-1.5 text-sm">
        {day.exercises.map((entry) => (
          <li
            key={entry.splitDayExerciseId}
            className="flex items-center gap-2"
          >
            <span className="flex-1">
              <span className="font-medium">{entry.exerciseName}</span>
              <span className="ml-2 text-muted-foreground">
                {entry.targetSets} sets × {entry.targetRepMin}–
                {entry.targetRepMax} reps
              </span>
            </span>
            <Button
              disabled={deleteEntry.isPending}
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

      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!exerciseId) {
            return;
          }
          toast.promise(
            createEntry.mutateAsync({
              dayId: day.id,
              exerciseId: Number(exerciseId),
              orderIndex: day.exercises.length,
              targetSets: sets,
              targetRepMin: repMin,
              targetRepMax: repMax,
            }),
            {
              loading: "Adding…",
              success: () => {
                setExerciseId("");
                return "Exercise added";
              },
              error: (error) => error.message,
            },
          );
        }}
      >
        <Select value={exerciseId} onValueChange={setExerciseId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Add exercise…" />
          </SelectTrigger>
          <SelectContent>
            {exercises.data?.data.map((exercise) => (
              <SelectItem key={exercise.id} value={String(exercise.id)}>
                {exercise.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <Label className="text-xs">Sets</Label>
          <Input
            className="w-16"
            max={20}
            min={1}
            type="number"
            value={sets}
            onChange={(event) => setSets(Number(event.target.value))}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Reps</Label>
          <div className="flex items-center gap-1">
            <Input
              className="w-16"
              min={1}
              type="number"
              value={repMin}
              onChange={(event) => setRepMin(Number(event.target.value))}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              className="w-16"
              min={1}
              type="number"
              value={repMax}
              onChange={(event) => setRepMax(Number(event.target.value))}
            />
          </div>
        </div>
        <Button
          disabled={!exerciseId || createEntry.isPending}
          size="sm"
          type="submit"
          variant="outline"
        >
          <Plus className="size-4" />
          Add
        </Button>
      </form>
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
