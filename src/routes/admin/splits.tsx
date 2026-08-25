import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { apiFetch, formatError } from "#/lib/api";

import { useApi } from "../admin";

type SplitDayExercise = {
  splitDayExerciseId: number;
  exerciseName: string | null;
  orderIndex: number;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
};

type SplitDay = {
  id: number;
  name: string;
  orderIndex: number;
  exercises: SplitDayExercise[];
};

type Split = {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  days?: SplitDay[];
};

type Exercise = { id: number; name: string };

export const Route = createFileRoute("/admin/splits")({
  component: AdminSplits,
});

function AdminSplits() {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const splits = useApi<{ data: Split[] }>("/api/splits");
  const exercises = useApi<{ data: Exercise[] }>("/api/exercises?pageSize=100");
  const [detail, setDetail] = useState<Split | null>(null);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      await splits.refetch();
      if (expandedId !== null) {
        const response = await apiFetch<{ data: Split }>(
          `/api/splits/${expandedId}`,
        );
        setDetail(response.data);
      }
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setSaving(false);
    }
  }

  async function expand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(id);
    try {
      const response = await apiFetch<{ data: Split }>(`/api/splits/${id}`);
      setDetail(response.data);
    } catch (caught) {
      setError(formatError(caught));
    }
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Split templates</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <details className="mb-4 rounded-xl border p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Add split template
        </summary>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(async () => {
              await apiFetch("/api/splits", {
                method: "POST",
                body: JSON.stringify({
                  name: name.trim(),
                  description: description.trim() || undefined,
                }),
              });
              setName("");
              setDescription("");
            });
          }}
        >
          <label className="text-xs">
            Name
            <input
              className="mt-1 block rounded-lg border px-3 py-1.5 text-sm"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="flex-1 text-xs">
            Description
            <input
              className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button
            className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            disabled={saving}
            type="submit"
          >
            Create
          </button>
        </form>
      </details>

      {splits.loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <div className="space-y-3">
          {splits.data?.data.map((split) => (
            <div key={split.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold">{split.name}</p>
                  <p className="text-sm opacity-70">{split.description}</p>
                </div>
                <button
                  className="text-sm underline"
                  onClick={() => expand(split.id)}
                  type="button"
                >
                  {expandedId === split.id ? "Collapse" : "Manage days"}
                </button>
                <button
                  className="text-sm text-red-600 underline"
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete split "${split.name}"?`)) {
                      run(() =>
                        apiFetch(`/api/splits/${split.id}`, {
                          method: "DELETE",
                        }),
                      );
                    }
                  }}
                >
                  Delete
                </button>
              </div>

              {expandedId === split.id && (
                <div className="mt-4 border-t pt-4">
                  {!detail ? (
                    <p className="text-sm opacity-70">Loading days…</p>
                  ) : (
                    <div className="space-y-4">
                      {detail.days?.map((day) => (
                        <DayEditor
                          key={day.id}
                          day={day}
                          exercises={exercises.data?.data ?? []}
                          saving={saving}
                          onRun={run}
                        />
                      ))}

                      <AddDayForm
                        saving={saving}
                        onRun={run}
                        splitId={split.id}
                        nextOrderIndex={detail.days?.length ?? 0}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DayEditor({
  day,
  exercises,
  saving,
  onRun,
}: {
  day: SplitDay;
  exercises: Exercise[];
  saving: boolean;
  onRun: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState(3);
  const [repMin, setRepMin] = useState(8);
  const [repMax, setRepMax] = useState(12);

  return (
    <div className="rounded-lg bg-black/5 p-3">
      <div className="mb-2 flex items-center gap-3">
        <p className="flex-1 text-sm font-semibold">{day.name}</p>
        <button
          className="text-xs text-red-600 underline"
          type="button"
          onClick={() =>
            onRun(() =>
              apiFetch(`/api/splits/days/${day.id}`, { method: "DELETE" }),
            )
          }
        >
          Delete day
        </button>
      </div>

      <ul className="mb-2 space-y-1 text-sm">
        {day.exercises.map((entry) => (
          <li
            key={entry.splitDayExerciseId}
            className="flex items-center gap-2"
          >
            <span className="flex-1">
              {entry.exerciseName} — {entry.targetSets}×{entry.targetRepMin}–
              {entry.targetRepMax}
            </span>
            <button
              className="text-xs text-red-600 underline"
              type="button"
              onClick={() =>
                onRun(() =>
                  apiFetch(
                    `/api/splits/day-exercises/${entry.splitDayExerciseId}`,
                    {
                      method: "DELETE",
                    },
                  ),
                )
              }
            >
              Remove
            </button>
          </li>
        ))}
        {day.exercises.length === 0 && (
          <li className="opacity-60">No exercises yet.</li>
        )}
      </ul>

      <form
        className="flex flex-wrap items-end gap-2 text-xs"
        onSubmit={(event) => {
          event.preventDefault();
          if (!exerciseId) {
            return;
          }
          onRun(() =>
            apiFetch(`/api/splits/days/${day.id}/exercises`, {
              method: "POST",
              body: JSON.stringify({
                exerciseId: Number(exerciseId),
                orderIndex: day.exercises.length,
                targetSets: sets,
                targetRepMin: repMin,
                targetRepMax: repMax,
              }),
            }),
          );
        }}
      >
        <select
          className="rounded-lg border px-2 py-1"
          value={exerciseId}
          onChange={(event) => setExerciseId(event.target.value)}
        >
          <option value="">Add exercise…</option>
          {exercises.map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </select>
        <label>
          Sets
          <input
            className="ml-1 w-14 rounded-lg border px-2 py-1"
            min={1}
            max={20}
            type="number"
            value={sets}
            onChange={(event) => setSets(Number(event.target.value))}
          />
        </label>
        <label>
          Reps
          <input
            className="ml-1 w-14 rounded-lg border px-2 py-1"
            min={1}
            type="number"
            value={repMin}
            onChange={(event) => setRepMin(Number(event.target.value))}
          />
          –
          <input
            className="w-14 rounded-lg border px-2 py-1"
            min={1}
            type="number"
            value={repMax}
            onChange={(event) => setRepMax(Number(event.target.value))}
          />
        </label>
        <button
          className="rounded-lg bg-black px-3 py-1 font-semibold text-white disabled:opacity-50"
          disabled={saving || !exerciseId}
          type="submit"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function AddDayForm({
  splitId,
  nextOrderIndex,
  saving,
  onRun,
}: {
  splitId: number;
  nextOrderIndex: number;
  saving: boolean;
  onRun: (action: () => Promise<unknown>) => Promise<void>;
}) {
  const [name, setName] = useState("");

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onRun(async () => {
          await apiFetch(`/api/splits/${splitId}/days`, {
            method: "POST",
            body: JSON.stringify({
              name: name.trim(),
              orderIndex: nextOrderIndex,
            }),
          });
          setName("");
        });
      }}
    >
      <label className="text-xs">
        New day
        <input
          className="mt-1 block rounded-lg border px-3 py-1.5 text-sm"
          required
          placeholder="e.g. Push A"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <button
        className="rounded-lg border px-4 py-1.5 text-sm font-semibold disabled:opacity-50"
        disabled={saving}
        type="submit"
      >
        Add day
      </button>
    </form>
  );
}
