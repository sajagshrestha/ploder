import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { apiFetch, formatError } from "#/lib/api";

import { useApi } from "../admin";

type User = {
  id: number;
  clerkId: string | null;
  name: string;
  email: string;
  role: "user" | "admin";
  preferredUnit: "kg" | "lb";
  heightCm: number | null;
  createdAt: string;
};

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const query = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (search) {
    query.set("search", search);
  }

  const { data, loading, refetch } = useApi<{
    data: User[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/users?${query.toString()}`);

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
      <h1 className="mb-4 text-2xl font-bold">Users</h1>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <form
        className="mb-4"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          refetch();
        }}
      >
        <input
          className="rounded-lg border px-3 py-1.5 text-sm"
          placeholder="Search name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </form>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-black/5 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Email</th>
                <th className="p-2">Role</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Joined</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {data?.data.map((user) => (
                <tr key={user.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{user.name}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">{user.role}</td>
                  <td className="p-2">{user.preferredUnit}</td>
                  <td className="p-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-2 text-right">
                    <button
                      className="mr-2 underline"
                      onClick={() => setEditing(user)}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 underline"
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `Delete user "${user.name}" and all their data?`,
                          )
                        ) {
                          run(() =>
                            apiFetch(`/api/users/${user.id}`, {
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
            <h2 className="mb-4 text-lg font-bold">Edit user</h2>
            <UserForm
              initial={editing}
              saving={saving}
              onSave={(values) =>
                run(async () => {
                  await apiFetch(`/api/users/${editing.id}`, {
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

function UserForm({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: User;
  saving: boolean;
  onSave: (values: {
    name?: string;
    role?: string;
    preferredUnit?: string;
    heightCm?: number | null;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState(initial.role);
  const [unit, setUnit] = useState(initial.preferredUnit);
  const [height, setHeight] = useState(initial.heightCm?.toString() ?? "");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          name: name.trim(),
          role,
          preferredUnit: unit,
          heightCm: height ? Number(height) : null,
        });
      }}
    >
      <label className="block text-xs">
        Name
        <input
          className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="block text-xs">
        Role
        <select
          className="mt-1 block w-full rounded-lg border px-3 py-1.5 text-sm"
          value={role}
          onChange={(event) => setRole(event.target.value as "user" | "admin")}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label className="block text-xs">
        Preferred unit
        <select
          className="mt-1 block w-full rounded-lg border px-3 py-1.5 text-sm"
          value={unit}
          onChange={(event) => setUnit(event.target.value as "kg" | "lb")}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </label>
      <label className="block text-xs">
        Height (cm)
        <input
          className="mt-1 w-full rounded-lg border px-3 py-1.5 text-sm"
          min={50}
          max={300}
          type="number"
          value={height}
          onChange={(event) => setHeight(event.target.value)}
        />
      </label>
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-black px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={saving}
          type="submit"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          className="rounded-lg border px-4 py-1.5 text-sm"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
