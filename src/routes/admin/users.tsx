import { createFileRoute } from "@tanstack/react-router";
import { flexRender } from "@tanstack/react-table";
import {
  type ColumnDef,
  getCoreRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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

  const { data, isPending } = useUsers({ page, search: search || undefined });
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Manage user accounts and permissions.
        </p>
      </div>

      <Input
        className="w-64"
        placeholder="Search name or email…"
        value={search}
        onChange={(event) => {
          setSearch(event.target.value);
          setPage(1);
        }}
      />

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
      </div>

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
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={onConfirm}
          >
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
