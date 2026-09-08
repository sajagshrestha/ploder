import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Panel, PanelHeading } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/ui/search-bar";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCreateSplit, useDeleteSplit, useSplits } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/splits/")({
  component: AdminSplits,
});

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function SelectionDot({ selected }: { selected: boolean }) {
  return selected ? (
    <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
      <Check className="size-3" strokeWidth={3} />
    </span>
  ) : (
    <span className="size-5 rounded-full border-2 border-muted-foreground/40" />
  );
}

function AdminSplits() {
  const [search, setSearch] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deleting, setDeleting] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  const [confirmBulk, setConfirmBulk] = useState(false);

  const splits = useSplits();
  const createSplit = useCreateSplit();
  const deleteSplit = useDeleteSplit();

  const rows = splits.data?.data ?? [];

  const debouncedSearch = useDebouncedValue(search);
  const visibleRows = rows.filter((row) =>
    `${row.name} ${row.description ?? ""}`
      .toLowerCase()
      .includes(debouncedSearch.trim().toLowerCase()),
  );

  const toggle = (id: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  const exitSelect = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const runBulkDelete = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      return;
    }
    setBulkBusy(true);
    toast.promise(
      (async () => {
        for (const id of ids) {
          await deleteSplit.mutateAsync(id);
          setSelected(
            (current) => new Set([...current].filter((value) => value !== id)),
          );
        }
        exitSelect();
      })().finally(() => setBulkBusy(false)),
      {
        loading: `Deleting ${plural(ids.length, "split")}…`,
        success: () => `Deleted ${plural(ids.length, "split")}`,
        error: (error) => {
          return error instanceof Error
            ? error.message
            : "Couldn't delete splits";
        },
      },
    );
  };

  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>TRAINING PLANS</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Plans members follow<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Users clone these templates into their own training splits.
          </p>
        </div>
      </div>

      <Panel>
        <PanelHeading>
          <div>
            <Eyebrow className="mb-[7px] text-[8px] tracking-[1.25px]">
              NEW TEMPLATE
            </Eyebrow>
            <h2 className="text-[15px] font-bold tracking-[-0.35px]">
              Add split template
            </h2>
          </div>
        </PanelHeading>
        <Card style={{ border: 0, boxShadow: "none", padding: 0 }}>
          <CardHeader>
            <CardDescription>
              Give the split a name, then add training days and exercises.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                toast.promise(
                  createSplit.mutateAsync({
                    name: name.trim(),
                    description: description.trim() || undefined,
                  }),
                  {
                    loading: "Creating…",
                    success: (result) => {
                      void navigate({
                        to: "/admin/splits/$id",
                        params: { id: String(result.data.id) },
                      });
                      setName("");
                      setDescription("");
                      return "Split created";
                    },
                    error: (error) => error.message,
                  },
                );
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="split-name">Name</Label>
                <Input
                  className="w-full sm:w-56"
                  id="split-name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="split-description">Description</Label>
                <Input
                  id="split-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <Button
                disabled={createSplit.isPending || !name.trim()}
                type="submit"
              >
                <Plus className="size-4" />
                Create
              </Button>
            </form>
          </CardContent>
        </Card>
      </Panel>

      {splits.isPending ? (
        <ListSkeleton count={3} tall />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Template library</h2>
              <p className="text-sm text-muted-foreground">
                {plural(rows.length, "template")} · Open a plan to manage its
                days.
              </p>
            </div>
            <SearchBar
              containerClassName="sm:w-72"
              aria-label="Search templates"
              placeholder="Search templates…"
              value={search}
              onValueChange={setSearch}
            />
          </div>
          {splits.isError && (
            <p role="alert">
              Couldn’t load templates.{" "}
              <Button variant="link" onClick={() => splits.refetch()}>
                Try again
              </Button>
            </p>
          )}
          {!splits.isError && visibleRows.length === 0 && (
            <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {rows.length
                ? "No templates match your search."
                : "Create your first template above, then add a training day."}
            </p>
          )}
          {!selecting && rows.length > 0 && (
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelecting(true)}
              >
                <Check className="size-4" />
                Select
              </Button>
            </div>
          )}
          {selecting && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
              <span className="text-sm font-medium">
                {plural(selected.size, "split")} selected
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={bulkBusy || visibleRows.length === 0}
                  onClick={() =>
                    setSelected((current) =>
                      visibleRows.every((row) => current.has(row.id))
                        ? new Set(
                            [...current].filter(
                              (id) => !visibleRows.some((row) => row.id === id),
                            ),
                          )
                        : new Set([
                            ...current,
                            ...visibleRows.map((row) => row.id),
                          ]),
                    )
                  }
                >
                  Select / clear visible
                </Button>
                <Button
                  disabled={deleteSplit.isPending || bulkBusy}
                  size="sm"
                  variant="ghost"
                  onClick={exitSelect}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    selected.size === 0 || deleteSplit.isPending || bulkBusy
                  }
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirmBulk(true)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
          {visibleRows.map((row) => {
            const isSelected = selected.has(row.id);
            return (
              <Card
                key={row.id}
                className={cn(
                  selecting && isSelected && "border-primary bg-muted/50",
                )}
              >
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      {selecting && (
                        <label className="mt-0.5 inline-flex shrink-0 cursor-pointer items-center">
                          <input
                            type="checkbox"
                            className="peer sr-only"
                            checked={isSelected}
                            onChange={() => toggle(row.id)}
                            aria-label={`Select split ${row.name}`}
                          />
                          <span className="rounded-full transition peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                            <SelectionDot selected={isSelected} />
                          </span>
                        </label>
                      )}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base">{row.name}</CardTitle>
                        <CardDescription>{row.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!selecting && (
                        <Button asChild size="sm" variant="outline">
                          <Link
                            to="/admin/splits/$id"
                            params={{ id: String(row.id) }}
                            aria-label={`Open ${row.name}`}
                          >
                            Open split <ChevronRight className="size-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        disabled={selecting}
                        onClick={() =>
                          setDeleting({ id: row.id, name: row.name })
                        }
                        size="sm"
                        variant="outline"
                        aria-label={`Delete split ${row.name}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={confirmBulk}
        onOpenChange={setConfirmBulk}
        title={`Delete ${plural(selected.size, "split")}?`}
        description="These split templates and all their training days will be permanently removed. Users who cloned them keep their own copies."
        confirmLabel={`Delete ${plural(selected.size, "split")}`}
        loading={deleteSplit.isPending || bulkBusy}
        onConfirm={() => {
          setConfirmBulk(false);
          runBulkDelete();
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? `Delete split "${deleting.name}"?` : "Delete split?"}
        description="This split template and all its training days will be permanently removed. Users who cloned it keep their own copies."
        confirmLabel="Delete split"
        loading={deleteSplit.isPending || bulkBusy}
        onConfirm={() => {
          if (!deleting) return;
          const id = deleting.id;
          toast.promise(deleteSplit.mutateAsync(id), {
            loading: "Deleting…",
            success: () => {
              setDeleting(null);
              return "Split deleted";
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
