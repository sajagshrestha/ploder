import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Panel } from "@/components/app/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
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
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>LOGGED SESSIONS</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Every workout<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Read-only view of all logged workouts.
          </p>
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
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
      </Panel>

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
