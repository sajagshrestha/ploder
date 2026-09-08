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
  ExercisePickerSkeleton,
  ListSkeleton,
} from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger";
import { InlineNote } from "@/components/ui/inline-note";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { usePinDrawerToVisualViewport } from "@/hooks/use-pin-drawer-to-visual-viewport";
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
        <InlineNote>
          Couldn't load plan.{" "}
          <button
            type="button"
            className="underline underline-offset-[3px]"
            onClick={() => activeSplit.refetch()}
          >
            Retry
          </button>
        </InlineNote>
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
        <Link
          to="/app/history"
          className="inline-flex items-center gap-[9px] text-[12px] font-bold hover:underline hover:underline-offset-4"
        >
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
          <div className="flex min-h-12 items-start gap-[10px] max-mobile:flex-wrap max-mobile:shrink-0">
            <span
              className="min-w-0 text-[20px] font-bold tracking-[-0.5px] text-balance text-foreground max-mobile:max-w-[calc(100%-95px)]"
              title={detail?.name}
            >
              {dayName}
            </span>
            <span className="inline-flex min-w-0 items-center gap-[7px] self-start overflow-hidden text-[20px] font-bold tracking-[-0.5px] whitespace-nowrap text-muted-foreground text-ellipsis">
              {totalSets} {totalSets === 1 ? "set" : "sets"}
            </span>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {detail && (exercises.length > 0 || view === "list") && (
                <Link
                  to={manage ? "/app/train" : "/app/train/exercises"}
                  className={cn(
                    "grid h-[46px] w-[46px] place-items-center rounded-[14px] border bg-transparent transition-[transform,background,opacity] duration-150 active:scale-[0.92] disabled:opacity-35 max-mobile:h-[38px] max-mobile:min-h-[38px] max-mobile:w-[38px] border-border bg-accent text-accent-foreground hover:border-ring",
                    view === "list" &&
                      "border-transparent bg-primary text-primary-foreground hover:border-transparent",
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
                className="inline-flex h-[46px] w-auto items-center justify-center gap-[7px] rounded-[10px] border border-transparent bg-primary px-[14px] py-0 text-[12px] font-bold text-primary-foreground transition-[transform,background,opacity] duration-150 hover:brightness-[0.96] active:scale-[0.92] disabled:opacity-35 max-mobile:h-[38px] max-mobile:min-h-[38px] max-mobile:w-auto"
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
          <InlineNote>
            Couldn't load.{" "}
            <button
              type="button"
              className="underline underline-offset-[3px]"
              onClick={() => workout.refetch()}
            >
              Retry
            </button>
          </InlineNote>
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
          <div className="session-picker-bar session-picker-bar-bottom max-mobile:shrink-0">
            <div className="exercise-minimap relative flex h-11 min-w-0 max-w-[180px] flex-1 items-center justify-center gap-1 rounded-lg has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-solid has-[input:focus-visible]:outline-ring has-[input:focus-visible]:outline-offset-[3px]">
              <input
                className="exercise-minimap-slider absolute inset-0 z-[1] m-0 h-full w-full cursor-pointer touch-pan-y opacity-0 disabled:cursor-default"
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
                  className="h-[5px] min-w-[1px] flex-1 rounded-full bg-border transition-[background,height] duration-200 data-[active=true]:h-[9px] data-[active=true]:bg-primary data-[logged=true]:bg-muted-foreground"
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
      className="relative flex min-h-0 min-w-0 flex-[1_1_0] touch-pan-y flex-col gap-5 overflow-hidden rounded-[17px] border border-border bg-card p-6 text-left text-foreground select-none focus-visible:outline-[3px] focus-visible:outline-solid focus-visible:outline-ring focus-visible:outline-offset-4 mobile:basis-[46%] max-mobile:gap-[14px] max-mobile:p-4 [scroll-snap-align:unset] [&_input]:touch-pan-y [&_input]:select-text coverflow-card"
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
      className="flex max-h-[250px] min-h-[160px] flex-[1_1_160px] justify-center overflow-hidden rounded-xl bg-muted max-mobile:basis-0 max-mobile:max-h-none [&_img]:pointer-events-none [&_img]:h-full [&_img]:min-h-0 [&_img]:w-full [&_img]:object-contain [&_img]:select-none"
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
        <div className="flex items-start justify-between gap-2 max-mobile:shrink-0">
          <div className="mt-0 flex min-w-0 flex-col gap-2">
            <h2 className="text-[clamp(23px,4vw,29px)] font-bold tracking-[-1.2px] leading-[1.1] text-balance max-mobile:text-[24px] max-mobile:tracking-[-0.7px]">
              {exercise.exerciseName ?? "Exercise"}
            </h2>
            {lastSet && (
              <p className="text-[12px] font-semibold text-muted-foreground">
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
          <ScrollArea
            type="always"
            className="mx-[-6px] min-h-0 flex-[1_1_0] [&_[data-slot=scroll-area-viewport]]:pl-1.5 [&_[data-slot=scroll-area-viewport]]:pr-3"
          >
            <div className="grid gap-[6px]">
              <AnimatePresence initial={false}>
                {[...exercise.sets].reverse().map((set) => (
                  <motion.div
                    key={set.id}
                    className="flex items-center gap-[10px] rounded-xl border border-border bg-[color-mix(in_srgb,var(--card)_65%,transparent)] py-[10px] pr-2 pl-[14px]"
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
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[14px] font-extrabold tracking-[-0.2px]">
                        {set.weight} {unit} × {set.reps}
                      </strong>
                      <small className="mt-[2px] block text-[10px] font-semibold text-muted-foreground">
                        Set {set.setNumber}
                        {set.isWarmup ? " · warmup" : ""}
                      </small>
                    </span>
                    <button
                      type="button"
                      className="grid size-[34px] place-items-center rounded-[9px] text-muted-foreground hover:bg-[color-mix(in_srgb,var(--destructive)_8%,transparent)] hover:text-destructive"
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

        <div className="mt-[2px] grid gap-3 border-t border-border pt-4 max-mobile:mt-auto max-mobile:shrink-0">
          <div className="grid grid-cols-2 gap-[10px] max-mobile:grid-cols-1">
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-[7px] p-0 text-[11px] font-medium">
                Weight
              </legend>
              <div className="mt-0 flex items-stretch gap-[10px]">
                <button
                  type="button"
                  className="grid min-h-[62px] shrink-0 grow-0 basis-11 touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Decrease weight"
                  onClick={() => nudgeWeight(-2.5)}
                >
                  <Minus size={18} />
                </button>
                <div className="min-w-0 flex-1 rounded-[14px] border border-border bg-background px-2 pt-[6px] pb-[10px] text-center focus-within:border-ring focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_25%,transparent)]">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    inputMode="decimal"
                    className="w-full border-0 bg-transparent p-0 text-center text-[32px] font-bold tracking-[-1.5px] leading-[1.1] text-foreground outline-none [appearance:textfield] [-moz-appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
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
                  <span className="text-[12px] font-extrabold tracking-[1.2px] text-muted-foreground uppercase">
                    {unit}
                  </span>
                </div>
                <button
                  type="button"
                  className="grid min-h-[62px] shrink-0 grow-0 basis-11 touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Increase weight"
                  onClick={() => nudgeWeight(2.5)}
                >
                  <Plus size={18} />
                </button>
              </div>
            </fieldset>
            <fieldset className="m-0 min-w-0 border-0 p-0">
              <legend className="mb-[7px] p-0 text-[11px] font-medium">
                Reps
              </legend>
              <div className="mt-0 flex items-stretch gap-[10px]">
                <button
                  type="button"
                  className="grid min-h-[62px] shrink-0 grow-0 basis-11 touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Decrease reps"
                  onClick={() => nudgeReps(-1)}
                >
                  <Minus size={18} />
                </button>
                <div className="min-w-0 flex-1 rounded-[14px] border border-border bg-background px-2 pt-[6px] pb-[10px] text-center focus-within:border-ring focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--ring)_25%,transparent)]">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    className="w-full border-0 bg-transparent p-0 text-center text-[32px] font-bold tracking-[-1.5px] leading-[1.1] text-foreground outline-none [appearance:textfield] [-moz-appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
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
                  <span className="text-[12px] font-extrabold tracking-[1.2px] text-muted-foreground uppercase">
                    reps
                  </span>
                </div>
                <button
                  type="button"
                  className="grid min-h-[62px] shrink-0 grow-0 basis-11 touch-manipulation place-items-center rounded-[14px] border border-border bg-background text-foreground transition-[background,transform] duration-150 hover:bg-accent active:scale-[0.95] active:bg-accent"
                  aria-label="Increase reps"
                  onClick={() => nudgeReps(1)}
                >
                  <Plus size={18} />
                </button>
              </div>
            </fieldset>
          </div>
          <div className="flex items-stretch gap-2">
            <motion.div
              className="min-w-0 flex-1"
              whileTap={valid ? { scale: 0.98 } : undefined}
            >
              <Button
                className="h-auto min-h-[52px] w-full text-[14px]"
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
        <div className="mt-3 flex items-center justify-between gap-3 max-mobile:hidden">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-border hover:bg-accent disabled:opacity-35"
            aria-label="Previous exercise"
            disabled={index <= 0}
            onClick={() => go(index - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <span
            className="text-[12px] text-muted-foreground tabular-nums"
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
            className="grid size-11 place-items-center rounded-full border border-border hover:bg-accent disabled:opacity-35"
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
  const debouncedSearch = useDebouncedValue(search);
  // Keep the full-screen drawer pinned while the keyboard is open so the
  // keyboard overlays its bottom instead of shoving the top out of view.
  usePinDrawerToVisualViewport(
    open,
    '[data-slot="drawer-content"].exercise-picker-dialog',
  );
  const library = useInfiniteMyExercises({
    search: debouncedSearch || undefined,
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
      <DialogContent className="exercise-picker-dialog flex max-h-[min(88dvh,780px)] flex-col gap-[14px] overflow-hidden sm:max-w-lg [&>button[aria-label=Close]]:hidden [&>*]:shrink-0">
        <DialogTitle className="sr-only">Add exercises</DialogTitle>
        <DialogDescription className="sr-only">
          Browse exercises and add them to your workout.
        </DialogDescription>
        <div className="flex min-h-0 flex-[1_1_0] flex-col gap-[14px] overflow-hidden">
          {selected.length > 0 && (
            <ScrollArea
              className="h-9 shrink-0 grow-0 basis-9"
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
                      className="h-[26px] max-w-[180px] cursor-pointer text-[10px] hover:bg-accent [&_svg]:shrink-0"
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
            className="min-h-[80px] flex-[1_1_0] overflow-hidden overscroll-contain max-mobile:-mx-[18px] max-mobile:w-[calc(100%+36px)]"
            role="region"
            aria-label="Exercise library"
            type="always"
          >
            <div className="flex flex-col gap-3 pt-1 pr-1 pb-2 pl-0 max-mobile:pr-[28px] max-mobile:pl-[18px]">
              {library.isPending && <ExercisePickerSkeleton count={6} />}
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
              <div className="grid grid-cols-2 items-stretch gap-3">
                {exercises.map((exercise) => {
                  const checked = selected.some(
                    (item) => item.id === exercise.id,
                  );
                  return (
                    <article
                      key={exercise.id}
                      className="group relative flex min-w-0 cursor-pointer flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--foreground)_28%,var(--border))] focus-within:outline-2 focus-within:outline-solid focus-within:outline-ring focus-within:-outline-offset-2 data-[selected=true]:border-ring data-[selected=true]:bg-accent"
                      data-selected={checked}
                    >
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 flex-col gap-0 text-left"
                        aria-label={`${checked ? "Deselect" : "Select"} ${exercise.name}`}
                        disabled={
                          add.isPending || (!checked && selected.length >= 50)
                        }
                        onClick={() => toggle(exercise)}
                      >
                        <span className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#f5f7fa] [&_img]:h-full [&_img]:w-full [&_img]:object-contain [&_img]:transition-transform [&_img]:duration-200 group-hover:[&_img]:scale-[1.035]">
                          <img
                            src={exercise.gifUrl ?? exercise.imageUrl ?? ""}
                            alt=""
                            loading="lazy"
                          />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-2 px-[14px] pt-3 pb-[14px]">
                          <span className="min-w-0">
                            <strong className="line-clamp-2 text-[14px] leading-[1.35] font-semibold">
                              {exercise.name}
                            </strong>
                            <span className="text-[12px] leading-[1.4] text-muted-foreground capitalize">
                              {exercise.muscleGroup} · {exercise.equipment}
                            </span>
                          </span>
                          <span className="mt-auto flex flex-wrap gap-[6px] pt-[2px]">
                            <Badge
                              variant="outline"
                              className="max-w-full truncate text-[11px] capitalize"
                            >
                              {exercise.target || exercise.muscleGroup}
                            </Badge>
                            {exercise.isCompound ? (
                              <Badge
                                variant="secondary"
                                className="text-[11px]"
                              >
                                Compound
                              </Badge>
                            ) : null}
                          </span>
                        </span>
                      </button>
                      <AnimatePresence initial={false}>
                        {checked && (
                          <motion.span
                            className="absolute top-[14px] right-[14px] z-[2] grid size-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_2px_7px_rgb(0_0_0/0.25)] pointer-events-none [&_svg]:size-[13px] [&_svg]:stroke-[3]"
                            initial={{ scale: 0, rotate: -35 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 35 }}
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
                <InlineNote>No matches.</InlineNote>
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
        <div className="flex items-center gap-[10px] border-t border-border pt-3 max-mobile:flex-nowrap">
          <SearchBar
            aria-label="Search exercises to add"
            placeholder="Search exercises…"
            value={search}
            disabled={add.isPending}
            onValueChange={setSearch}
            containerClassName="min-w-0 flex-[1_1_0]"
          />
          <Button
            className="min-h-11 shrink-0"
            disabled={!selected.length || add.isPending}
            onClick={() => void submit()}
          >
            <Plus size={16} />
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
