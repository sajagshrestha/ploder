import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/admin/splits")({
  component: AdminSplits,
});

function AdminSplits() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const splits = useSplits();
  const createSplit = useCreateSplit();
  const deleteSplit = useDeleteSplit();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Split templates</h1>
          <p className="text-sm text-muted-foreground">
            Users clone these templates into their own training splits.
          </p>
        </div>
      </div>

      <Card>
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
            <Button
              disabled={createSplit.isPending}
              onClick={() => setCreating(true)}
              type="submit"
            >
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>

      {splits.isPending ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {splits.data?.data.map((row) => (
            <Card key={row.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base">{row.name}</CardTitle>
                    <CardDescription>{row.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
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
                      onClick={() => {
                        if (confirm(`Delete split "${row.name}"?`)) {
                          toast.promise(deleteSplit.mutateAsync(row.id), {
                            loading: "Deleting…",
                            success: () => {
                              if (expandedId === row.id) {
                                setExpandedId(null);
                              }
                              return "Split deleted";
                            },
                            error: (error) => error.message,
                          });
                        }
                      }}
                      size="sm"
                      variant="outline"
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
          ))}
        </div>
      )}
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

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{day.name}</p>
          <Badge variant="secondary">{day.exercises.length} exercises</Badge>
        </div>
        <Button
          onClick={() => {
            if (confirm(`Delete day "${day.name}"?`)) {
              toast.promise(deleteDay.mutateAsync(day.id), {
                loading: "Deleting…",
                success: () => "Day deleted",
                error: (error) => error.message,
              });
            }
          }}
          size="sm"
          variant="ghost"
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
                toast.promise(
                  deleteEntry.mutateAsync(entry.splitDayExerciseId),
                  {
                    loading: "Removing…",
                    success: "Exercise removed",
                    error: (error) => error.message,
                  },
                )
              }
              size="sm"
              variant="ghost"
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
    </div>
  );
}
