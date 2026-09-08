import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Panel } from "@/components/app/panel";
import { Eyebrow } from "@/components/ui/eyebrow";
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
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>PROGRESS DATA</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Body weight<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Read-only view of all body weight entries.
          </p>
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
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
      </Panel>

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
