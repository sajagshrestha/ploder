import { createFileRoute } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
  type ColumnDef,
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";
import { toast } from "sonner";
import { ExerciseThumbnail } from "@/components/app/exercise-thumbnail";
import { Panel } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/responsive-alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-dialog";
import { SearchBar } from "@/components/ui/search-bar";
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
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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
  "upper arms",
  "upper legs",
  "back",
  "waist",
  "chest",
  "shoulders",
  "lower legs",
  "lower arms",
  "cardio",
  "neck",
] as const;
const EQUIPMENT = [
  "assisted",
  "band",
  "barbell",
  "body weight",
  "bosu ball",
  "cable",
  "dumbbell",
  "elliptical machine",
  "ez barbell",
  "hammer",
  "kettlebell",
  "leverage machine",
  "medicine ball",
  "olympic barbell",
  "resistance band",
  "roller",
  "rope",
  "skierg machine",
  "sled machine",
  "smith machine",
  "stability ball",
  "stationary bike",
  "stepmill machine",
  "tire",
  "trap bar",
  "upper body ergometer",
  "weighted",
  "wheel roller",
] as const;

type ExerciseValues = {
  name: string;
  alias: string | null;
  muscleGroup: Exercise["muscleGroup"];
  equipment: Exercise["equipment"];
  target: string | null;
  secondaryMuscles: string | null;
  instructionsEn: string | null;
  gifUrl: string | null;
  externalId: string | null;
  isCompound: boolean;
  imageUrl: string | null;
};

function AdminExercises() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleting, setDeleting] = useState<Exercise | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isPending } = useExercises({
    page,
    search: debouncedSearch || undefined,
    muscleGroup: muscleGroup || undefined,
    equipment: equipment || undefined,
  });
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  const columns: ColumnDef<Exercise>[] = [
    {
      id: "image",
      header: () => <span className="sr-only">Image</span>,
      cell: ({ row }) => (
        <ExerciseThumbnail
          name={row.original.name}
          exerciseId={row.original.id}
          src={row.original.imageUrl ?? row.original.gifUrl}
        />
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <Badge variant="secondary" className="mt-1 capitalize">
            {row.original.target || row.original.muscleGroup}
          </Badge>
          {row.original.alias && (
            <p className="text-xs text-muted-foreground">
              Also: {row.original.alias}
            </p>
          )}
        </div>
      ),
    },
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
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>EXERCISE LIBRARY</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Every move, curated<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Manage the global exercise catalog members train from.
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
        <SearchBar
          containerClassName="w-full sm:w-52"
          placeholder="Search name…"
          value={search}
          aria-label="Search exercises"
          onValueChange={(value) => {
            setSearch(value);
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

      <Panel className="overflow-hidden p-0">
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
      </Panel>

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
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
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
    alias: initial?.alias ?? null,
    muscleGroup: initial?.muscleGroup ?? "chest",
    equipment: initial?.equipment ?? "body weight",
    target: initial?.target ?? null,
    secondaryMuscles: initial?.secondaryMuscles ?? null,
    instructionsEn: initial?.instructionsEn ?? null,
    gifUrl: initial?.gifUrl ?? null,
    externalId: initial?.externalId ?? null,
    isCompound: initial?.isCompound ?? false,
    imageUrl: initial?.imageUrl ?? "",
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
      <div className="space-y-2">
        <Label htmlFor="exercise-alias">Aliases (comma-separated)</Label>
        <Input
          id="exercise-alias"
          placeholder="Pec Deck, Chest Fly, …"
          value={values.alias ?? ""}
          onChange={(event) =>
            setValues({
              ...values,
              alias: event.target.value.trim() || null,
            })
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
      <div className="space-y-2">
        <Label htmlFor="exercise-image">Image URL</Label>
        <Input
          id="exercise-image"
          placeholder="https://…"
          value={values.imageUrl ?? ""}
          onChange={(event) =>
            setValues({
              ...values,
              imageUrl: event.target.value.trim() || null,
            })
          }
        />
      </div>
      <Button className="w-full" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save exercise"}
      </Button>
    </form>
  );
}
