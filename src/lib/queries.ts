import {
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { apiFetch } from "@/lib/api";

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type Exercise = {
  id: number;
  externalId: string | null;
  name: string;
  alias: string | null;
  muscleGroup: string;
  equipment: string;
  target: string | null;
  secondaryMuscles: string | null;
  instructionsEn: string | null;
  gifUrl: string | null;
  isCompound: boolean;
  imageUrl: string | null;
};

export type Split = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type SplitDayExercise = {
  id: number;
  splitDayId: number;
  exerciseId: number;
  orderIndex: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
};

export type SplitDay = {
  id: number;
  splitId: number;
  name: string;
  orderIndex: number;
};

export type SplitDetail = Split & {
  days: {
    id: number;
    name: string;
    orderIndex: number;
    exercises: {
      splitDayExerciseId: number;
      exerciseId: number;
      exerciseName: string | null;
      target?: string | null;
      imageUrl?: string | null;
      gifUrl?: string | null;
      orderIndex: number;
      targetSets: number;
      targetRepMin: number;
      targetRepMax: number;
    }[];
  }[];
};

export type User = {
  id: number;
  clerkId: string | null;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredUnit: "kg" | "lb";
  heightCm: number | null;
  createdAt: string;
};

export type Workout = {
  id: number;
  userId: number;
  userName: string | null;
  splitDayId: number | null;
  name: string;
  startedAt: string;
  completedAt: string | null;
  status: "in_progress" | "completed";
  notes: string | null;
};

export type BodyWeight = {
  id: number;
  userId: number;
  userName: string | null;
  weight: string;
  recordedAt: string;
  notes: string | null;
};

export type Stats = {
  exercises: number;
  splits: number;
  users: number;
  admins: number;
  workouts: number;
  completedWorkouts: number;
  sets: number;
  bodyWeights: number;
};

export const queryKeys = {
  stats: ["stats"] as const,
  exercises: (params: Record<string, unknown>) =>
    ["exercises", params] as const,
  splits: ["splits"] as const,
  split: (id: number) => ["splits", id] as const,
  users: (params: Record<string, unknown>) => ["users", params] as const,
  workouts: (params: Record<string, unknown>) => ["workouts", params] as const,
  bodyWeights: (params: Record<string, unknown>) =>
    ["body-weights", params] as const,
};

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => apiFetch<{ data: Stats }>("/api/stats"),
  });
}

export function useExercises(params: {
  page: number;
  pageSize?: number;
  search?: string;
  muscleGroup?: string;
  equipment?: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 25),
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
    queryKey: queryKeys.exercises(params),
    queryFn: () =>
      apiFetch<Paginated<Exercise>>(`/api/exercises?${query.toString()}`),
  });
}

export function useSplits() {
  return useQuery({
    queryKey: queryKeys.splits,
    queryFn: () => apiFetch<{ data: Split[] }>("/api/splits"),
  });
}

export function useSplit(id: number | null) {
  return useQuery({
    queryKey: queryKeys.split(id ?? 0),
    queryFn: () => apiFetch<{ data: SplitDetail }>(`/api/splits/${id}`),
    enabled: id !== null,
  });
}

export function useUsers(params: {
  page: number;
  pageSize?: number;
  search?: string;
}) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 25),
  });
  if (params.search) {
    query.set("search", params.search);
  }
  return useQuery({
    queryKey: queryKeys.users(params),
    queryFn: () => apiFetch<Paginated<User>>(`/api/users?${query.toString()}`),
  });
}

export function useWorkouts(params: { page: number; pageSize?: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 25),
  });
  return useQuery({
    queryKey: queryKeys.workouts(params),
    queryFn: () =>
      apiFetch<Paginated<Workout>>(`/api/workouts?${query.toString()}`),
  });
}

export function useBodyWeights(params: { page: number; pageSize?: number }) {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize ?? 25),
  });
  return useQuery({
    queryKey: queryKeys.bodyWeights(params),
    queryFn: () =>
      apiFetch<Paginated<BodyWeight>>(`/api/body-weights?${query.toString()}`),
  });
}

function useInvalidator() {
  const queryClient = useQueryClient();
  return (keys: readonly unknown[][]) => {
    for (const key of keys) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };
}

type MutationHook = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  invalidate: readonly unknown[][],
) => UseMutationResult<TData, Error, TVariables>;

const useAppMutation: MutationHook = (mutationFn, invalidate) => {
  const invalidateKeys = useInvalidator();
  return useMutation({
    mutationFn,
    onSuccess: () => invalidateKeys(invalidate),
  });
};

export function useCreateExercise() {
  return useAppMutation(
    (values: Omit<Exercise, "id">) =>
      apiFetch<{ data: Exercise }>("/api/exercises", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    [["exercises"], queryKeys.stats],
  );
}

export function useUpdateExercise() {
  return useAppMutation(
    ({ id, ...values }: Omit<Exercise, "id"> & { id: number }) =>
      apiFetch<{ data: Exercise }>(`/api/exercises/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    [["exercises"], queryKeys.stats],
  );
}

export function useDeleteExercise() {
  return useAppMutation(
    (id: number) =>
      apiFetch<{ data: Exercise }>(`/api/exercises/${id}`, {
        method: "DELETE",
      }),
    [["exercises"], queryKeys.stats],
  );
}

export function useCreateSplit() {
  return useAppMutation(
    (values: { name: string; description?: string }) =>
      apiFetch<{ data: Split }>("/api/splits", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useUpdateSplit() {
  return useAppMutation(
    ({ id, ...values }: { id: number; name?: string; description?: string }) =>
      apiFetch<{ data: Split }>(`/api/splits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useDeleteSplit() {
  return useAppMutation(
    (id: number) => apiFetch(`/api/splits/${id}`, { method: "DELETE" }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useCreateSplitDay() {
  return useAppMutation(
    ({
      splitId,
      ...values
    }: {
      splitId: number;
      name: string;
      orderIndex: number;
    }) =>
      apiFetch<{ data: SplitDay }>(`/api/splits/${splitId}/days`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useDeleteSplitDay() {
  return useAppMutation(
    (dayId: number) =>
      apiFetch(`/api/splits/days/${dayId}`, { method: "DELETE" }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useCreateSplitDayExercise() {
  return useAppMutation(
    ({
      dayId,
      ...values
    }: {
      dayId: number;
      exerciseId: number;
      orderIndex: number;
      targetSets: number;
      targetRepMin: number;
      targetRepMax: number;
    }) =>
      apiFetch(`/api/splits/days/${dayId}/exercises`, {
        method: "POST",
        body: JSON.stringify(values),
      }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useDeleteSplitDayExercise() {
  return useAppMutation(
    (id: number) =>
      apiFetch(`/api/splits/day-exercises/${id}`, { method: "DELETE" }),
    [queryKeys.splits, queryKeys.stats],
  );
}

export function useUpdateUser() {
  return useAppMutation(
    ({
      id,
      ...values
    }: {
      id: number;
      name?: string;
      role?: "user" | "admin";
      preferredUnit?: "kg" | "lb";
      heightCm?: number | null;
    }) =>
      apiFetch<{ data: User }>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    [["users"], queryKeys.stats],
  );
}

export function useDeleteUser() {
  return useAppMutation(
    (id: number) => apiFetch(`/api/users/${id}`, { method: "DELETE" }),
    [["users"], queryKeys.stats],
  );
}
