import { createFileRoute } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
  type ColumnDef,
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/app/panel";
import { Badge } from "@/components/ui/badge";
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
  type User,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/lib/queries";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);

  const debouncedSearch = useDebouncedValue(search);
  const { data, isPending } = useUsers({
    page,
    search: debouncedSearch || undefined,
  });
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const columns: ColumnDef<User>[] = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email" },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge
          variant={row.original.role === "admin" ? "default" : "secondary"}
        >
          {row.original.role}
        </Badge>
      ),
    },
    {
      accessorKey: "preferredUnit",
      header: "Unit",
      cell: ({ row }) => row.original.preferredUnit.toUpperCase(),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(row.original)}
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

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>COMMUNITY</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Members & roles<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Manage user accounts and permissions.
          </p>
        </div>
      </div>

      <SearchBar
        containerClassName="w-full sm:w-64"
        placeholder="Search name or email…"
        value={search}
        aria-label="Search users"
        onValueChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
      />

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
                  No users found.
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
          {data?.total ?? 0} users · page {page} of {totalPages}
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

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          {editing && (
            <UserForm
              initial={editing}
              saving={updateUser.isPending}
              onSave={(values) => {
                toast.promise(
                  updateUser.mutateAsync({ id: editing.id, ...values }),
                  {
                    loading: "Saving…",
                    success: () => {
                      setEditing(null);
                      return "User updated";
                    },
                    error: (error) => error.message,
                  },
                );
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteUserDialog
        deleting={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (!deleting) {
            return;
          }
          toast.promise(deleteUser.mutateAsync(deleting.id), {
            loading: "Deleting…",
            success: () => {
              setDeleting(null);
              return "User deleted";
            },
            error: (error) => {
              setDeleting(null);
              return error.message;
            },
          });
        }}
      />
    </div>
  );
}

function DeleteUserDialog({
  deleting,
  onOpenChange,
  onConfirm,
}: {
  deleting: User | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={deleting !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete user?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes "{deleting?.name}" along with all their
            workouts, splits, and body weight history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function UserForm({
  initial,
  saving,
  onSave,
}: {
  initial: User;
  saving: boolean;
  onSave: (values: {
    name: string;
    role: "user" | "admin";
    preferredUnit: "kg" | "lb";
    heightCm: number | null;
  }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [role, setRole] = useState<"user" | "admin">(initial.role);
  const [unit, setUnit] = useState<"kg" | "lb">(initial.preferredUnit);
  const [height, setHeight] = useState(initial.heightCm?.toString() ?? "");

  return (
    <form
      className="space-y-4"
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
      <div className="space-y-2">
        <Label htmlFor="user-name">Name</Label>
        <Input
          id="user-name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as "user" | "admin")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Preferred unit</Label>
          <Select
            value={unit}
            onValueChange={(value) => setUnit(value as "kg" | "lb")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="lb">lb</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="user-height">Height (cm)</Label>
        <Input
          id="user-height"
          max={300}
          min={50}
          type="number"
          value={height}
          onChange={(event) => setHeight(event.target.value)}
        />
      </div>
      <Button className="w-full" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save user"}
      </Button>
    </form>
  );
}
