import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Check, ChevronRight, Copy, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useOverlayState } from "@/hooks/use-overlay-state";
import {
  useCloneTemplate,
  useDeleteMySplit,
  useMySplits,
  useMyTemplates,
  useUpdateMySplit,
} from "@/lib/my-queries";

export const Route = createFileRoute("/app/splits")({
  component: SplitsPage,
});

function SplitsPage() {
  const mine = useMySplits();
  const templates = useMyTemplates();
  const clone = useCloneTemplate();
  const update = useUpdateMySplit();
  const remove = useDeleteMySplit();
  const [tab, setTab] = useState<"mine" | "templates">("mine");
  const [deleteSplitId, setDeleteSplitId] = useOverlayState("delete-split");
  const deleteSplit =
    deleteSplitId === null
      ? null
      : (mine.data?.data.find((split) => String(split.id) === deleteSplitId) ??
        null);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans.</h1>
      </div>

      <div className="grid max-w-md grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["mine", "templates"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            aria-pressed={tab === value}
            variant={tab === value ? "default" : "ghost"}
            onClick={() => setTab(value)}
          >
            {value === "mine" ? "Mine" : "Templates"}
          </Button>
        ))}
      </div>

      {(tab === "mine" ? mine.isError : templates.isError) && (
        <div className="inline-error">
          Couldn't load.{" "}
          <button
            type="button"
            onClick={() =>
              tab === "mine" ? mine.refetch() : templates.refetch()
            }
          >
            Retry
          </button>
        </div>
      )}
      {tab === "mine" && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {mine.isPending && (
            <ListSkeleton
              count={4}
              tall
              className="xl:col-span-2 xl:grid-cols-2"
            />
          )}
          {mine.data?.data.map((split) => (
            <Card key={split.id}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{split.name}</p>
                    {split.isActive && <Badge>Active</Badge>}
                  </div>
                  {split.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {split.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    {!split.isActive && (
                      <Button
                        disabled={update.isPending}
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.promise(
                            update.mutateAsync({
                              id: split.id,
                              isActive: true,
                            }),
                            {
                              loading: "Activating…",
                              success: "Active",
                              error: (error) => error.message,
                            },
                          )
                        }
                      >
                        <Check className="size-3" />
                        Set active
                      </Button>
                    )}
                    <Button
                      aria-label={`Delete ${split.name}`}
                      disabled={remove.isPending}
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteSplitId(String(split.id))}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
                <Button asChild size="icon" variant="ghost">
                  <Link
                    aria-label={`View ${split.name}`}
                    to="/app/splits/$id"
                    params={{ id: String(split.id) }}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          {mine.data?.data.length === 0 && (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              No plans yet.
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => setTab("templates")}
              >
                Browse
              </Button>
            </div>
          )}
        </div>
      )}

      <AlertDialog
        open={deleteSplit !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSplitId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{deleteSplit?.name ?? "plan"}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Removes split + days. Past workouts kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleteSplit) return;
                toast.promise(remove.mutateAsync(deleteSplit.id), {
                  loading: "Deleting…",
                  success: "Deleted",
                  error: (error) => error.message,
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {tab === "templates" && (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {templates.isPending && (
            <ListSkeleton
              count={4}
              media
              tall
              className="xl:col-span-2 xl:grid-cols-2"
            />
          )}
          {templates.data?.data.map((template) => (
            <Card key={template.id}>
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <CalendarDays className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-base">
                    {template.name}
                  </CardTitle>
                  {template.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button asChild className="flex-1" size="sm" variant="outline">
                  <Link
                    aria-label={`Preview ${template.name}`}
                    to="/app/splits/$id"
                    params={{ id: `t-${template.id}` }}
                  >
                    Preview
                  </Link>
                </Button>
                <Button
                  className="flex-1"
                  disabled={clone.isPending}
                  size="sm"
                  onClick={() =>
                    toast.promise(
                      clone.mutateAsync({ templateId: template.id }),
                      {
                        loading: "Adding…",
                        success: () => {
                          setTab("mine");
                          return "Added";
                        },
                        error: (error) => error.message,
                      },
                    )
                  }
                >
                  <Copy className="size-3" />
                  Use plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
