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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Body weight</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of all body weight entries.
        </p>
      </div>

      <div className="rounded-lg border">
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
      </div>

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
