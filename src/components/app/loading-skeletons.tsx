import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PLACEHOLDER_KEYS = ["a", "b", "c", "d", "e", "f"];
const CHART_BARS = [
  { key: "a", height: 42 },
  { key: "b", height: 66 },
  { key: "c", height: 51 },
  { key: "d", height: 82 },
  { key: "e", height: 60 },
  { key: "f", height: 74 },
];

export function PageHeadingSkeleton() {
  return (
    <div className="grid gap-2" aria-hidden="true">
      <Skeleton className="h-2 w-36 rounded-full" />
      <Skeleton className="h-8 w-64 max-w-[72vw]" />
      <Skeleton className="h-4 w-80 max-w-[86vw]" />
    </div>
  );
}

export function ListCardSkeleton({
  media = false,
  tall = false,
}: {
  media?: boolean;
  tall?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3",
        tall && "items-start p-4",
      )}
      aria-hidden="true"
    >
      {media ? (
        <Skeleton className={cn("size-10 shrink-0", tall && "size-11")} />
      ) : null}
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-2/5" />
        {tall ? <Skeleton className="mt-3 h-8 w-28" /> : null}
      </div>
      <Skeleton className="h-7 w-16 shrink-0 rounded-lg" />
    </div>
  );
}

export function ListSkeleton({
  count = 3,
  media = false,
  tall = false,
  className,
}: {
  count?: number;
  media?: boolean;
  tall?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-3", className)} aria-hidden="true">
      {PLACEHOLDER_KEYS.slice(0, count).map((key) => (
        <ListCardSkeleton key={key} media={media} tall={tall} />
      ))}
    </div>
  );
}

export function ExercisePickerSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-3" aria-hidden="true">
      {PLACEHOLDER_KEYS.slice(0, count).map((key) => (
        <div
          key={key}
          className="relative flex min-w-0 cursor-pointer flex-col items-stretch gap-0 overflow-hidden rounded-xl border border-border bg-card p-0"
        >
          <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-[#f5f7fa]">
            <Skeleton className="h-full w-full rounded-none" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2 px-[14px] pt-3 pb-[14px]">
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <div className="mt-auto flex flex-wrap gap-[6px] pt-[2px]">
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({
  rows = 3,
  chart = false,
  className,
}: {
  rows?: number;
  chart?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn("dashboard-panel grid gap-5", className)}
      aria-hidden="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-2 w-28 rounded-full" />
        <Skeleton className="h-6 w-48 max-w-[70%]" />
      </div>
      {chart ? (
        <div className="flex h-52 items-end gap-3 border-b border-l px-4 pb-1">
          {CHART_BARS.map((bar) => (
            <Skeleton
              className="min-w-0 flex-1 rounded-b-none"
              key={bar.key}
              style={{ height: `${bar.height}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
          {PLACEHOLDER_KEYS.slice(0, rows).map((key) => (
            <div className="flex items-center gap-3" key={key}>
              <Skeleton className="size-9 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function ChartSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-3 w-48 max-w-[70%]" />
      </div>
      <div className="flex h-52 items-end gap-3 border-b border-l px-4 pb-1">
        {CHART_BARS.map((bar) => (
          <Skeleton
            className="min-w-0 flex-1 rounded-b-none"
            key={bar.key}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-9 w-24" />
      <PageHeadingSkeleton />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <PanelSkeleton rows={4} />
      <PanelSkeleton rows={3} />
    </div>
  );
}

export function SplitDetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <Skeleton className="h-9 w-24" />
      <PageHeadingSkeleton />
      <Skeleton className="h-11 w-full rounded-xl" />
      <PanelSkeleton rows={5} />
      <PanelSkeleton rows={4} />
      <PanelSkeleton rows={3} />
    </div>
  );
}

export function ExerciseCardSkeleton({ header = true }: { header?: boolean }) {
  return (
    <div
      className={
        header ? "training-content session-page" : "exercise-deck-shell"
      }
      aria-hidden="true"
    >
      {header ? (
        <div className="flex min-h-12 items-start gap-[10px] max-mobile:flex-wrap">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-12" />
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Skeleton className="size-[38px] rounded-xl" />
            <Skeleton className="h-[38px] w-24 rounded-xl" />
          </div>
        </div>
      ) : null}
      <section className="relative flex min-h-[540px] flex-col gap-5 overflow-hidden rounded-[17px] border border-border bg-card p-6 text-left text-foreground mobile:basis-[46%] max-mobile:gap-4 max-mobile:p-[18px]">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="min-h-0 flex-1" />
        <div className="grid grid-cols-[72px_1fr_72px] gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-14" />
      </section>
    </div>
  );
}
