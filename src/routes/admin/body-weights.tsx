import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useBodyWeights } from "@/lib/queries";

import { TablePagination } from "./workouts";

export const Route = createFileRoute("/admin/body-weights")({
  component: AdminBodyWeights,
});

function AdminBodyWeights() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useBodyWeights({ page });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROGRESS DATA</p>
          <h1>
            Body weight<span className="heading-dot">.</span>
          </h1>
          <p>Read-only view of all body weight entries.</p>
        </div>
      </div>

      <section
        className="dashboard-panel"
        style={{ padding: 0, overflow: "hidden" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Weight</TableHead>
              <TableHead>Recorded</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={4}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={4}>
                  No body weight entries yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {entry.userName ?? `#${entry.userId}`}
                  </TableCell>
                  <TableCell>{entry.weight}</TableCell>
                  <TableCell>{entry.recordedAt}</TableCell>
                  <TableCell>{entry.notes ?? "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <TablePagination
        page={page}
        setPage={setPage}
        total={data?.total ?? 0}
        totalPages={totalPages}
        label="entries"
      />
    </div>
  );
}
