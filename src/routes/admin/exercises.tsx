import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { apiFetch, formatError } from "#/lib/api";

import { useApi } from "../admin";

type Exercise = {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string;
  isCompound: boolean;
};

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
];
const EQUIPMENT = ["barbell", "dumbbell", "machine", "cable", "bodyweight"];

export const Route = createFileRoute("/admin/exercises")({
  component: AdminExercises,
});

function AdminExercises() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const query = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (search) {
    query.set("search", search);
  }
  if (muscleGroup) {
    query.set("muscleGroup", muscleGroup);
  }

  const { data, loading, refetch } = useApi<{
    data: Exercise[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/exercises?${query.toString()}`);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError(null);
    try {
      await action();
      refetch();
    } catch (caught) {
      setError(formatError(caught));
    } finally {
      setSaving(false);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Exercises</h1>

      <form
        className="mb-4 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          refetch();
        }}
      >
        <input
          className="rounded-lg border px-3 py-1.5 text-sm"
          placeholder="Search name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          className="rounded-lg border px-3 py-1.5 text-sm"
          value={muscleGroup}
          onChange={(event) => {
            setMuscleGroup(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All muscle groups</option>
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <details
        className="mb-4 rounded-xl border p-4"
        open={data?.data.length === 0}
      >
        <summary className="cursor-pointer text-sm font-semibold">
          Add exercise
        </summary>
        <ExerciseForm
          onSave={(values) =>
            run(async () => {
              await apiFetch("/api/exercises", {
                method: "POST",
                body: JSON.stringify(values),
              });
            })
          }
          saving={saving}
        />
      </details>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-black/5 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Muscle group</th>
                <th className="p-2">Equipment</th>
                <th className="p-2">Compound</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {data?.data.map((exercise) => (
                <tr key={exercise.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{exercise.name}</td>
                  <td className="p-2">{exercise.muscleGroup}</td>
                  <td className="p-2">{exercise.equipment}</td>
                  <td className="p-2">{exercise.isCompound ? "Yes" : "No"}</td>
                  <td className="p-2 text-right">
                    <button
                      className="mr-2 underline"
                      onClick={() => setEditing(exercise)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 underline"
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${exercise.name}"?`)) {
                          run(() =>
                            apiFetch(`/api/exercises/${exercise.id}`, {
                              method: "DELETE",
                            }),
                          );
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 text-sm">
        <button
          className="rounded-lg border px-3 py-1 disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          type="button"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages} ({data?.total ?? 0} total)
        </span>
        <button
          className="rounded-lg border px-3 py-1 disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          type="button"
        >
          Next
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 text-black">
            <h2 className="mb-4 text-lg font-bold">Edit exercise</h2>
            <ExerciseForm
              initial={editing}
              saving={saving}
              onSave={(values) =>
                run(async () => {
                  await apiFetch(`/api/exercises/${editing.id}`, {
                    method: "PATCH",
                    body: JSON.stringify(values),
                  });
                  setEditing(null);
                })
              }
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

type ExerciseValues = {
  name: string;
  muscleGroup: string;
  equipment: string;
  isCompound: boolean;
};

function ExerciseForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial?: Exercise;
  saving: boolean;
  onSave: (values: ExerciseValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<ExerciseValues>({
    name: initial?.name ?? "",
    muscleGroup: initial?.muscleGroup ?? "chest",
    equipment: initial?.equipment ?? "barbell",
    isCompound: initial?.isCompound ?? false,
  });

  return (
    <form
      className="mt-3 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          ...values,
          name: values.name.trim(),
        });
      }}
    >
      <label className="flex-1 text-xs">
        Name
        <input
          className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
          required
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
        />
      </label>
      <label className="text-xs">
        Muscle group
        <select
          className="mt-1 block rounded-lg border px-3 py-1.5 text-sm"
          value={values.muscleGroup}
          onChange={(event) =>
            setValues({ ...values, muscleGroup: event.target.value })
          }
        >
          {MUSCLE_GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs">
        Equipment
        <select
          className="mt-1 block rounded-lg border px-3 py-1.5 text-sm"
          value={values.equipment}
          onChange={(event) =>
            setValues({ ...values, equipment: event.target.value })
          }
        >
          {EQUIPMENT.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1 text-xs">
        <input
          checked={values.isCompound}
          type="checkbox"
          onChange={(event) =>
            setValues({ ...values, isCompound: event.target.checked })
          }
        />
        Compound
      </label>
      <button
        className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      {onCancel && (
        <button
          className="rounded-lg border px-4 py-1.5 text-sm"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      )}
    </form>
  );
}
