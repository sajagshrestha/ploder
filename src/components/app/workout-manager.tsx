import { GripVertical, Plus, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { DndProvider, useDrag, useDragLayer, useDrop } from "react-dnd";
import { TouchBackend } from "react-dnd-touch-backend";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useOverlayState } from "@/hooks/use-overlay-state";
import {
  type MyWorkoutExercise,
  useRemoveWorkoutExercise,
  useReorderWorkoutExercises,
} from "@/lib/my-queries";

const itemType = "workout-exercise";
const backendOptions = {
  enableMouseEvents: true,
  enableKeyboardEvents: true,
  delayTouchStart: 100,
  touchSlop: 6,
};
type DragItem = {
  id: number;
  name: string;
  index: number;
  sets: number;
  imageUrl?: string | null;
  rect: { left: number; top: number; width: number; height: number };
};

export default function WorkoutManager(props: {
  workoutId: number;
  exercises: MyWorkoutExercise[];
  onAdd: () => void;
  onSelect: (id: number) => void;
  onOrderChange: (ids: number[]) => void;
}) {
  return (
    <DndProvider backend={TouchBackend} options={backendOptions}>
      <ManagerList {...props} />
    </DndProvider>
  );
}

function ManagerList({
  workoutId,
  exercises,
  onAdd,
  onSelect,
  onOrderChange,
}: {
  workoutId: number;
  exercises: MyWorkoutExercise[];
  onAdd: () => void;
  onSelect: (id: number) => void;
  onOrderChange: (ids: number[]) => void;
}) {
  const reorder = useReorderWorkoutExercises();
  const remove = useRemoveWorkoutExercise();
  const [rows, setRows] = useState(exercises);
  const draft = useRef(exercises);
  const [removingId, setRemovingId] = useOverlayState("remove-exercise");
  const removing =
    removingId === null
      ? null
      : (rows.find((row) => String(row.id) === removingId) ?? null);
  const setRemoving = (next: MyWorkoutExercise | null) =>
    setRemovingId(next === null ? null : String(next.id));
  const busy = reorder.isPending || remove.isPending;
  const waitingForSync = exercises.some((exercise) => exercise.id < 0);
  const [, listDrop] = useDrop(
    () => ({
      accept: itemType,
      canDrop: () => !busy && !waitingForSync,
      drop: () => ({}),
    }),
    [busy, waitingForSync],
  );
  useEffect(() => {
    draft.current = exercises;
    setRows(exercises);
  }, [exercises]);
  const update = (next: MyWorkoutExercise[]) => {
    draft.current = next;
    setRows(next);
  };
  const move = (id: number, targetId: number) => {
    const next = [...draft.current];
    const from = next.findIndex((row) => row.id === id);
    const to = next.findIndex((row) => row.id === targetId);
    if (from < 0 || to < 0 || from === to) return;
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    update(next);
  };
  const save = async () => {
    const ids = draft.current.map((row) => row.id);
    if (busy || ids.every((id, index) => id === exercises[index]?.id)) return;
    onOrderChange(ids);
    try {
      await reorder.mutateAsync({ workoutId, exerciseIds: ids });
    } catch (error) {
      if (error instanceof TypeError || !navigator.onLine) {
        return;
      }
      update(exercises);
      onOrderChange(exercises.map((row) => row.id));
      toast.error(error instanceof Error ? error.message : "Couldn't save");
    }
  };
  return (
    <div className="grid min-w-0 gap-[14px]">
      <div className="flex items-center justify-between gap-3 max-mobile:flex-wrap max-mobile:items-start">
        <div className="max-mobile:flex-[1_1_150px]">
          <h2 className="text-[20px] font-bold">
            Exercises{" "}
            <span className="ml-[6px] text-[14px] text-muted-foreground">
              {rows.length}
            </span>
          </h2>
          {rows.length > 0 && (
            <p
              id="reorder-help"
              className="mt-[6px] text-[12px] text-muted-foreground"
            >
              Drag to reorder.
            </p>
          )}
        </div>
        <Button onClick={onAdd} disabled={busy} className="min-h-11 shrink-0">
          <Plus size={16} /> Add exercise
        </Button>
      </div>
      <p className="sr-only" id="reorder-keyboard-help">
        Use the up and down arrow keys on a drag handle to move the exercise.
      </p>
      <ol
        ref={(node) => {
          listDrop(node);
        }}
        className="m-0 grid list-none gap-2 p-0"
        aria-label="Workout exercises"
      >
        {rows.map((exercise, index) => (
          <SortableExercise
            key={exercise.id}
            exercise={exercise}
            index={index}
            disabled={busy || waitingForSync}
            onMove={move}
            onDrop={(dropped) => {
              if (dropped) void save();
              else update(exercises);
            }}
            onKeyMove={(by) => {
              const target = draft.current[index + by];
              if (target) {
                move(exercise.id, target.id);
                void save();
              }
            }}
            onSelect={() => onSelect(exercise.id)}
            onRemove={() => setRemoving(exercise)}
          />
        ))}
      </ol>
      {rows.length === 0 && (
        <NoData
          title="Build your workout"
          description="Add your first exercise, then arrange your workout in the order you want to train."
        >
          <Button onClick={onAdd} disabled={busy}>
            <Plus size={16} />
            Add exercise
          </Button>
        </NoData>
      )}
      <ExerciseDragPreview />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title={`Remove ${removing?.exerciseName ?? "exercise"}?`}
        description="Removes exercise + sets."
        confirmLabel="Remove exercise"
        loading={remove.isPending}
        onConfirm={() => {
          if (!removing) return;
          toast.promise(remove.mutateAsync(removing.id), {
            loading: "Removing…",
            success: () => {
              setRemoving(null);
              return "Exercise removed";
            },
            error: (error) => error.message,
          });
        }}
      />
    </div>
  );
}

function SortableExercise({
  exercise,
  index,
  disabled,
  onMove,
  onDrop,
  onKeyMove,
  onSelect,
  onRemove,
}: {
  exercise: MyWorkoutExercise;
  index: number;
  disabled: boolean;
  onMove: (id: number, targetId: number) => void;
  onDrop: (dropped: boolean) => void;
  onKeyMove: (by: number) => void;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const row = useRef<HTMLLIElement>(null);
  const reducedMotion = useReducedMotion();
  const [{ dragging }, drag] = useDrag(
    () => ({
      type: itemType,
      item: () => {
        const rect = row.current?.getBoundingClientRect();
        if (!rect) return null;
        return {
          id: exercise.id,
          name: exercise.exerciseName ?? "Exercise",
          index,
          sets: exercise.sets.length,
          imageUrl: exercise.gifUrl ?? exercise.imageUrl,
          rect: {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
          },
        };
      },
      canDrag: !disabled,
      end: (_item, monitor) => onDrop(monitor.didDrop()),
      collect: (monitor) => ({ dragging: monitor.isDragging() }),
    }),
    [
      exercise.id,
      exercise.exerciseName,
      exercise.sets.length,
      exercise.imageUrl,
      exercise.gifUrl,
      index,
      disabled,
      onDrop,
    ],
  );
  const [, drop] = useDrop<DragItem>(
    () => ({
      accept: itemType,
      canDrop: () => !disabled,
      drop: () => ({}),
      hover: (item, monitor) => {
        if (disabled || item.id === exercise.id || !row.current) return;
        const point = monitor.getClientOffset();
        if (!point) return;
        const bounds = row.current.getBoundingClientRect();
        const midpoint = bounds.top + bounds.height / 2;
        if (item.index < index && point.y < midpoint) return;
        if (item.index > index && point.y > midpoint) return;
        onMove(item.id, exercise.id);
        // Keep the monitor's position current, as in React DnD's sortable example.
        item.index = index;
      },
    }),
    [disabled, exercise.id, index, onMove],
  );
  return (
    <li
      ref={(node) => {
        row.current = node;
        drop(node);
      }}
      className="min-w-0"
    >
      <motion.div
        layout="position"
        transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}
        className="flex min-w-0 items-center gap-1 rounded-xl border border-border bg-card p-[6px] data-[dragging=true]:border-dashed data-[dragging=true]:border-primary data-[dragging=true]:bg-accent data-[dragging=true]:[&>*]:invisible"
        data-dragging={dragging}
      >
        <button
          ref={(node) => {
            drag(node);
          }}
          className="grid min-h-12 w-11 shrink-0 grow-0 basis-11 cursor-grab touch-none place-items-center rounded-lg border-0 bg-transparent text-muted-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-1 disabled:cursor-default disabled:opacity-50 active:cursor-grabbing"
          type="button"
          disabled={disabled}
          aria-label={`Reorder ${exercise.exerciseName}`}
          aria-describedby="reorder-keyboard-help"
          onKeyDown={(event) => {
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();
              onKeyMove(event.key === "ArrowUp" ? -1 : 1);
            }
          }}
        >
          <GripVertical size={20} />
        </button>
        <div className="flex min-h-[60px] min-w-0 flex-1 flex-row items-center justify-start gap-3 border-0 bg-none px-0 py-[6px] text-left text-foreground">
          <ExerciseThumbnail
            src={exercise.gifUrl ?? exercise.imageUrl}
            exerciseId={exercise.exerciseId}
            name={exercise.exerciseName ?? "Exercise"}
            className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-muted text-muted-foreground [&_img]:h-full [&_img]:w-full [&_img]:object-contain"
          />
          <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className="flex min-w-0 flex-col gap-[5px] text-left focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-1 disabled:cursor-default disabled:opacity-50"
          >
            <strong className="text-[14px] leading-[1.4] break-anywhere text-foreground">
              {exercise.exerciseName ?? "Exercise"}
            </strong>
            <span className="text-[11px] text-muted-foreground">
              {index + 1} · {exercise.sets.length}{" "}
              {exercise.sets.length === 1 ? "set" : "sets"}
            </span>
          </button>
        </div>
        <button
          type="button"
          className="grid min-h-12 w-11 shrink-0 grow-0 basis-11 place-items-center rounded-lg border-0 bg-transparent text-muted-foreground hover:bg-muted hover:text-destructive focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-1 disabled:cursor-default disabled:opacity-50"
          disabled={disabled}
          aria-label={`Remove ${exercise.exerciseName}`}
          onClick={onRemove}
        >
          <Trash2 size={17} />
        </button>
      </motion.div>
    </li>
  );
}

function ExerciseDragPreview() {
  const { dragging, item, offset, initialOffset } = useDragLayer((monitor) => ({
    dragging: monitor.isDragging(),
    item: monitor.getItem<DragItem>(),
    offset: monitor.getClientOffset(),
    initialOffset: monitor.getInitialClientOffset(),
  }));
  useEffect(() => {
    if (!dragging) return;
    document.body.classList.add("is-reordering-exercises");
    return () => document.body.classList.remove("is-reordering-exercises");
  }, [dragging]);
  useEffect(() => {
    if (!dragging || !offset) return;
    let frame = 0;
    let previous = performance.now();
    const scroll = (now: number) => {
      const bottom = window.innerHeight - 100;
      const intensity =
        offset.y < 90
          ? -Math.min(1, (90 - offset.y) / 60)
          : offset.y > bottom
            ? Math.min(1, (offset.y - bottom) / 60)
            : 0;
      if (intensity)
        window.scrollBy(0, intensity * Math.min(32, now - previous) * 0.5);
      previous = now;
      frame = requestAnimationFrame(scroll);
    };
    frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
  }, [dragging, offset]);
  if (!dragging || !offset || !initialOffset || !item) return null;
  // Portal avoids transformed page ancestors shifting the fixed preview.
  return createPortal(
    <div
      className="flex min-w-0 items-center gap-1 rounded-xl border border-primary bg-card p-[6px] fixed z-[100] pointer-events-none will-change-transform shadow-[0_8px_24px_color-mix(in_srgb,var(--foreground)_14%,transparent)]"
      aria-hidden="true"
      style={{
        left: 0,
        top: 0,
        width: item.rect.width,
        height: item.rect.height,
        transform: `translate3d(${item.rect.left + offset.x - initialOffset.x}px, ${item.rect.top + offset.y - initialOffset.y}px, 0)`,
      }}
    >
      <span className="grid min-h-12 w-11 shrink-0 grow-0 basis-11 place-items-center rounded-lg border-0 bg-transparent text-muted-foreground">
        <GripVertical size={20} />
      </span>
      <span className="flex min-h-[60px] min-w-0 flex-1 flex-row items-center justify-start gap-3 border-0 bg-none px-0 py-[6px] text-left text-foreground">
        <ExerciseThumbnail
          src={item.imageUrl}
          className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-muted text-muted-foreground [&_img]:h-full [&_img]:w-full [&_img]:object-contain"
        />
        <span className="flex min-w-0 flex-col gap-[5px]">
          <strong className="text-[14px] leading-[1.4] break-anywhere text-foreground">
            {item.name}
          </strong>
          <span className="text-[11px] text-muted-foreground">
            {item.index + 1} · {item.sets} {item.sets === 1 ? "set" : "sets"}
          </span>
        </span>
      </span>
      <span className="grid min-h-12 w-11 shrink-0 grow-0 basis-11 place-items-center rounded-lg border-0 bg-transparent text-muted-foreground">
        <Trash2 size={17} />
      </span>
    </div>,
    document.body,
  );
}

import { NoData } from "@/components/ui/no-data";
