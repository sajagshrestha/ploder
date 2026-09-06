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
  const [removing, setRemoving] = useState<MyWorkoutExercise | null>(null);
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
    <div className="workout-manager">
      <div className="manager-heading">
        <div>
          <h2>
            Exercises <span>{rows.length}</span>
          </h2>
          <p id="reorder-help">Drag to reorder.</p>
        </div>
        <Button onClick={onAdd} disabled={busy}>
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
        className="manager-list"
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
        <p className="inline-empty">Add exercise to start.</p>
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
          imageUrl: exercise.imageUrl ?? exercise.gifUrl,
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
      className="manager-row-slot"
    >
      <motion.div
        layout="position"
        transition={{ duration: reducedMotion ? 0 : 0.16, ease: "easeOut" }}
        className="manager-row"
        data-dragging={dragging}
      >
        <button
          ref={(node) => {
            drag(node);
          }}
          className="manager-drag-handle"
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
        <div className="manager-exercise manager-exercise-with-image">
          <ExerciseThumbnail
            src={exercise.imageUrl ?? exercise.gifUrl}
            exerciseId={exercise.exerciseId}
            name={exercise.exerciseName ?? "Exercise"}
          />
          <button
            type="button"
            onClick={onSelect}
            disabled={disabled}
            className="manager-exercise-copy text-left"
          >
            <strong>{exercise.exerciseName ?? "Exercise"}</strong>
            <span>
              {index + 1} · {exercise.sets.length}{" "}
              {exercise.sets.length === 1 ? "set" : "sets"}
            </span>
          </button>
        </div>
        <button
          type="button"
          className="manager-delete"
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
      className="manager-row manager-drag-preview"
      aria-hidden="true"
      style={{
        left: 0,
        top: 0,
        width: item.rect.width,
        height: item.rect.height,
        transform: `translate3d(${item.rect.left + offset.x - initialOffset.x}px, ${item.rect.top + offset.y - initialOffset.y}px, 0)`,
      }}
    >
      <span className="manager-drag-handle">
        <GripVertical size={20} />
      </span>
      <span className="manager-exercise manager-exercise-with-image">
        <ExerciseThumbnail src={item.imageUrl} />
        <span className="manager-exercise-copy">
          <strong>{item.name}</strong>
          <span>
            {item.index + 1} · {item.sets} {item.sets === 1 ? "set" : "sets"}
          </span>
        </span>
      </span>
      <span className="manager-delete">
        <Trash2 size={17} />
      </span>
    </div>,
    document.body,
  );
}
