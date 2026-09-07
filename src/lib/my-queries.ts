import {
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useRef } from "react";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import {
  dequeueOutboxByKey,
  enqueueOutbox,
  type MutationDescriptor,
} from "@/lib/outbox";
import type { Exercise, Paginated, SplitDetail } from "@/lib/queries";

export type MySplit = {
  id: number;
  userId: number | null;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
};

export type MyWorkout = {
  id: number;
  userId: number;
  splitDayId: number | null;
  name: string;
  startedAt: string;
  completedAt: string | null;
  status: "in_progress" | "completed";
  notes: string | null;
};

export type MySet = {
  id: number;
  workoutExerciseId: number;
  setNumber: number;
  weight: string;
  reps: number;
  rpe: string | null;
  isWarmup: boolean;
  completed: boolean;
};

export type MyWorkoutSummary = MyWorkout & {
  exerciseCount: number;
  setCount: number;
  volume: number;
};

export type MyWorkoutExercise = {
  id: number;
  exerciseId: number;
  exerciseName: string | null;
  target?: string | null;
  imageUrl?: string | null;
  gifUrl?: string | null;
  orderIndex: number;
  notes: string | null;
  sets: MySet[];
};

export type MyWorkoutDetail = MyWorkout & {
  exercises: MyWorkoutExercise[];
};

export type MyBodyWeight = {
  id: number;
  userId: number;
  weight: string;
  recordedAt: string;
  notes: string | null;
  createdAt: string;
};

export type MySummary = {
  activeSplit: MySplit | null;
  activeWorkout: MyWorkout | null;
  totals: {
    workouts: number;
    completedWorkouts: number;
    weekWorkouts: number;
    sets: number;
  };
  latestBodyWeight: MyBodyWeight | null;
};

export type TrainingAnalytics = {
  periodWeeks: number;
  weekly: {
    key: string;
    label: string;
    hardSets: number;
    reps: number;
    volume: number;
  }[];
  muscleGroups: {
    muscleGroup: string;
    sessionsPerWeek: number;
    setsPerWeek: number;
    totalSets: number;
    totalVolume: number;
  }[];
  exercises: {
    exerciseId: number;
    name: string;
    muscleGroup: string;
    current: ExercisePerformance;
    previous: ExercisePerformance | null;
    estimated1rmChange: number | null;
  }[];
  totals: { hardSets: number; reps: number; volume: number };
};

export type ExercisePerformance = {
  date: string;
  weight: number;
  reps: number;
  estimated1rm: number;
  totalReps: number;
  volume: number;
};

export type Me = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredUnit: "kg" | "lb";
};

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ data: Me }>("/api/me"),
    retry: false,
  });
}

export function useMySummary() {
  return useQuery({
    queryKey: ["my", "summary"],
    queryFn: () => apiFetch<{ data: MySummary }>("/api/my/summary"),
  });
}

export function useMyActivity() {
  return useQuery({
    queryKey: ["my", "activity"],
    queryFn: () =>
      apiFetch<{
        data: Pick<MyWorkout, "id" | "name" | "startedAt" | "completedAt">[];
      }>("/api/my/activity"),
  });
}

export function useMyAnalytics(weeks: number) {
  return useQuery({
    queryKey: ["my", "analytics", weeks],
    queryFn: () =>
      apiFetch<{ data: TrainingAnalytics }>(`/api/my/analytics?weeks=${weeks}`),
  });
}

export function useMyExercises(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  muscleGroup?: string;
  equipment?: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    pageSize: String(params.pageSize ?? 50),
  });
  if (params.search) {
    query.set("search", params.search);
  }
  if (params.muscleGroup) {
    query.set("muscleGroup", params.muscleGroup);
  }
  if (params.equipment) {
    query.set("equipment", params.equipment);
  }
  return useQuery({
    queryKey: ["my", "exercises", params],
    queryFn: () =>
      apiFetch<Paginated<Exercise>>(`/api/my/exercises?${query.toString()}`),
  });
}

export function useInfiniteMyExercises(params: {
  pageSize?: number;
  search?: string;
  muscleGroup?: string;
  equipment?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["my", "exercises", "infinite", params],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams({
        page: String(pageParam),
        pageSize: String(params.pageSize ?? 30),
      });
      if (params.search) query.set("search", params.search);
      if (params.muscleGroup) query.set("muscleGroup", params.muscleGroup);
      if (params.equipment) query.set("equipment", params.equipment);
      return apiFetch<Paginated<Exercise>>(
        `/api/my/exercises?${query.toString()}`,
      );
    },
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.pageSize < lastPage.total
        ? lastPage.page + 1
        : undefined,
  });
}

export function useMyTemplates() {
  return useQuery({
    queryKey: ["my", "templates"],
    queryFn: () => apiFetch<{ data: MySplit[] }>("/api/my/templates"),
  });
}

export function useMyTemplate(id: number | null) {
  return useQuery({
    queryKey: ["my", "templates", id ?? 0],
    queryFn: () => apiFetch<{ data: SplitDetail }>(`/api/my/templates/${id}`),
    enabled: id !== null,
  });
}

export function useMySplits() {
  return useQuery({
    queryKey: ["my", "splits"],
    queryFn: () => apiFetch<{ data: MySplit[] }>("/api/my/splits"),
  });
}

export function useMySplit(id: number | null) {
  return useQuery({
    queryKey: ["my", "splits", id ?? 0],
    queryFn: () => apiFetch<{ data: SplitDetail }>(`/api/my/splits/${id}`),
    enabled: id !== null,
  });
}

export function useMyWorkouts(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  status?: "in_progress" | "completed";
}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1) });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return useQuery({
    queryKey: ["my", "workouts", params],
    queryFn: () =>
      apiFetch<Paginated<MyWorkoutSummary>>(
        `/api/my/workouts?${query.toString()}`,
      ),
  });
}

export function useBulkDeleteWorkouts() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      apiFetch<{ data: { id: number }[] }>("/api/my/workouts/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ["my"] });
    },
  });
}

export function useMyWorkout(id: number | null) {
  return useQuery({
    queryKey: ["my", "workouts", id ?? 0],
    queryFn: () =>
      apiFetch<{ data: MyWorkoutDetail }>(`/api/my/workouts/${id}`),
    enabled: id !== null,
  });
}

export function useMyBodyWeights(params?: { page?: number }) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: "30",
  });
  return useQuery({
    queryKey: ["my", "body-weights", params?.page ?? 1],
    queryFn: () =>
      apiFetch<Paginated<MyBodyWeight>>(
        `/api/my/body-weights?${query.toString()}`,
      ),
  });
}

// ---------------------------------------------------------------------------
// Local-first mutation layer.
// Every mutation declares a serializable descriptor (for the offline outbox)
// plus an optimistic cache patch (for instant UI). The flow per tap:
//
//   onMutate  → fresh idempotency key → snapshot cache → apply optimistic
//               patch → enqueue descriptor in the outbox
//   onSuccess → dequeue → invalidate ["my"]/["me"] (server is truth)
//   onError   → offline? keep optimistic state, stay queued, toast info
//               : rollback snapshot, dequeue, let callers toast the error
// ---------------------------------------------------------------------------

type Snapshot = Array<{ key: readonly unknown[]; data: unknown }>;

type MutationContext = { snapshot: Snapshot; key: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function myQueries(client: QueryClient) {
  return client
    .getQueryCache()
    .findAll({
      predicate: (query) =>
        query.queryKey[0] === "my" || query.queryKey[0] === "me",
    })
    .filter((query) => query.state.status === "success");
}

/** Rewrite cached query data in place; skips queries the updater leaves alone. */
function updateMyCaches(
  client: QueryClient,
  updater: (queryKey: readonly unknown[], data: unknown) => unknown,
): void {
  for (const query of myQueries(client)) {
    const next = updater(query.queryKey, query.state.data);
    if (next !== query.state.data) {
      client.setQueryData(query.queryKey, next);
    }
  }
}

function snapshotMyCaches(client: QueryClient): Snapshot {
  return myQueries(client).map((query) => ({
    key: query.queryKey,
    data: query.state.data,
  }));
}

function restoreSnapshot(client: QueryClient, snapshot: Snapshot): void {
  for (const entry of snapshot) {
    client.setQueryData(entry.key, entry.data);
  }
}

/** Map the `{ data: T }` envelope most endpoints return. */
function mapEnvelope<T>(cached: unknown, fn: (data: T) => T): unknown {
  if (!isRecord(cached) || !("data" in cached)) {
    return cached;
  }
  return { ...cached, data: fn(cached.data as T) };
}

/** Map a `Paginated<T>` envelope's items (optionally shifting `total`). */
function mapPage<T>(
  cached: unknown,
  fn: (items: T[]) => T[],
  totalDelta = 0,
): unknown {
  if (!isRecord(cached) || !Array.isArray(cached.data)) {
    return cached;
  }
  const items = fn(cached.data as T[]);
  const total =
    typeof cached.total === "number"
      ? Math.max(0, (cached.total as number) + totalDelta)
      : cached.total;
  return { ...cached, data: items, total };
}

function patchSummary(
  client: QueryClient,
  fn: (summary: MySummary) => MySummary,
): void {
  updateMyCaches(client, (queryKey, data) =>
    queryKey[1] === "summary" ? mapEnvelope(data, fn) : data,
  );
}

/** Patch every cached workout-detail containing the given exercise. */
function patchWorkoutDetails(
  client: QueryClient,
  fn: (detail: MyWorkoutDetail) => MyWorkoutDetail,
): void {
  updateMyCaches(client, (queryKey, data) =>
    queryKey[1] === "workouts" && typeof queryKey[2] === "number"
      ? mapEnvelope(data, fn)
      : data,
  );
}

function patchWorkoutLists(
  client: QueryClient,
  fn: (items: MyWorkout[]) => MyWorkout[],
  totalDelta = 0,
): void {
  updateMyCaches(client, (queryKey, data) =>
    queryKey[1] === "workouts" && typeof queryKey[2] !== "number"
      ? mapPage(data, fn, totalDelta)
      : data,
  );
}

function tempId(): number {
  return -Math.floor(Math.random() * 1_000_000_000) - 1;
}

function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-${Date.now()}-${Math.floor(Math.random() * 1_000_000_000)}`;
}

function isOfflineError(error: unknown): boolean {
  if (error instanceof TypeError) {
    // fetch() itself failed: no response was ever received.
    return true;
  }
  return typeof navigator !== "undefined" && !navigator.onLine;
}

function findExerciseName(
  client: QueryClient,
  exerciseId: number,
): string | null {
  for (const query of myQueries(client)) {
    if (query.queryKey[1] !== "exercises" || !isRecord(query.state.data)) {
      continue;
    }
    const items = (query.state.data as { data?: unknown }).data;
    if (!Array.isArray(items)) {
      continue;
    }
    for (const item of items) {
      if (
        isRecord(item) &&
        item.id === exerciseId &&
        typeof item.name === "string"
      ) {
        return item.name;
      }
    }
  }
  return null;
}

function useMyMutation<TData, TVariables>(
  toDescriptor: (variables: TVariables) => MutationDescriptor,
  optimistic?: (client: QueryClient, variables: TVariables) => void,
) {
  const queryClient = useQueryClient();
  const keyRef = useRef("");
  return useMutation<TData, Error, TVariables, MutationContext>({
    mutationFn: async (variables) => {
      const descriptor = toDescriptor(variables);
      return apiFetch<TData>(descriptor.path, {
        method: descriptor.method,
        body: descriptor.body,
        headers: keyRef.current
          ? { "Idempotency-Key": keyRef.current }
          : undefined,
      });
    },
    onMutate: async (variables) => {
      keyRef.current = newIdempotencyKey();
      await queryClient.cancelQueries({ queryKey: ["my"] });
      await queryClient.cancelQueries({ queryKey: ["me"] });
      const snapshot = snapshotMyCaches(queryClient);
      optimistic?.(queryClient, variables);
      const descriptor = toDescriptor(variables);
      await enqueueOutbox({
        key: keyRef.current,
        method: descriptor.method,
        path: descriptor.path,
        body: descriptor.body,
        label: descriptor.label,
      });
      return { snapshot, key: keyRef.current };
    },
    onError: (error, _variables, context) => {
      if (!context) {
        return;
      }
      if (isOfflineError(error)) {
        // Queued + optimistic state kept: the outbox syncs on reconnect.
        toast.info("Offline — will sync.");
        return;
      }
      restoreSnapshot(queryClient, context.snapshot);
      void dequeueOutboxByKey(context.key);
    },
    onSuccess: (_data, _variables, context) => {
      if (context) {
        void dequeueOutboxByKey(context.key);
      }
      void queryClient.invalidateQueries({ queryKey: ["my"] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useCloneTemplate() {
  return useMyMutation<{ data: MySplit }, { templateId: number }>(
    (variables) => ({
      method: "POST",
      path: "/api/my/splits/clone",
      body: JSON.stringify(variables),
      label: "Clone training plan",
    }),
  );
}

export function useUpdateMySplit() {
  return useMyMutation<
    { data: MySplit },
    {
      id: number;
      name?: string;
      description?: string | null;
      isActive?: boolean;
    }
  >(
    ({ id, ...values }) => ({
      method: "PATCH",
      path: `/api/my/splits/${id}`,
      body: JSON.stringify(values),
      label: "Update training plan",
    }),
    (client, { id, ...values }) => {
      updateMyCaches(client, (queryKey, data) => {
        if (queryKey[1] === "splits" && typeof queryKey[2] !== "number") {
          return mapPage<MySplit>(data, (items) =>
            items.map((split) =>
              split.id === id ? { ...split, ...values } : split,
            ),
          );
        }
        if (queryKey[1] === "splits" && queryKey[2] === id) {
          return mapEnvelope<Record<string, unknown>>(data, (detail) => ({
            ...detail,
            ...values,
          }));
        }
        return data;
      });
      patchSummary(client, (summary) =>
        summary.activeSplit?.id === id
          ? { ...summary, activeSplit: { ...summary.activeSplit, ...values } }
          : summary,
      );
    },
  );
}

export function useDeleteMySplit() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "DELETE",
      path: `/api/my/splits/${id}`,
      label: "Delete training plan",
    }),
    (client, id) => {
      updateMyCaches(client, (queryKey, data) =>
        queryKey[1] === "splits" && typeof queryKey[2] !== "number"
          ? mapPage<MySplit>(
              data,
              (items) => items.filter((split) => split.id !== id),
              -1,
            )
          : data,
      );
      patchSummary(client, (summary) =>
        summary.activeSplit?.id === id
          ? { ...summary, activeSplit: null }
          : summary,
      );
    },
  );
}

export function useStartWorkout() {
  return useMyMutation<
    { data: MyWorkoutDetail },
    { name: string; splitDayId?: number | null }
  >(
    (variables) => ({
      method: "POST",
      path: "/api/my/workouts",
      body: JSON.stringify(variables),
      label: `Start workout ${variables.name}`,
    }),
    (client, variables) => {
      const now = new Date().toISOString();
      const temp: MyWorkout = {
        id: tempId(),
        userId: 0,
        splitDayId: variables.splitDayId ?? null,
        name: variables.name,
        startedAt: now,
        completedAt: null,
        status: "in_progress",
        notes: null,
      };
      patchSummary(client, (summary) => ({
        ...summary,
        activeWorkout: temp,
        totals: {
          ...summary.totals,
          workouts: summary.totals.workouts + 1,
        },
      }));
      patchWorkoutLists(client, (items) => [{ ...temp }, ...items], 1);
    },
  );
}

export function useCompleteWorkout() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "POST",
      path: `/api/my/workouts/${id}/complete`,
      label: "Complete workout",
    }),
    (client, id) => {
      const now = new Date().toISOString();
      patchSummary(client, (summary) => ({
        ...summary,
        activeWorkout:
          summary.activeWorkout?.id === id ? null : summary.activeWorkout,
        totals: {
          ...summary.totals,
          completedWorkouts: summary.totals.completedWorkouts + 1,
        },
      }));
      patchWorkoutLists(client, (items) =>
        items.map((workout) =>
          workout.id === id
            ? { ...workout, status: "completed", completedAt: now }
            : workout,
        ),
      );
      patchWorkoutDetails(client, (detail) =>
        detail.id === id
          ? { ...detail, status: "completed", completedAt: now }
          : detail,
      );
    },
  );
}

export function useDeleteWorkout() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "DELETE",
      path: `/api/my/workouts/${id}`,
      label: "Delete workout",
    }),
    (client, id) => {
      let removed: MyWorkout | null = null;
      patchWorkoutLists(
        client,
        (items) => {
          removed = items.find((workout) => workout.id === id) ?? null;
          return items.filter((workout) => workout.id !== id);
        },
        -1,
      );
      patchSummary(client, (summary) => ({
        ...summary,
        activeWorkout:
          summary.activeWorkout?.id === id ? null : summary.activeWorkout,
        totals: {
          ...summary.totals,
          workouts: Math.max(0, summary.totals.workouts - 1),
          completedWorkouts:
            removed?.status === "completed"
              ? Math.max(0, summary.totals.completedWorkouts - 1)
              : summary.totals.completedWorkouts,
        },
      }));
    },
  );
}

export function useAddWorkoutExercise() {
  return useMyMutation<unknown, { workoutId: number; exerciseId: number }>(
    ({ workoutId, exerciseId }) => ({
      method: "POST",
      path: `/api/my/workouts/${workoutId}/exercises`,
      body: JSON.stringify({ exerciseId }),
      label: "Add exercise",
    }),
    (client, { workoutId, exerciseId }) => {
      const name = findExerciseName(client, exerciseId);
      patchWorkoutDetails(client, (detail) =>
        detail.id === workoutId
          ? {
              ...detail,
              exercises: [
                ...detail.exercises,
                {
                  id: tempId(),
                  exerciseId,
                  exerciseName: name,
                  orderIndex: detail.exercises.length,
                  notes: null,
                  sets: [],
                },
              ],
            }
          : detail,
      );
    },
  );
}

export function useRemoveWorkoutExercise() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "DELETE",
      path: `/api/my/workout-exercises/${id}`,
      label: "Remove exercise",
    }),
    (client, id) => {
      patchWorkoutDetails(client, (detail) => ({
        ...detail,
        exercises: detail.exercises.filter((exercise) => exercise.id !== id),
      }));
    },
  );
}

export function useLogSet() {
  return useMyMutation<
    unknown,
    {
      workoutExerciseId: number;
      weight: number;
      reps: number;
      isWarmup?: boolean;
    }
  >(
    ({ workoutExerciseId, weight, reps, isWarmup }) => ({
      method: "POST",
      path: `/api/my/workout-exercises/${workoutExerciseId}/sets`,
      body: JSON.stringify({ weight, reps, isWarmup: isWarmup ?? false }),
      label: `Log set ${weight}×${reps}`,
    }),
    (client, { workoutExerciseId, weight, reps, isWarmup }) => {
      patchWorkoutDetails(client, (detail) => ({
        ...detail,
        exercises: detail.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) {
            return exercise;
          }
          const setNumber =
            exercise.sets.reduce(
              (max, set) => Math.max(max, set.setNumber),
              0,
            ) + 1;
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: tempId(),
                workoutExerciseId,
                setNumber,
                weight: String(weight),
                reps,
                rpe: null,
                isWarmup: isWarmup ?? false,
                completed: true,
              },
            ],
          };
        }),
      }));
      patchSummary(client, (summary) => ({
        ...summary,
        totals: { ...summary.totals, sets: summary.totals.sets + 1 },
      }));
    },
  );
}

export function useDeleteSet() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "DELETE",
      path: `/api/my/sets/${id}`,
      label: "Delete set",
    }),
    (client, id) => {
      patchWorkoutDetails(client, (detail) => ({
        ...detail,
        exercises: detail.exercises.map((exercise) => ({
          ...exercise,
          sets: exercise.sets.filter((set) => set.id !== id),
        })),
      }));
      patchSummary(client, (summary) => ({
        ...summary,
        totals: {
          ...summary.totals,
          sets: Math.max(0, summary.totals.sets - 1),
        },
      }));
    },
  );
}

export function useLogBodyWeight() {
  return useMyMutation<
    { data: MyBodyWeight },
    { weight: number; recordedAt: string; notes?: string }
  >(
    (variables) => ({
      method: "POST",
      path: "/api/my/body-weights",
      body: JSON.stringify(variables),
      label: `Log weigh-in ${variables.weight}`,
    }),
    (client, variables) => {
      const temp: MyBodyWeight = {
        id: tempId(),
        userId: 0,
        weight: String(variables.weight),
        recordedAt: variables.recordedAt,
        notes: variables.notes ?? null,
        createdAt: new Date().toISOString(),
      };
      updateMyCaches(client, (queryKey, data) =>
        queryKey[1] === "body-weights" && queryKey[2] === 1
          ? mapPage<MyBodyWeight>(
              data,
              (items) =>
                items.some((entry) => entry.recordedAt === temp.recordedAt)
                  ? items.map((entry) =>
                      entry.recordedAt === temp.recordedAt ? temp : entry,
                    )
                  : [temp, ...items],
              itemsHave(data, temp.recordedAt) ? 0 : 1,
            )
          : data,
      );
      patchSummary(client, (summary) => ({
        ...summary,
        latestBodyWeight: temp,
      }));
    },
  );
}

function itemsHave(cached: unknown, recordedAt: string): boolean {
  if (!isRecord(cached) || !Array.isArray(cached.data)) {
    return false;
  }
  return (cached.data as MyBodyWeight[]).some(
    (entry) => entry.recordedAt === recordedAt,
  );
}

export function useDeleteBodyWeight() {
  return useMyMutation<unknown, number>(
    (id) => ({
      method: "DELETE",
      path: `/api/my/body-weights/${id}`,
      label: "Delete weigh-in",
    }),
    (client, id) => {
      let nextFirst: MyBodyWeight | null = null;
      updateMyCaches(client, (queryKey, data) => {
        if (queryKey[1] !== "body-weights") {
          return data;
        }
        const next = mapPage<MyBodyWeight>(
          data,
          (items) => items.filter((entry) => entry.id !== id),
          -1,
        );
        if (queryKey[2] === 1 && isRecord(next) && Array.isArray(next.data)) {
          nextFirst = (next.data as MyBodyWeight[])[0] ?? null;
        }
        return next;
      });
      patchSummary(client, (summary) =>
        summary.latestBodyWeight?.id === id
          ? { ...summary, latestBodyWeight: nextFirst }
          : summary,
      );
    },
  );
}

export function useReorderWorkoutExercises() {
  return useMyMutation<unknown, { workoutId: number; exerciseIds: number[] }>(
    ({ workoutId, exerciseIds }) => ({
      method: "PATCH",
      path: `/api/my/workouts/${workoutId}/exercises/order`,
      body: JSON.stringify({ exerciseIds }),
      label: "Reorder exercises",
    }),
    (client, { workoutId, exerciseIds }) => {
      patchWorkoutDetails(client, (detail) => {
        if (detail.id !== workoutId) return detail;
        const positions = new Map(exerciseIds.map((id, index) => [id, index]));
        return {
          ...detail,
          exercises: detail.exercises
            .map((exercise) => ({
              ...exercise,
              orderIndex: positions.get(exercise.id) ?? exercise.orderIndex,
            }))
            .sort((a, b) => a.orderIndex - b.orderIndex),
        };
      });
    },
  );
}

export function useAddWorkoutExercises() {
  return useMyMutation<unknown, { workoutId: number; exercises: Exercise[] }>(
    ({ workoutId, exercises }) => ({
      method: "POST",
      path: `/api/my/workouts/${workoutId}/exercises/batch`,
      body: JSON.stringify({
        exerciseIds: exercises.map((exercise) => exercise.id),
      }),
      label: "Add exercises",
    }),
    (client, { workoutId, exercises }) => {
      patchWorkoutDetails(client, (detail) => {
        if (detail.id !== workoutId) return detail;
        const start =
          Math.max(
            -1,
            ...detail.exercises.map((exercise) => exercise.orderIndex),
          ) + 1;
        return {
          ...detail,
          exercises: [
            ...detail.exercises,
            ...exercises.map((exercise, index) => ({
              id: tempId(),
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              imageUrl: exercise.imageUrl,
              gifUrl: exercise.gifUrl,
              orderIndex: start + index,
              notes: null,
              sets: [],
            })),
          ],
        };
      });
    },
  );
}
