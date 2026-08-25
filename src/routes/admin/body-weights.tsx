import { createFileRoute } from "@tanstack/react-router";

import { useApi } from "../admin";

type BodyWeight = {
  id: number;
  userId: number;
  userName: string | null;
  weight: string;
  recordedAt: string;
  notes: string | null;
};

export const Route = createFileRoute("/admin/body-weights")({
  component: AdminBodyWeights,
});

function AdminBodyWeights() {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi<{
    data: BodyWeight[];
    total: number;
    page: number;
    pageSize: number;
  }>(`/api/body-weights?page=${page}&pageSize=25`);

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Body weight</h1>
      <p className="mb-4 text-sm opacity-70">
        Read-only view of all body weight entries.
      </p>

      {loading ? (
        <p className="text-sm opacity-70">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-black/5 text-left">
              <tr>
                <th className="p-2">User</th>
                <th className="p-2">Weight</th>
                <th className="p-2">Recorded</th>
                <th className="p-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.length === 0 && (
                <tr>
                  <td className="p-4 text-center opacity-60" colSpan={4}>
                    No body weight entries yet.
                  </td>
                </tr>
              )}
              {data?.data.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">
                    {entry.userName ?? `#${entry.userId}`}
                  </td>
                  <td className="p-2">{entry.weight}</td>
                  <td className="p-2">{entry.recordedAt}</td>
                  <td className="p-2">{entry.notes ?? "—"}</td>
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
