import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ChevronRight, History, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteWorkout, useMyWorkouts } from "@/lib/my-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/history")({
  component: HistoryPage,
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

function HistoryPage() {
  const [page, setPage] = useState(1);
  const history = useMyWorkouts({ page });
  const deleteWorkout = useDeleteWorkout();
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressOrigin = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  const totalPages = history.data
    ? Math.max(1, Math.ceil(history.data.total / history.data.pageSize))
    : 1;
  const workouts = history.data?.data ?? [];

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressOrigin.current = null;
  };
  useEffect(
    () => () => {
      if (longPressTimer.current !== null) {
        clearTimeout(longPressTimer.current);
      }
    },
    [],
  );

  /** Long-press (touch only) drops straight into selection with this row chosen. */
  const activateLongPress = (id: number) => {
    if (selecting) {
      return;
    }
    suppressClick.current = true;
    // Clear the guard in case the browser suppresses the trailing click.
    window.setTimeout(() => {
      suppressClick.current = false;
    }, 600);
    navigator.vibrate?.(10);
    setSelecting(true);
    setSelected(new Set([id]));
  };
  const isCoarsePointer = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;

  const rowPointerHandlers = (id: number) => ({
    onPointerDown: (event: {
      pointerType: string;
      clientX: number;
      clientY: number;
    }) => {
      if (selecting || event.pointerType === "mouse") {
        return;
      }
      longPressOrigin.current = { x: event.clientX, y: event.clientY };
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        activateLongPress(id);
      }, 500);
    },
    onPointerMove: (event: { clientX: number; clientY: number }) => {
      const origin = longPressOrigin.current;
      if (longPressTimer.current === null || !origin) {
        return;
      }
      if (Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 12) {
        clearLongPress();
      }
    },
    onPointerUp: clearLongPress,
    onPointerCancel: clearLongPress,
    onPointerLeave: clearLongPress,
    onContextMenu: (event: { preventDefault: () => void }) => {
      if (!isCoarsePointer()) {
        return;
      }
      event.preventDefault();
      clearLongPress();
      activateLongPress(id);
    },
  });

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

  const runDelete = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      return;
    }
    toast.promise(
      (async () => {
        for (const id of ids) {
          await deleteWorkout.mutateAsync(id);
        }
        if (page > 1 && ids.length >= workouts.length) {
          setPage((current) => Math.max(1, current - 1));
        }
        exitSelect();
      })(),
      {
        loading: `Deleting ${plural(ids.length, "session")}…`,
        success: () => `Deleted ${plural(ids.length, "session")}`,
        error: (error) => {
          exitSelect();
          return navigator.onLine
            ? error instanceof Error
              ? error.message
              : "Couldn't delete sessions"
            : "Offline — deletions will sync when you're back online";
        },
      },
    );
  };

  const selectedWorkouts = workouts.filter((workout) =>
    selected.has(workout.id),
  );
  const includesInProgress = selectedWorkouts.some(
    (workout) => workout.status === "in_progress",
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">EVERY SESSION IS PART OF YOUR STORY</p>
          <h1 className="text-2xl font-bold tracking-tight">
            The work you put in.
          </h1>
          <p className="text-sm text-muted-foreground">
            Every session you've logged.
          </p>
        </div>
        {!selecting && workouts.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelecting(true)}
          >
            <Check className="size-4" />
            Select
          </Button>
        )}
      </div>

      {selecting && (
        <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
          <span className="text-sm font-medium">
            {plural(selected.size, "session")} selected
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={deleteWorkout.isPending}
              onClick={exitSelect}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={selected.size === 0 || deleteWorkout.isPending}
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {history.isError && (
        <div className="inline-error">
          Couldn’t load history.{" "}
          <button type="button" onClick={() => history.refetch()}>
            Retry
          </button>
        </div>
      )}
      {history.isPending && (
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      )}

      <div className="space-y-3 [&>a]:block">
        {workouts.map((workout) => {
          const isSelected = selected.has(workout.id);
          return (
            <Link
              key={workout.id}
              to="/app/history/$id"
              params={{ id: String(workout.id) }}
              onClick={(event) => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  event.preventDefault();
                  return;
                }
                if (selecting) {
                  event.preventDefault();
                  toggle(workout.id);
                }
              }}
              {...rowPointerHandlers(workout.id)}
            >
              <Card
                className={cn(
                  "transition-colors hover:bg-muted/50",
                  selecting &&
                    isSelected &&
                    "border-primary bg-muted/60 hover:bg-muted/60",
                )}
              >
                <CardContent className="flex items-center gap-3 py-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl",
                      selecting && isSelected ? "bg-primary/10" : "bg-muted",
                    )}
                  >
                    {selecting ? (
                      <SelectionDot selected={isSelected} />
                    ) : (
                      <History className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {workout.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(workout.startedAt).toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <Badge
                    variant={
                      workout.status === "completed" ? "default" : "secondary"
                    }
                  >
                    {workout.status.replace("_", " ")}
                  </Badge>
                  {!selecting && (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {history.data && workouts.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No workouts yet.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              disabled={page <= 1 || selecting}
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => current - 1)}
            >
              Previous
            </Button>
            <Button
              disabled={page >= totalPages || selecting}
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${plural(selected.size, "session")}?`}
        description={
          <>
            This permanently removes {plural(selected.size, "session")} and
            their logged sets. This can't be undone.
            {includesInProgress && (
              <> One is still in progress — it will be discarded too.</>
            )}
          </>
        }
        confirmLabel={`Delete ${plural(selected.size, "session")}`}
        loading={deleteWorkout.isPending}
        onConfirm={runDelete}
      />
    </div>
  );
}
