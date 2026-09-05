import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkouts } from "@/lib/queries";

export const Route = createFileRoute("/admin/workouts")({
  component: AdminWorkouts,
});

function AdminWorkouts() {
  const [page, setPage] = useState(1);
  const { data, isPending } = useWorkouts({ page });

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOGGED SESSIONS</p>
          <h1>
            Every workout<span className="heading-dot">.</span>
          </h1>
          <p>Read-only view of all logged workouts.</p>
        </div>
      </div>

      <section
        className="dashboard-panel"
        style={{ padding: 0, overflow: "hidden" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={5}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={5}>
                  No workouts logged yet.
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell className="font-medium">{workout.name}</TableCell>
                  <TableCell>
                    {workout.userName ?? `#${workout.userId}`}
                  </TableCell>
                  <TableCell>
                    {new Date(workout.startedAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {workout.completedAt
                      ? new Date(workout.completedAt).toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        workout.status === "completed" ? "default" : "secondary"
                      }
                    >
                      {workout.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
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
        label="workouts"
      />
    </div>
  );
}

export function TablePagination({
  page,
  setPage,
  total,
  totalPages,
  label,
}: {
  page: number;
  setPage: (update: (current: number) => number) => void;
  total: number;
  totalPages: number;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {total} {label} · page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => setPage((current) => current - 1)}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={page >= totalPages}
          onClick={() => setPage((current) => current + 1)}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
