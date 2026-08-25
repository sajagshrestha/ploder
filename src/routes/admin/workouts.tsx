import { createFileRoute } from "@tanstack/react-router";

import { useApi } from "../admin";

type Workout = {
  id: number;
  userId: number;
  userName: string | null;
  name: string;
  startedAt: string;
  completedAt: string | null;
  status: string;
  notes: string | null;
};

export const Route = createFileRoute("/admin/workouts")({
  component: AdminWorkouts,
});

function AdminWorkouts() {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi<{
    data: Workout[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/workouts?page=${page}&pageSize=25`);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Workouts</h1>
      <p className="mb-4 text-sm opacity-70">
        Read-only view of all logged workouts.
      </p>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-black/5 text-left">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">User</th>
                <th className="p-2">Started</th>
                <th className="p-2">Completed</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.length === 0 && (
                <tr>
                  <td className="p-4 text-center opacity-60" colSpan={5}>
                    No workouts logged yet.
                  </td>
                </tr>
              )}
              {data?.data.map((workout) => (
                <tr key={workout.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{workout.name}</td>
                  <td className="p-2">
                    {workout.userName ?? `#${workout.userId}`}
                  </td>
                  <td className="p-2">
                    {new Date(workout.startedAt).toLocaleString()}
                  </td>
                  <td className="p-2">
                    {workout.completedAt
                      ? new Date(workout.completedAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="p-2">{workout.status}</td>
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
    </div>
  );
}
