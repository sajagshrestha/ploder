import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Minus,
  Play,
  Plus,
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
import {
  ExerciseCardSkeleton,
  ListSkeleton,
} from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger";
import { Input } from "@/components/ui/input";
import { NoData } from "@/components/ui/no-data";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/ui/search-bar";
import { useOverlayState } from "@/hooks/use-overlay-state";
import {
  type MyWorkoutExercise,
  useAddWorkoutExercises,
  useCompleteWorkout,
  useDeleteSet,
  useInfiniteMyExercises,
  useLogSet,
  useMe,
  useMySplit,
  useMySummary,
  useMyWorkout,
  useStartWorkout,
} from "@/lib/my-queries";
import type { Exercise } from "@/lib/queries";
import { cn } from "@/lib/utils";

const WorkoutManager = lazy(() => import("@/components/app/workout-manager"));

export function TrainPage({ manage = false }: { manage?: boolean }) {
  const summary = useMySummary();
  const activeWorkout = summary.data?.data.activeWorkout ?? null;

  if (summary.isPending) {
    return <ExerciseCardSkeleton />;
  }

  if (summary.isError) {
    return (
      <div className="space-y-2 pt-8 text-center">
        <p className="font-semibold">Couldn't load</p>
        <Button onClick={() => summary.refetch()}>Retry</Button>
      </div>
    );
  }

  return activeWorkout ? (
    <ActiveWorkout workoutId={activeWorkout.id} manage={manage} />
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
      loading: "Starting…",
      success: "Started",
      error: (error) => error.message,
    });
  };

  return (
    <div className="training-content space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Start workout.</h1>
        <p className="text-sm text-muted-foreground">
          Pick a day or go freestyle.
        </p>
      </div>

      {activeSplitId === null ? (
        <NoData
          icon={Dumbbell}
          title="Choose your training plan"
          description="Follow a template, or start a freestyle session below."
        >
          <Button asChild>
            <Link to="/app/splits">
              Browse plans <ArrowRight size={16} />
            </Link>
          </Button>
        </NoData>
      ) : activeSplit.data ? (
        <Card className="gap-3 py-4">
          <CardHeader className="pb-1">
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
      ) : activeSplit.isPending ? (
        <ListSkeleton count={3} tall />
      ) : (
        <div className="inline-error">
          Couldn't load plan.{" "}
          <button type="button" onClick={() => activeSplit.refetch()}>
            Retry
          </button>
        </div>
      )}

      <Card className="gap-3 py-4">
        <CardHeader className="pb-1">
          <CardTitle className="text-base">Freestyle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            No plan needed — name it and go.
          </p>
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
              placeholder="e.g. Push day"
              value={name}
              aria-label="Workout name"
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

      <div className="flex justify-center">
        <Link to="/app/history" className="text-link">
          View history <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}

function ActiveWorkout({
  workoutId,
  manage,
}: {
  workoutId: number;
  manage: boolean;
}) {
  // Negative ids are optimistic placeholders awaiting the server response.
  const workout = useMyWorkout(workoutId < 0 ? null : workoutId);
  const me = useMe();
  const complete = useCompleteWorkout();
  const [addingValue, setAddingValue] = useOverlayState("add-exercises");
  const adding = addingValue !== null;
  const setAdding = (next: boolean) => setAddingValue(next ? "" : null);
  const view = manage ? "list" : "cards";
  const location = useLocation();
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
    if (manage || !location.hash) return;
    const index = exercises.findIndex(
      (exercise) => String(exercise.id) === location.hash,
    );
    if (index >= 0) setDeck([index, 0]);
  }, [manage, location.hash, exercises]);

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
        {manage && (
          <Button asChild variant="ghost" className="mb-4 w-fit">
            <Link to="/app/train">
              <ChevronLeft size={18} />
              Back to workout
            </Link>
          </Button>
        )}
        {!manage && (
          <div className="session-top">
            <span className="session-type-badge" title={detail?.name}>
              {dayName}
            </span>
            <span className="session-live">
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </span>
            <div className="session-top-actions">
              {detail && (exercises.length > 0 || view === "list") && (
                <Link
                  to={manage ? "/app/train" : "/app/train/exercises"}
                  className={cn(
                    "session-icon-btn session-icon-btn-manage",
                    view === "list" && "session-icon-btn-manage-active",
                  )}
                  aria-label={
                    view === "list" ? "Back to workout" : "Manage exercises"
                  }
                >
                  <Settings size={18} aria-hidden="true" />
                </Link>
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
                      return "Done!";
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
        )}
        {workout.isPending && <ExerciseCardSkeleton header={false} />}
        {workout.isError && (
          <div className="inline-error">
            Couldn't load.{" "}
            <button type="button" onClick={() => workout.refetch()}>
              Retry
            </button>
          </div>
        )}

        {detail &&
          (exercises.length === 0 && view === "cards" ? (
            <NoData
              icon={Dumbbell}
              title="Ready for your first exercise?"
              description="Choose a movement from the library, then log your weight and reps as you go."
            >
              <Button onClick={() => setAdding(true)}>
                <Plus size={16} />
                Add exercise
              </Button>
            </NoData>
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
            <Suspense fallback={<ListSkeleton count={5} media />}>
              <WorkoutManager
                workoutId={workoutId}
                exercises={exercises}
                onAdd={() => setAdding(true)}
                onSelect={(id) => {
                  const index = exercises.findIndex(
                    (exercise) => exercise.id === id,
                  );
                  setDeck([Math.max(0, index), 0]);
                  void navigate({ to: "/app/train", hash: String(id) });
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
const swipeSensitivity = 1.65;

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
  const zIndex = useTransform(
    offset,
    (value) => 100 - Math.round(Math.abs(value) * 10),
  );
  const opacity = useTransform(offset, (value) =>
    reducedMotion
      ? index === active
        ? 1
        : 0.1
      : Math.max(0.45, 1 - Math.abs(value) * 0.45),
  );
  const visibility = useTransform(offset, (value) =>
    (reducedMotion ? index !== active : Math.abs(value) > 2)
      ? "hidden"
      : "visible",
  );
  return (
    <motion.div
      className="ex-card ex-card-deck coverflow-card"
      style={{ x, rotateY, z, zIndex, visibility, opacity }}
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
        // Keep the control under the finger stable during the next tap.
        playback.current?.stop();
        position.set(active);
        if (event.button !== 0 || exercises.length < 2) return;
        controls.start(event, { distanceThreshold: 5 });
      }}
      onDragStart={() => {
        dragged.current = true;
        playback.current?.stop();
        dragOrigin.current = position.get();
      }}
      onDrag={(_, info) => {
        if (reducedMotion) return;
        const next =
          dragOrigin.current - (info.offset.x * swipeSensitivity) / width();
        position.set(Math.max(-0.12, Math.min(exercises.length - 0.88, next)));
      }}
      onDragEnd={(event, info) => {
        const stride = width();
        const momentum = Math.max(
          -stride * 0.4,
          Math.min(stride * 0.4, info.velocity.x * 0.12),
        );
        const projected =
          dragOrigin.current -
          ((info.offset.x + momentum) * swipeSensitivity) / stride;
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
        if (dragged.current && event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
          dragged.current = false;
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
  exerciseId,
}: {
  imageUrl?: string | null;
  name: string;
  exerciseId: number;
}) {
  return (
    <motion.div
      className="ex-card-media"
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 360, damping: 34 }}
    >
      <ExerciseThumbnail
        src={imageUrl}
        exerciseId={exerciseId}
        name={name}
        className="block"
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
  const [deleteSetId, setDeleteSetId] = useOverlayState("delete-set");
  const deletingSet = (() => {
    if (deleteSetId === null) return null;
    for (const item of exercises) {
      const found = item.sets.find((set) => String(set.id) === deleteSetId);
      if (found) return { id: found.id, setNumber: found.setNumber };
    }
    return null;
  })();
  const setDeletingSet = (next: { id: number; setNumber: number } | null) =>
    setDeleteSetId(next === null ? null : String(next.id));

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
          toast.error("Enter weight + reps");
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
          loading: "Logging…",
          success: "Set logged",
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
        <AnimatePresence initial={false} mode="popLayout">
          {exercise.sets.length === 0 ? (
            <ExerciseMedia
              key={`media-${exercise.id}`}
              imageUrl={exercise.imageUrl ?? exercise.gifUrl}
              name={exercise.exerciseName ?? "Exercise"}
              exerciseId={exercise.exerciseId}
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
        title="Delete set?"
        description="Removes set permanently."
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
  const [selected, setSelected] = useState<Exercise[]>([]);
  const library = useInfiniteMyExercises({
    search: search || undefined,
    pageSize: 20,
  });
  const exercises = library.data?.pages.flatMap((page) => page.data) ?? [];
  const total = library.data?.pages[0]?.total;
  const add = useAddWorkoutExercises();
  useEffect(() => {
    if (!open) {
      setSearch("");
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
      toast.success("Added");
      onClose();
    } catch (error) {
      if (error instanceof TypeError || !navigator.onLine) onClose();
      else
        toast.error(error instanceof Error ? error.message : "Couldn't add.");
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !add.isPending) onClose();
      }}
    >
      <DialogContent className="exercise-picker-dialog sm:max-w-lg">
        <DialogTitle className="sr-only">Add exercises</DialogTitle>
        <DialogDescription className="sr-only">
          Browse exercises and add them to your workout.
        </DialogDescription>
        <div className="exercise-picker-library">
          <SearchBar
            aria-label="Search exercises to add"
            placeholder="Search exercises…"
            value={search}
            disabled={add.isPending}
            onValueChange={setSearch}
          />
          {selected.length > 0 && (
            <ScrollArea
              className="exercise-selection-summary"
              orientation="horizontal"
              type="always"
              role="region"
              aria-label="Selected exercises"
            >
              <div className="flex w-max gap-1.5 pb-2">
                {selected.map((exercise) => (
                  <Badge key={exercise.id} variant="secondary" asChild>
                    <button
                      type="button"
                      disabled={add.isPending}
                      onClick={() => toggle(exercise)}
                      aria-label={`Deselect ${exercise.name}`}
                    >
                      {exercise.name}
                      <X aria-hidden="true" />
                    </button>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}
          <ScrollArea
            className="exercise-picker-results"
            role="region"
            aria-label="Exercise library"
            type="always"
          >
            <div className="exercise-picker-results-content">
              {library.isPending && <ListSkeleton count={5} media />}
              {library.isError && (
                <div className="inline-error">
                  Couldn't load.{" "}
                  <button type="button" onClick={() => library.refetch()}>
                    Retry
                  </button>
                </div>
              )}
              <div className="exercise-picker-grid">
                {exercises.map((exercise) => {
                  const checked = selected.some(
                    (item) => item.id === exercise.id,
                  );
                  return (
                    <article
                      key={exercise.id}
                      className="exercise-picker-option"
                      data-selected={checked}
                    >
                      <button
                        type="button"
                        className="exercise-picker-select-target"
                        aria-label={`${checked ? "Deselect" : "Select"} ${exercise.name}`}
                        disabled={
                          add.isPending || (!checked && selected.length >= 50)
                        }
                        onClick={() => toggle(exercise)}
                      >
                        <span className="exercise-picker-image">
                          <img
                            src={exercise.gifUrl ?? exercise.imageUrl ?? ""}
                            alt=""
                            loading="lazy"
                          />
                        </span>
                        <span className="exercise-picker-copy">
                          <strong>{exercise.name}</strong>
                          <span>
                            {exercise.muscleGroup} · {exercise.equipment}
                          </span>
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {checked && (
                          <motion.span
                            className="exercise-picker-check"
                            initial={{ scale: 0.35, rotate: -35 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0.35, rotate: 35 }}
                            transition={{
                              type: "spring",
                              stiffness: 520,
                              damping: 28,
                            }}
                            aria-hidden="true"
                          >
                            <Check />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}
              </div>
              {exercises.length === 0 && !library.isPending && (
                <p className="inline-empty">No matches.</p>
              )}
              <InfiniteScrollTrigger
                hasMore={library.hasNextPage}
                isLoading={library.isFetchingNextPage}
                onLoadMore={library.fetchNextPage}
                loadedCount={exercises.length}
                totalCount={total}
              />
            </div>
          </ScrollArea>
        </div>
        <div className="exercise-picker-footer">
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
