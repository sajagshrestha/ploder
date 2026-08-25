import { createFileRoute } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
  type ColumnDef,
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type Exercise,
  useCreateExercise,
  useDeleteExercise,
  useExercises,
  useUpdateExercise,
} from "@/lib/queries";

export const Route = createFileRoute("/admin/exercises")({
  component: AdminExercises,
});

const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "glutes",
  "core",
] as const;
const EQUIPMENT = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
] as const;

type ExerciseValues = {
  name: string;
  muscleGroup: Exercise["muscleGroup"];
  equipment: Exercise["equipment"];
  isCompound: boolean;
};

function AdminExercises() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isPending } = useExercises({
    page,
    search: search || undefined,
    muscleGroup: muscleGroup || undefined,
    equipment: equipment || undefined,
  });
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const columns: ColumnDef<Exercise>[] = [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "muscleGroup",
      header: "Muscle group",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.muscleGroup}</span>
      ),
    },
    {
      accessorKey: "equipment",
      header: "Equipment",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.equipment}</span>
      ),
    },
    {
      accessorKey: "isCompound",
      header: "Type",
      cell: ({ row }) => (
        <span
          className={
            row.original.isCompound
              ? "font-medium text-primary"
              : "text-muted-foreground"
          }
        >
          {row.original.isCompound ? "Compound" : "Isolation"}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditing(row.original);
              setDialogOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleting(row.original)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1,
  });

  function handleSave(values: ExerciseValues) {
    const mutation = editing
      ? updateExercise.mutateAsync({ ...values, id: editing.id })
      : createExercise.mutateAsync(values);

    toast.promise(mutation, {
      loading: editing ? "Updating exercise…" : "Creating exercise…",
      success: () => {
        setDialogOpen(false);
        setEditing(null);
        return editing ? "Exercise updated" : "Exercise created";
      },
      error: (error) => error.message,
    });
  }

  function handleDelete() {
    if (!deleting) {
      return;
    }
    toast.promise(deleteExercise.mutateAsync(deleting.id), {
      loading: "Deleting…",
      success: () => {
        setDeleting(null);
        return `"${deleting.name}" deleted`;
      },
      error: (error) => {
        setDeleting(null);
        return error.message;
      },
    });
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exercises</h1>
          <p className="text-sm text-muted-foreground">
            Manage the global exercise catalog.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setDialogOpen(true);
          }}
        >
          Add exercise
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          className="w-52"
          placeholder="Search name…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          value={muscleGroup || "all"}
          onValueChange={(value) => {
            setMuscleGroup(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Muscle group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscle groups</SelectItem>
            {MUSCLE_GROUPS.map((group) => (
              <SelectItem key={group} value={group} className="capitalize">
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={equipment || "all"}
          onValueChange={(value) => {
            setEquipment(value === "all" ? "" : value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All equipment</SelectItem>
            {EQUIPMENT.map((item) => (
              <SelectItem key={item} value={item} className="capitalize">
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No exercises found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data?.total ?? 0} exercises · page {page} of {totalPages}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit exercise" : "Add exercise"}
            </DialogTitle>
          </DialogHeader>
          <ExerciseForm
            key={editing?.id ?? "new"}
            initial={editing ?? undefined}
            saving={createExercise.isPending || updateExercise.isPending}
            onSave={handleSave}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete exercise?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deleting?.name}" from the catalog.
              Exercises used in split templates or logged workouts cannot be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExerciseForm({
  initial,
  saving,
  onSave,
}: {
  initial?: Exercise;
  saving: boolean;
  onSave: (values: ExerciseValues) => void;
}) {
  const [values, setValues] = useState<ExerciseValues>({
    name: initial?.name ?? "",
    muscleGroup: initial?.muscleGroup ?? "chest",
    equipment: initial?.equipment ?? "barbell",
    isCompound: initial?.isCompound ?? false,
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ ...values, name: values.name.trim() });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="exercise-name">Name</Label>
        <Input
          id="exercise-name"
          required
          value={values.name}
          onChange={(event) =>
            setValues({ ...values, name: event.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Muscle group</Label>
          <Select
            value={values.muscleGroup}
            onValueChange={(value) =>
              setValues({
                ...values,
                muscleGroup: value as ExerciseValues["muscleGroup"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MUSCLE_GROUPS.map((group) => (
                <SelectItem key={group} value={group} className="capitalize">
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Equipment</Label>
          <Select
            value={values.equipment}
            onValueChange={(value) =>
              setValues({
                ...values,
                equipment: value as ExerciseValues["equipment"],
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EQUIPMENT.map((item) => (
                <SelectItem key={item} value={item} className="capitalize">
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          checked={values.isCompound}
          className="size-4 accent-black"
          type="checkbox"
          onChange={(event) =>
            setValues({ ...values, isCompound: event.target.checked })
          }
        />
        Compound exercise
      </label>
      <Button className="w-full" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save exercise"}
      </Button>
    </form>
  );
}
