import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, Dumbbell } from "lucide-react";
import { SplitDays } from "@/components/admin/split-days";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Panel } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { ApiError } from "@/lib/api";
import { useSplit } from "@/lib/queries";

export const Route = createFileRoute("/admin/splits/$id")({
  component: SplitPage,
});

function SplitPage() {
  const { id } = Route.useParams();
  const splitId = Number(id);
  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <Button asChild variant="ghost" className="w-fit">
        <Link to="/admin/splits">
          <ArrowLeft className="size-4" />
          All split templates
        </Link>
      </Button>
      {Number.isSafeInteger(splitId) && splitId > 0 ? (
        <SplitEditor key={id} splitId={splitId} />
      ) : (
        <p role="alert">
          This split link is invalid. Choose a template from the library.
        </p>
      )}
    </div>
  );
}

function SplitEditor({ splitId }: { splitId: number }) {
  const split = useSplit(splitId);
  if (split.isPending) return <ListSkeleton count={3} tall />;
  if (split.isError)
    return (
      <Panel role="alert">
        <h1>
          {split.error instanceof ApiError && split.error.status === 404
            ? "Split not found"
            : "Couldn’t load this split"}
        </h1>
        <p>
          The template may have been removed, or the connection interrupted.
        </p>
        <Button variant="outline" onClick={() => split.refetch()}>
          Try again
        </Button>
      </Panel>
    );
  const plan = split.data.data;
  const count = plan.days.reduce(
    (total, day) => total + day.exercises.length,
    0,
  );
  return (
    <>
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>SPLIT TEMPLATE</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            {plan.name}
            <span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            {plan.description ||
              "Build a training plan your members can make their own."}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4" />
          {plan.days.length} training days
        </span>
        <span className="inline-flex items-center gap-2">
          <Dumbbell className="size-4" />
          {count} exercises
        </span>
      </div>
      <Panel className="space-y-4">
        <div>
          <h2 className="font-semibold">Training days</h2>
          <p className="text-sm text-muted-foreground">
            Manage exercises and targets for each session.
          </p>
        </div>
        {plan.days.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Start by adding your first day below, then choose its exercises.
          </p>
        )}
        <SplitDays splitId={splitId} />
      </Panel>
    </>
  );
}
