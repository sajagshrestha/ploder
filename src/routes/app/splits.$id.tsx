import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Copy, Play } from "lucide-react";
import { toast } from "sonner";

import { SplitDetailSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCloneTemplate,
  useMySplit,
  useMyTemplate,
  useStartWorkout,
  useUpdateMySplit,
} from "@/lib/my-queries";

export const Route = createFileRoute("/app/splits/$id")({
  component: SplitDetailPage,
});

function SplitDetailPage() {
  const { id } = Route.useParams();
  const isTemplate = id.startsWith("t-");
  const numericId = Number(isTemplate ? id.slice(2) : id);
  const navigate = useNavigate();

  const own = useMySplit(
    !isTemplate && Number.isFinite(numericId) ? numericId : null,
  );
  const template = useMyTemplate(
    isTemplate && Number.isFinite(numericId) ? numericId : null,
  );
  const clone = useCloneTemplate();
  const update = useUpdateMySplit();
  const startWorkout = useStartWorkout();

  const detail = isTemplate ? template : own;

  if (detail.isPending) {
    return <SplitDetailSkeleton />;
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="space-y-2 pt-8 text-center">
        <p className="font-semibold">Not found</p>
        <Button asChild variant="outline">
          <Link to="/app/splits">Back</Link>
        </Button>
      </div>
    );
  }

  const split = detail.data.data;

  return (
    <div className="space-y-4">
      <Button asChild className="-ml-2" size="sm" variant="ghost">
        <Link to="/app/splits">
          <ArrowLeft className="size-4" />
          Plans
        </Link>
      </Button>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight">
            {split.name}
          </h1>
          {"isActive" in split && split.isActive && <Badge>Active</Badge>}
        </div>
        {split.description && (
          <p className="text-sm text-muted-foreground">{split.description}</p>
        )}
      </div>

      {isTemplate ? (
        <Button
          className="w-full"
          disabled={clone.isPending}
          size="lg"
          onClick={() =>
            toast.promise(clone.mutateAsync({ templateId: numericId }), {
              loading: "Adding…",
              success: () => {
                navigate({ to: "/app/splits" });
                return "Added";
              },
              error: (error) => error.message,
            })
          }
        >
          <Copy className="size-4" />
          Use plan
        </Button>
      ) : (
        "isActive" in split &&
        !split.isActive && (
          <Button
            className="w-full"
            disabled={update.isPending}
            size="lg"
            variant="outline"
            onClick={() =>
              toast.promise(
                update.mutateAsync({ id: numericId, isActive: true }),
                {
                  loading: "Activating…",
                  success: "Active",
                  error: (error) => error.message,
                },
              )
            }
          >
            <Check className="size-4" />
            Set active
          </Button>
        )
      )}

      <div className="space-y-3">
        {split.days.map((day) => (
          <Card key={day.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">{day.name}</CardTitle>
                {!isTemplate && (
                  <Button
                    disabled={startWorkout.isPending}
                    size="sm"
                    onClick={() =>
                      toast.promise(
                        startWorkout.mutateAsync({
                          name: `${split.name} · ${day.name}`,
                          splitDayId: day.id,
                        }),
                        {
                          loading: "Starting…",
                          success: () => {
                            navigate({ to: "/app/train" });
                            return "Started";
                          },
                          error: (error) => error.message,
                        },
                      )
                    }
                  >
                    <Play className="size-3" />
                    Start
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {day.exercises.map((item) => (
                <div
                  key={item.splitDayExerciseId}
                  className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 px-3 py-2 text-sm"
                >
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.exerciseName ?? "Exercise"}
                  </span>
                  <Badge variant="outline" className="shrink-0 capitalize">
                    {item.target || "Target"}
                  </Badge>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {item.targetSets} × {item.targetRepMin}–{item.targetRepMax}
                  </span>
                </div>
              ))}
              {day.exercises.length === 0 && (
                <p className="text-sm text-muted-foreground">Empty.</p>
              )}
            </CardContent>
          </Card>
        ))}
        {split.days.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            No days yet.
          </p>
        )}
      </div>
    </div>
  );
}
