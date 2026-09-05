import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Minus,
  Play,
  Plus,
  Search,
  Settings,
  X,
} from "lucide-react";
import {
  AnimatePresence,
  animate,
  MotionConfig,
  type MotionValue,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  lazy,
  type ReactNode,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type MyWorkoutExercise,
  useAddWorkoutExercises,
  useCompleteWorkout,
  useDeleteSet,
  useLogSet,
  useMe,
  useMyExercises,
  useMySplit,
  useMySummary,
  useMyWorkout,
  useStartWorkout,
} from "@/lib/my-queries";
import type { Exercise } from "@/lib/queries";
import { cn } from "@/lib/utils";

const WorkoutManager = lazy(() => import("@/components/app/workout-manager"));

export const Route = createFileRoute("/app/train")({
  component: TrainPage,
});

function TrainPage() {
  const summary = useMySummary();
  const activeWorkout = summary.data?.data.activeWorkout ?? null;

  if (summary.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  if (summary.isError) {
    return (
      <div className="space-y-2 pt-8 text-center">
        <p className="font-semibold">Couldn't load training data</p>
        <Button onClick={() => summary.refetch()}>Retry</Button>
      </div>
    );
  }

  return activeWorkout ? (
    <ActiveWorkout workoutId={activeWorkout.id} />
  ) : (
    <StartWorkout />
  );
}

function StartWorkout() {
  const summary = useMySummary();
  const activeSplitId = summary.data?.data.activeSplit?.id ?? null;
  const activeSplit = useMySplit(activeSplitId);
  const startWorkout = useStartWorkout();
  const [name, setName] = useState("");

  const start = (workoutName: string, splitDayId: number | null) => {
    toast.promise(startWorkout.mutateAsync({ name: workoutName, splitDayId }), {
      loading: "Starting workout…",
      success: "Workout started — let's go!",
      error: (error) => error.message,
    });
  };

  return (
    <div className="training-content space-y-5">
      <div>
        <p className="eyebrow">YOUR TIME TO GET STRONGER</p>
        <h1 className="text-2xl font-bold tracking-tight">
          Make this session yours.
        </h1>
        <p className="text-sm text-muted-foreground">
          Start a session from your split or go freestyle.
        </p>
      </div>

      {activeSplit.data && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {activeSplit.data.data.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {activeSplit.data.data.days.map((day) => (
              <Button
                key={day.id}
                className="h-auto justify-between py-3"
                disabled={startWorkout.isPending}
                variant="secondary"
                onClick={() =>
                  start(`${activeSplit.data?.data.name} · ${day.name}`, day.id)
                }
              >
                <span className="text-left">
                  <span className="block font-semibold">{day.name}</span>
                  <span className="block text-xs font-normal opacity-70">
                    {day.exercises.length} exercises
                  </span>
                </span>
                <Play className="size-4 shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Freestyle session</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (name.trim()) {
                start(name.trim(), null);
                setName("");
              }
            }}
          >
            <Input
              placeholder="Workout name, e.g. Push day"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Button
              disabled={startWorkout.isPending || !name.trim()}
              type="submit"
            >
              <Play className="size-4" />
              Start
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button asChild className="w-full" variant="outline">
        <Link to="/app/history">View workout history</Link>
      </Button>
    </div>
  );
}

function ActiveWorkout({ workoutId }: { workoutId: number }) {
  // Negative ids are optimistic placeholders awaiting the server response.
  const workout = useMyWorkout(workoutId < 0 ? null : workoutId);
  const me = useMe();
  const complete = useCompleteWorkout();
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState<"cards" | "list">("cards");
  const navigate = useNavigate();

  const detail = workout.data?.data ?? null;
  const exercises = detail?.exercises ?? [];

  // Per-exercise log-pad inputs, keyed by exercise id so dialed-in values
  // survive swiping between cards. `atSetId` tracks which latest set the pad
  // was synced from, so fresh sets update it without clobbering typing.
  const [pads, setPads] = useState<
    Record<number, { weight: string; reps: string; atSetId: number | null }>
  >({});
  const [deck, setDeck] = useState<[number, number]>([0, 0]);

  useEffect(() => {
    if (exercises.length === 0) {
      return;
    }
    if (document.activeElement?.tagName === "INPUT") {
      return;
    }
    setPads((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const exercise of exercises) {
        const latest = exercise.sets[exercise.sets.length - 1] ?? null;
        const current = prev[exercise.id];
        if (!current) {
          next[exercise.id] = {
            weight: latest?.weight ?? "",
            reps: latest ? String(latest.reps) : "1",
            atSetId: latest?.id ?? null,
          };
          changed = true;
        } else if ((latest?.id ?? null) !== current.atSetId) {
          next[exercise.id] = {
            ...current,
            weight: latest?.weight ?? current.weight,
            reps: latest ? String(latest.reps) : current.reps,
            atSetId: latest?.id ?? null,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [exercises]);

  const patchPad = (
    id: number,
    patch: Partial<{ weight: string; reps: string }>,
  ) => {
    setPads((prev) => {
      const base = prev[id] ?? {
        weight: "",
        reps: "1",
        atSetId: null as number | null,
      };
      return { ...prev, [id]: { ...base, ...patch } };
    });
  };

  const totalSets = exercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const unit = me.data?.data.preferredUnit ?? "kg";
  // "Arnold Split (3-Day) · Chest & Back" → badge shows the day: "Chest & Back".
  const dayName =
    (detail?.name ?? "Workout").split("·").at(-1)?.trim() || "Workout";

  return (
    <MotionConfig reducedMotion="user">
      <div className="training-content session-page" data-view={view}>
        <div className="session-top">
          <span className="session-type-badge" title={detail?.name}>
            {dayName}
          </span>
          <span className="session-live">
            {totalSets} {totalSets === 1 ? "set" : "sets"}
          </span>
          <div className="session-top-actions">
            {detail && (exercises.length > 0 || view === "list") && (
              <button
                type="button"
                className={cn(
                  "session-icon-btn session-icon-btn-manage",
                  view === "list" && "session-icon-btn-manage-active",
                )}
                aria-label={
                  view === "list" ? "Back to workout" : "Manage exercises"
                }
                aria-pressed={view === "list"}
                onClick={() => setView(view === "cards" ? "list" : "cards")}
              >
                <Settings size={18} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className="session-icon-btn session-icon-btn-solid"
              aria-label="Finish workout"
              disabled={complete.isPending || !detail}
              onClick={() =>
                toast.promise(complete.mutateAsync(workoutId), {
                  loading: "Finishing…",
                  success: () => {
                    void navigate({
                      to: "/app/history/$id",
                      params: { id: String(workoutId) },
                    });
                    return "Workout completed. Nice work!";
                  },
                  error: (error) => error.message,
                })
              }
            >
              <Check size={18} />
              <span>Finish</span>
            </button>
          </div>
        </div>

        {workout.isPending && <Skeleton className="h-40 w-full rounded-xl" />}
        {workout.isError && (
          <div className="inline-error">
            Couldn’t load this session.{" "}
            <button type="button" onClick={() => workout.refetch()}>
              Retry
            </button>
          </div>
        )}

        {detail &&
          (exercises.length === 0 && view === "cards" ? (
            <div className="plan-empty">
              <Dumbbell size={28} />
              <h3>Start with one move.</h3>
              <p>
                Add your first exercise, then log set after set right on its
                card.
              </p>
              <Button onClick={() => setAdding(true)}>
                <Plus size={16} />
                Add exercise
              </Button>
            </div>
          ) : view === "cards" ? (
            <ExerciseDeck
              exercises={exercises}
              unit={unit}
              deck={deck}
              onGo={(index, direction) => setDeck([index, direction])}
              pads={pads}
              onPatchPad={patchPad}
            />
          ) : (
            <Suspense
              fallback={<Skeleton className="h-64 w-full rounded-xl" />}
            >
              <WorkoutManager
                workoutId={workoutId}
                exercises={exercises}
                onAdd={() => setAdding(true)}
                onSelect={(id) => {
                  const index = exercises.findIndex(
                    (exercise) => exercise.id === id,
                  );
                  setDeck([Math.max(0, index), 0]);
                  setView("cards");
                }}
                onOrderChange={(ids) => {
                  const id =
                    exercises[Math.min(deck[0], exercises.length - 1)]?.id;
                  setDeck([Math.max(0, ids.indexOf(id)), 0]);
                }}
              />
            </Suspense>
          ))}

        {detail && view === "cards" && exercises.length > 0 && (
          <div className="session-picker-bar session-picker-bar-bottom">
            <div className="exercise-minimap">
              <input
                className="exercise-minimap-slider"
                type="range"
                min={0}
                max={exercises.length - 1}
                step={1}
                value={Math.min(deck[0], exercises.length - 1)}
                aria-label="Select exercise"
                aria-valuetext={`Exercise ${Math.min(deck[0] + 1, exercises.length)} of ${exercises.length}: ${exercises[Math.min(deck[0], exercises.length - 1)]?.exerciseName ?? "Exercise"}`}
                disabled={exercises.length < 2}
                onChange={(event) => {
                  const index = Number(event.target.value);
                  setDeck([index, 0]);
                  setView("cards");
                }}
              />
              {exercises.map((exercise, index) => (
                <span
                  key={exercise.id}
                  aria-hidden="true"
                  data-active={
                    index === Math.min(deck[0], exercises.length - 1)
                  }
                  data-logged={exercise.sets.length > 0}
                />
              ))}
            </div>
          </div>
        )}

        <AddExerciseDialog
          open={adding}
          workoutId={workoutId}
          onClose={() => setAdding(false)}
        />
      </div>
    </MotionConfig>
  );
}

const coverflowTransition = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

function CoverflowCard({
  exercise,
  index,
  active,
  position,
  reducedMotion,
  children,
}: {
  exercise: MyWorkoutExercise;
  index: number;
  active: number;
  position: MotionValue<number>;
  reducedMotion: boolean | null;
  children: ReactNode;
}) {
  const offset = useTransform(position, (value) => index - value);
  const x = useTransform(offset, (value) =>
    reducedMotion ? "0%" : `${value * 86}%`,
  );
  const rotateY = useTransform(offset, (value) =>
    reducedMotion ? 0 : Math.max(-48, Math.min(48, value * -48)),
  );
  const z = useTransform(offset, (value) =>
    reducedMotion ? 0 : -Math.min(Math.abs(value), 2) * 150,
  );
  const filter = useTransform(
    offset,
    (value) =>
      `blur(${reducedMotion ? 0 : Math.min(Math.abs(value), 1) * 4}px)`,
  );
  const zIndex = useTransform(
    offset,
    (value) => 100 - Math.round(Math.abs(value) * 10),
  );
  const visibility = useTransform(offset, (value) =>
    (reducedMotion ? index !== active : Math.abs(value) > 2)
      ? "hidden"
      : "visible",
  );
  return (
    <motion.div
      className="ex-card ex-card-deck coverflow-card"
      style={{ x, rotateY, z, zIndex, visibility, filter }}
      inert={index !== active}
      aria-hidden={index !== active}
      data-active={index === active}
      aria-label={exercise.exerciseName ?? "Exercise"}
    >
      {children}
    </motion.div>
  );
}

function ExerciseCoverflow({
  exercises,
  active,
  onGo,
  renderCard,
}: {
  exercises: MyWorkoutExercise[];
  active: number;
  onGo: (index: number) => void;
  renderCard: (exercise: MyWorkoutExercise) => ReactNode;
}) {
  const position = useMotionValue(active);
  const controls = useDragControls();
  const reducedMotion = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const dragOrigin = useRef(active);
  const playback = useRef<ReturnType<typeof animate> | null>(null);
  useEffect(() => {
    playback.current?.stop();
    playback.current = animate(
      position,
      active,
      reducedMotion ? { duration: 0 } : coverflowTransition,
    );
    return () => playback.current?.stop();
  }, [active, position, reducedMotion]);
  const width = () =>
    (stage.current?.firstElementChild?.clientWidth ?? 360) * 0.86;
  return (
    <motion.section
      ref={stage}
      className="ex-deck ex-coverflow"
      aria-roledescription="carousel"
      aria-label="Exercises in this session"
      drag={exercises.length > 1 ? "x" : false}
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0}
      onPointerDownCapture={(event) => {
        dragged.current = false;
        if (event.button !== 0 || exercises.length < 2) return;
        controls.start(event, { distanceThreshold: 10 });
      }}
      onDragStart={() => {
        dragged.current = true;
        playback.current?.stop();
        dragOrigin.current = position.get();
      }}
      onDrag={(_, info) => {
        if (reducedMotion) return;
        const next = dragOrigin.current - info.offset.x / width();
        position.set(Math.max(-0.12, Math.min(exercises.length - 0.88, next)));
      }}
      onDragEnd={(event, info) => {
        const stride = width();
        const momentum = Math.max(
          -stride * 0.25,
          Math.min(stride * 0.25, info.velocity.x * 0.08),
        );
        const projected =
          dragOrigin.current - (info.offset.x + momentum) / stride;
        const next =
          event.type === "pointercancel"
            ? active
            : Math.max(
                0,
                Math.min(exercises.length - 1, Math.round(projected)),
              );
        onGo(next);
        playback.current?.stop();
        playback.current = animate(
          position,
          next,
          reducedMotion ? { duration: 0 } : coverflowTransition,
        );
      }}
      onClickCapture={(event) => {
        if (dragged.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {exercises.map((exercise, index) => (
        <CoverflowCard
          key={exercise.id}
          exercise={exercise}
          index={index}
          active={active}
          position={position}
          reducedMotion={reducedMotion}
        >
          {renderCard(exercise)}
        </CoverflowCard>
      ))}
    </motion.section>
  );
}

function ExerciseMedia({
  imageUrl,
  name,
}: {
  imageUrl?: string | null;
  name: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!imageUrl || failed) return null;
  return (
    <motion.div
      className="ex-card-media"
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <img
        src={imageUrl}
        alt={`${name} demonstration`}
        draggable={false}
        decoding="async"
        onError={() => setFailed(true)}
      />
    </motion.div>
  );
}

type PadPatch = Partial<{ weight: string; reps: string }>;

function ExerciseDeck({
  exercises,
  unit,
  deck,
  onGo,
  pads,
  onPatchPad,
}: {
  exercises: MyWorkoutExercise[];
  unit: string;
  deck: [number, number];
  onGo: (index: number, direction: number) => void;
  pads: Record<
    number,
    { weight: string; reps: string; atSetId: number | null }
  >;
  onPatchPad: (id: number, patch: PadPatch) => void;
}) {
  const [active] = deck;
  const count = exercises.length;
  const index = count === 0 ? 0 : Math.min(active, count - 1);
  const exercise = exercises[index] ?? null;
  const logSet = useLogSet();
  const deleteSet = useDeleteSet();
  const [deletingSet, setDeletingSet] = useState<{
    id: number;
    setNumber: number;
  } | null>(null);

  useEffect(() => {
    if (active > count - 1) {
      onGo(Math.max(0, count - 1), -1);
    }
  }, [count, active, onGo]);

  if (!exercise) {
    return null;
  }

  const go = (next: number) => {
    if (next < 0 || next >= count || next === index) return;
    onGo(next, next > index ? 1 : -1);
  };
  const renderExercise = (exercise: MyWorkoutExercise) => {
    const pad = pads[exercise.id] ?? {
      weight: "",
      reps: "1",
      atSetId: null,
    };
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const weightValue = Number(pad.weight);
    const repsValue = Number(pad.reps);
    const valid =
      pad.weight.trim() !== "" &&
      Number.isFinite(weightValue) &&
      weightValue >= 0 &&
      Number.isInteger(repsValue) &&
      repsValue > 0;

    const nudgeWeight = (by: number) => {
      const base = Number.isFinite(weightValue) ? weightValue : 0;
      onPatchPad(exercise.id, {
        weight: (Math.round(Math.max(0, base + by) * 10) / 10).toFixed(1),
      });
    };
    const nudgeReps = (by: number) => {
      const base = Number.isInteger(repsValue) ? repsValue : 0;
      onPatchPad(exercise.id, { reps: String(Math.max(1, base + by)) });
    };
    const submit = () => {
      if (!valid || logSet.isPending) {
        if (!valid) {
          toast.error("Enter a valid weight and reps");
        }
        return;
      }
      toast.promise(
        logSet.mutateAsync({
          workoutExerciseId: exercise.id,
          weight: weightValue,
          reps: repsValue,
          isWarmup: false,
        }),
        {
          loading: "Logging set…",
          success: () =>
            `Set ${exercise.sets.length + 1} logged — take a breather`,
          error: (error) => error.message,
        },
      );
    };

    return (
      <>
        <div className="ex-card-top">
          <div className="ex-card-body">
            <h2 className="ex-card-name">
              {exercise.exerciseName ?? "Exercise"}
            </h2>
            {lastSet && (
              <p className="ex-card-last">
                Last set: {lastSet.weight} {unit} × {lastSet.reps}
                {lastSet.isWarmup ? " · warmup" : ""}
              </p>
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {exercise.sets.length === 0 ? (
            <ExerciseMedia
              key={`media-${exercise.id}`}
              imageUrl={exercise.imageUrl ?? exercise.gifUrl}
              name={exercise.exerciseName ?? "Exercise"}
            />
          ) : null}
        </AnimatePresence>
        {exercise.sets.length > 0 && (
          <ScrollArea type="always" className="ex-card-sets">
            <div className="ex-card-set-list">
              <AnimatePresence initial={false}>
                {[...exercise.sets].reverse().map((set) => (
                  <motion.div
                    key={set.id}
                    className="ex-set-row"
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
                  >
                    <span>
                      <strong>
                        {set.weight} {unit} × {set.reps}
                      </strong>
                      <small>
                        Set {set.setNumber}
                        {set.isWarmup ? " · warmup" : ""}
                      </small>
                    </span>
                    <button
                      type="button"
                      aria-label={`Delete set ${set.setNumber}`}
                      disabled={deleteSet.isPending}
                      onClick={() =>
                        setDeletingSet({
                          id: set.id,
                          setNumber: set.setNumber,
                        })
                      }
                    >
                      <Minus size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}

        <div className="ex-card-pad">
          <div className="set-pad-row">
            <fieldset className="set-pad-group weighin-fieldset">
              <legend>Weight</legend>
              <div className="weighin-stepper">
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Decrease weight"
                  onClick={() => nudgeWeight(-2.5)}
                >
                  <Minus size={18} />
                </button>
                <div className="weighin-display">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    aria-label={`Weight in ${unit}`}
                    value={pad.weight}
                    onChange={(event) =>
                      onPatchPad(exercise.id, {
                        weight: event.target.value,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <span className="weighin-unit">{unit}</span>
                </div>
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Increase weight"
                  onClick={() => nudgeWeight(2.5)}
                >
                  <Plus size={18} />
                </button>
              </div>
            </fieldset>
            <fieldset className="set-pad-group weighin-fieldset">
              <legend>Reps</legend>
              <div className="weighin-stepper">
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Decrease reps"
                  onClick={() => nudgeReps(-1)}
                >
                  <Minus size={18} />
                </button>
                <div className="weighin-display">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    aria-label="Reps"
                    value={pad.reps}
                    onChange={(event) =>
                      onPatchPad(exercise.id, {
                        reps: event.target.value,
                      })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <span className="weighin-unit">reps</span>
                </div>
                <button
                  type="button"
                  className="weighin-step-btn"
                  aria-label="Increase reps"
                  onClick={() => nudgeReps(1)}
                >
                  <Plus size={18} />
                </button>
              </div>
            </fieldset>
          </div>
          <div className="set-pad-foot">
            <motion.div
              className="set-log-wrap"
              whileTap={valid ? { scale: 0.98 } : undefined}
            >
              <Button
                className="set-log-btn"
                size="lg"
                disabled={logSet.isPending || !valid}
                onClick={submit}
              >
                <Plus size={17} />
                {logSet.isPending
                  ? "Logging…"
                  : valid
                    ? `Log ${weightValue} × ${repsValue}`
                    : "Log set"}
              </Button>
            </motion.div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="exercise-deck-shell">
      <ExerciseCoverflow
        exercises={exercises}
        active={index}
        onGo={go}
        renderCard={renderExercise}
      />
      <ConfirmDialog
        open={deletingSet !== null}
        onOpenChange={(open) => !open && setDeletingSet(null)}
        title={
          deletingSet
            ? `Delete set #${deletingSet.setNumber}?`
            : "Delete this set?"
        }
        description="This set will be permanently removed from this session. This can't be undone."
        confirmLabel="Delete set"
        loading={deleteSet.isPending}
        onConfirm={() => {
          if (!deletingSet) return;
          toast.promise(deleteSet.mutateAsync(deletingSet.id), {
            loading: "Deleting…",
            success: () => {
              setDeletingSet(null);
              return "Set deleted";
            },
            error: (error) => {
              setDeletingSet(null);
              return error.message;
            },
          });
        }}
      />
      {count > 1 && (
        <div className="carousel-nav">
          <button
            type="button"
            className="icon-link"
            aria-label="Previous exercise"
            disabled={index <= 0}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            className="carousel-position"
            aria-live="polite"
            aria-atomic="true"
          >
            {index + 1} of {count}
            <span className="sr-only">
              : {exercise.exerciseName ?? "Exercise"}
            </span>
          </span>
          <button
            type="button"
            className="icon-link"
            aria-label="Next exercise"
            disabled={index >= count - 1}
            onClick={() => go(index + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function AddExerciseDialog({
  open,
  workoutId,
  onClose,
}: {
  open: boolean;
  workoutId: number;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Exercise[]>([]);
  const library = useMyExercises({
    search: search || undefined,
    page,
    pageSize: 30,
  });
  const add = useAddWorkoutExercises();
  useEffect(() => {
    if (!open) {
      setSearch("");
      setPage(1);
      setSelected([]);
    }
  }, [open]);
  const toggle = (exercise: Exercise) =>
    setSelected((previous) =>
      previous.some((item) => item.id === exercise.id)
        ? previous.filter((item) => item.id !== exercise.id)
        : previous.length < 50
          ? [...previous, exercise]
          : previous,
    );
  const submit = async () => {
    if (!selected.length || add.isPending) return;
    try {
      await add.mutateAsync({ workoutId, exercises: selected });
      toast.success(
        `${selected.length} ${selected.length === 1 ? "exercise" : "exercises"} added`,
      );
      onClose();
    } catch (error) {
      if (error instanceof TypeError || !navigator.onLine) onClose();
      else
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn’t add exercises. Your selection is still here.",
        );
    }
  };
  const totalPages = Math.ceil((library.data?.total ?? 0) / 30);
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !add.isPending) onClose();
      }}
    >
      <DialogContent className="exercise-picker-dialog sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add exercises</DialogTitle>
          <DialogDescription>
            Select your exercises, then add them together.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute top-3 left-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            aria-label="Search exercises to add"
            placeholder="Search exercises…"
            value={search}
            disabled={add.isPending}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        {selected.length > 0 && (
          <section
            className="exercise-selection-summary"
            aria-label="Selected exercises"
          >
            {selected.map((exercise) => (
              <button
                type="button"
                key={exercise.id}
                disabled={add.isPending}
                onClick={() => toggle(exercise)}
                aria-label={`Deselect ${exercise.name}`}
              >
                {exercise.name}
                <X size={13} aria-hidden="true" />
              </button>
            ))}
          </section>
        )}
        <section
          className="exercise-picker-results"
          aria-label="Exercise library"
        >
          {library.isPending && <Skeleton className="h-28 w-full" />}
          {library.isError && (
            <div className="inline-error">
              Couldn’t load exercises.{" "}
              <button type="button" onClick={() => library.refetch()}>
                Retry
              </button>
            </div>
          )}
          {library.data?.data.map((exercise) => {
            const checked = selected.some((item) => item.id === exercise.id);
            return (
              <label
                key={exercise.id}
                className="exercise-picker-option"
                data-selected={checked}
              >
                <ExerciseThumbnail src={exercise.imageUrl ?? exercise.gifUrl} />
                <span className="exercise-picker-copy">
                  <strong>{exercise.name}</strong>
                  <span>
                    {exercise.muscleGroup} · {exercise.equipment}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={checked}
                  aria-label={exercise.name}
                  disabled={
                    add.isPending || (!checked && selected.length >= 50)
                  }
                  onChange={() => toggle(exercise)}
                />
              </label>
            );
          })}
          {library.data?.data.length === 0 && (
            <p className="inline-empty">No exercises found.</p>
          )}
        </section>
        {totalPages > 1 && (
          <div className="exercise-picker-pagination">
            <button
              type="button"
              aria-label="Previous page of exercises"
              disabled={page === 1 || add.isPending}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={18} />
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              aria-label="Next page of exercises"
              disabled={page >= totalPages || add.isPending}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        <div className="exercise-picker-footer">
          <span role="status">
            {selected.length} selected
            {selected.length === 50 ? " · limit reached" : ""}
          </span>
          <Button
            disabled={!selected.length || add.isPending}
            onClick={() => void submit()}
          >
            <Plus size={16} />
            {add.isPending
              ? "Adding…"
              : selected.length
                ? `Add ${selected.length} ${selected.length === 1 ? "exercise" : "exercises"}`
                : "Add selected"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
