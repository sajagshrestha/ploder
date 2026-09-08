import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Dumbbell,
  History,
  Loader2,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/app/loading-skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NoData } from "@/components/ui/no-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/ui/search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOverlayState } from "@/hooks/use-overlay-state";
import {
  type MyWorkoutSummary,
  useBulkDeleteWorkouts,
  useMe,
  useMyWorkouts,
} from "@/lib/my-queries";
import { cn } from "@/lib/utils";
import {
  downloadCsv,
  type HistorySearch,
  historyCsv,
  historyDateBounds,
  historySearchSchema,
  localDate,
  workoutDuration,
} from "@/lib/workout-history";

export const Route = createFileRoute("/app/history/")({
  validateSearch: historySearchSchema,
  component: HistoryPage,
});

const presets = [
  { days: null, label: "All time" },
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

function HistoryPage() {
  const filters = Route.useSearch();
  const navigate = Route.useNavigate();
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;
  const invalidRange = Boolean(
    filters.from && filters.to && filters.from > filters.to,
  );
  const history = useMyWorkouts({
    ...filters,
    page,
    pageSize,
    ...historyDateBounds(filters.from, invalidRange ? undefined : filters.to),
  });
  const unit = useMe().data?.data.preferredUnit ?? "kg";
  const bulkDelete = useBulkDeleteWorkouts();
  // The search field types instantly but only commits to the URL (and the
  // server query) once typing settles, so each keystroke isn't a navigation.
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const debouncedHistorySearch = useDebouncedValue(searchInput);
  useEffect(() => {
    const next = debouncedHistorySearch || undefined;
    if (next === filters.search) return;
    setSelected(new Map());
    void navigate({
      search: (previous) => ({ ...previous, search: next, page: 1 }),
      replace: true,
      resetScroll: false,
    });
  }, [debouncedHistorySearch, filters.search, navigate]);
  useEffect(() => {
    setSearchInput(filters.search ?? "");
  }, [filters.search]);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Map<number, MyWorkoutSummary>>(
    () => new Map(),
  );
  const [confirmValue, setConfirmValue] = useOverlayState("delete-sessions");
  const confirmOpen = confirmValue !== null;
  const setConfirmOpen = (next: boolean) => setConfirmValue(next ? "" : null);
  const [filtersValue, setFiltersValue] = useOverlayState("filters");
  const filtersOpen = filtersValue !== null;
  const setFiltersOpen = (next: boolean) => setFiltersValue(next ? "" : null);
  const mobile = useIsMobile();
  const workouts = history.data?.data ?? [];
  const total = history.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const allOnPage =
    workouts.length > 0 &&
    workouts.every((workout) => selected.has(workout.id));
  const hasFilters = Boolean(
    filters.search || filters.from || filters.to || filters.status,
  );
  const filterCount = [
    filters.search,
    filters.from || filters.to,
    filters.status,
    filters.sort === "oldest",
  ].filter(Boolean).length;

  useEffect(() => {
    if (history.data && page > totalPages) {
      void navigate({
        search: (previous) => ({ ...previous, page: totalPages }),
        replace: true,
        resetScroll: false,
      });
    }
  }, [history.data, navigate, page, totalPages]);

  function updateFilters(update: Partial<HistorySearch>) {
    setSelected(new Map());
    void navigate({
      search: (previous) => ({ ...previous, ...update, page: 1 }),
      replace: true,
      resetScroll: false,
    });
  }
  function clearFilters() {
    updateFilters({
      search: undefined,
      from: undefined,
      to: undefined,
      status: undefined,
    });
  }
  function toggle(workout: MyWorkoutSummary) {
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(workout.id)) next.delete(workout.id);
      else if (next.size < 100) next.set(workout.id, workout);
      return next;
    });
  }
  function selectPage() {
    setSelected((previous) => {
      const next = new Map(previous);
      for (const workout of workouts) {
        if (allOnPage) next.delete(workout.id);
        else if (next.size < 100) next.set(workout.id, workout);
      }
      return next;
    });
  }
  function exportWorkouts(items: MyWorkoutSummary[]) {
    downloadCsv(
      historyCsv(items, unit),
      `workout-history-${localDate(new Date())}.csv`,
    );
    toast.success(
      `Exported ${items.length} workout${items.length === 1 ? "" : "s"}`,
    );
  }
  async function runDelete() {
    try {
      const result = await bulkDelete.mutateAsync([...selected.keys()]);
      setSelected(new Map());
      setSelecting(false);
      setConfirmOpen(false);
      toast.success(
        `Deleted ${result.data.length} workout${result.data.length === 1 ? "" : "s"}`,
      );
    } catch {
      toast.error(
        "Couldn't delete the selected workouts. Your selection is saved—please try again.",
      );
    }
  }
  function datePreset(days: number | null) {
    const end = new Date();
    const start = new Date(end);
    if (days !== null) start.setDate(start.getDate() - days + 1);
    updateFilters({
      from: days === null ? undefined : localDate(start),
      to: days === null ? undefined : localDate(end),
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Eyebrow>Your training journal</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight">Workout history</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={bulkDelete.isPending || (!selecting && !workouts.length)}
          onClick={() => {
            setSelecting(!selecting);
            setSelected(new Map());
          }}
        >
          {selecting ? (
            <X className="size-4" />
          ) : (
            <CheckCheck className="size-4" />
          )}
          {selecting ? "Done" : "Select"}
        </Button>
      </header>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" disabled={bulkDelete.isPending}>
            <SlidersHorizontal className="size-4" />
            Filters
            {filterCount > 0 && <Badge className="ml-1">{filterCount}</Badge>}
          </Button>
        </SheetTrigger>
        <SheetContent
          side={mobile ? "bottom" : "right"}
          className={
            mobile
              ? "max-h-[85dvh] gap-0 rounded-t-2xl"
              : "w-full gap-0 sm:max-w-md"
          }
        >
          <SheetHeader className="shrink-0 pr-12">
            <SheetTitle>Filter workout history</SheetTitle>
            <SheetDescription>
              Find sessions by name, date, or status.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 min-w-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:!block">
            <section
              aria-label="History filters"
              className="space-y-4 px-4 py-2"
            >
              <SearchBar
                aria-label="Search workouts"
                placeholder="Search workout names…"
                value={searchInput}
                maxLength={120}
                disabled={bulkDelete.isPending}
                onValueChange={setSearchInput}
              />
              <ScrollArea orientation="horizontal" className="w-full">
                <div className="flex w-max gap-2 pb-2">
                  {presets.map(({ days, label }) => {
                    const start = new Date();
                    if (days !== null)
                      start.setDate(start.getDate() - days + 1);
                    const active =
                      days === null
                        ? !filters.from && !filters.to
                        : filters.from === localDate(start) &&
                          filters.to === localDate(new Date());
                    return (
                      <Button
                        key={label}
                        size="sm"
                        variant={active ? "default" : "secondary"}
                        aria-pressed={active}
                        disabled={bulkDelete.isPending}
                        className="rounded-full"
                        onClick={() => datePreset(days)}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="history-from">From</Label>
                  <Input
                    id="history-from"
                    type="date"
                    className="min-w-0 w-full"
                    value={filters.from ?? ""}
                    max={filters.to}
                    disabled={bulkDelete.isPending}
                    onChange={(event) =>
                      updateFilters({ from: event.target.value || undefined })
                    }
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="history-to">Through</Label>
                  <Input
                    id="history-to"
                    type="date"
                    className="min-w-0 w-full"
                    value={filters.to ?? ""}
                    min={filters.from}
                    aria-invalid={invalidRange}
                    disabled={bulkDelete.isPending}
                    onChange={(event) =>
                      updateFilters({ to: event.target.value || undefined })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history-status">Status</Label>
                  <Select
                    value={filters.status ?? "all"}
                    disabled={bulkDelete.isPending}
                    onValueChange={(value) =>
                      updateFilters({
                        status:
                          value === "completed" || value === "in_progress"
                            ? value
                            : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="history-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="history-sort">Sort by</Label>
                  <Select
                    value={filters.sort ?? "newest"}
                    disabled={bulkDelete.isPending}
                    onValueChange={(value) =>
                      updateFilters({
                        sort: value === "oldest" ? "oldest" : undefined,
                      })
                    }
                  >
                    <SelectTrigger id="history-sort" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {invalidRange && (
                <p role="alert" className="text-sm text-destructive">
                  Choose an end date on or after the start date.
                </p>
              )}
            </section>
          </ScrollArea>
          <SheetFooter className="shrink-0 border-t pb-[max(1rem,env(safe-area-inset-bottom))]">
            <SheetClose asChild>
              <Button disabled={invalidRange || history.isPending}>
                Show {total} workout{total === 1 ? "" : "s"}
              </Button>
            </SheetClose>
            <Button
              variant="ghost"
              disabled={bulkDelete.isPending || filterCount === 0}
              onClick={() =>
                updateFilters({
                  search: undefined,
                  from: undefined,
                  to: undefined,
                  status: undefined,
                  sort: undefined,
                })
              }
            >
              Reset filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {selecting && (
        <section
          aria-label="Bulk actions"
          className="sticky top-2 z-10 space-y-3 rounded-2xl border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm font-semibold">
              {selected.size} selected{" "}
              <span className="font-normal text-muted-foreground">
                · up to 100 across pages
              </span>
            </p>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulkDelete.isPending || !selected.size}
              onClick={() => setSelected(new Map())}
            >
              Clear selection
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={
                bulkDelete.isPending || !workouts.length || invalidRange
              }
              onClick={selectPage}
            >
              <CheckCheck className="size-4" />
              {allOnPage ? "Deselect page" : "Select page"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={bulkDelete.isPending || !selected.size}
              onClick={() => exportWorkouts([...selected.values()])}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={bulkDelete.isPending || !selected.size}
              onClick={() => setConfirmOpen(true)}
            >
              {bulkDelete.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete
            </Button>
          </div>
        </section>
      )}

      <section
        aria-label="Workouts"
        aria-busy={history.isFetching}
        className="space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold" aria-live="polite">
            {history.isPending
              ? "Loading workouts…"
              : `${total} workout${total === 1 ? "" : "s"}${hasFilters ? " found" : " in your journal"}`}
          </h2>
          {!selecting && (
            <Button
              size="sm"
              variant="ghost"
              disabled={!workouts.length || invalidRange}
              onClick={() => exportWorkouts(workouts)}
            >
              <Download className="size-4" />
              Export page
            </Button>
          )}
        </div>
        {history.isError ? (
          <div role="alert" className="rounded-xl border p-6 text-center">
            <p>Couldn't load your history.</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => history.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : history.isPending ? (
          <ListSkeleton count={3} media />
        ) : !invalidRange && workouts.length === 0 ? (
          <NoData
            icon={History}
            title={
              hasFilters
                ? "No workouts match these filters"
                : "Your next workout starts your story"
            }
            description={
              hasFilters
                ? "Try a wider date range or a different workout name."
                : "Your logged sessions will appear here, ready to revisit."
            }
          >
            {hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild>
                <Link to="/app/train">Start a workout</Link>
              </Button>
            )}
          </NoData>
        ) : (
          !invalidRange &&
          workouts.map((workout) => {
            const date = new Date(workout.startedAt);
            return (
              <article
                key={workout.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card p-4 sm:p-5",
                  selected.has(workout.id) && "border-primary bg-accent/40",
                )}
              >
                {selecting && (
                  <input
                    type="checkbox"
                    className="size-5 shrink-0 accent-primary"
                    aria-label={`Select ${workout.name} on ${date.toLocaleDateString()}`}
                    checked={selected.has(workout.id)}
                    disabled={
                      bulkDelete.isPending ||
                      (!selected.has(workout.id) && selected.size >= 100)
                    }
                    onChange={() => toggle(workout)}
                  />
                )}
                <Link
                  to="/app/history/$id"
                  params={{ id: String(workout.id) }}
                  search={filters}
                  className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring sm:gap-5"
                >
                  <div
                    aria-hidden="true"
                    className="hidden w-12 shrink-0 text-center sm:block"
                  >
                    <p className="text-xs uppercase text-muted-foreground">
                      {date.toLocaleDateString(undefined, { month: "short" })}
                    </p>
                    <p className="text-2xl font-bold tabular-nums">
                      {date.getDate()}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold group-hover:underline">
                        {workout.name}
                      </h3>
                      <Badge
                        variant={
                          workout.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                        className={
                          workout.status === "completed"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-amber-700 dark:text-amber-400"
                        }
                      >
                        {workout.status === "completed"
                          ? "Completed"
                          : "In progress"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5 shrink-0" />
                      {date.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      ·{" "}
                      {date.toLocaleTimeString(undefined, {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Dumbbell className="size-3.5" />
                        {workout.exerciseCount ?? 0} exercises ·{" "}
                        {workout.setCount ?? 0} sets
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />
                        {workoutDuration(workout)}
                      </span>
                      <span>
                        {Math.round(workout.volume ?? 0).toLocaleString()}{" "}
                        {unit} volume
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </article>
            );
          })
        )}
      </section>
      {history.data && !invalidRange && total > 0 && (
        <nav
          aria-label="Workout history pages"
          className="flex flex-wrap items-center justify-between gap-4 border-t pt-4"
        >
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of{" "}
              {total}
            </span>
            <Select
              value={String(pageSize)}
              disabled={bulkDelete.isPending}
              onValueChange={(value) =>
                updateFilters({
                  pageSize: value === "50" ? 50 : value === "25" ? 25 : 10,
                })
              }
            >
              <SelectTrigger size="sm" aria-label="Workouts per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="25">25 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Previous page"
              disabled={page <= 1 || bulkDelete.isPending}
              onClick={() =>
                navigate({
                  search: (previous) => ({ ...previous, page: page - 1 }),
                  resetScroll: false,
                })
              }
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-20 text-center text-sm tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              size="icon-sm"
              variant="outline"
              aria-label="Next page"
              disabled={page >= totalPages || bulkDelete.isPending}
              onClick={() =>
                navigate({
                  search: (previous) => ({ ...previous, page: page + 1 }),
                  resetScroll: false,
                })
              }
            >
              <ChevronRight />
            </Button>
          </div>
        </nav>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete ${selected.size} workout${selected.size === 1 ? "" : "s"}?`}
        description={
          <div className="space-y-3">
            <p>
              This permanently removes the selected workouts and every set
              logged in them. This cannot be undone.
            </p>
            <ScrollArea className="h-24">
              <ul className="space-y-1">
                {[...selected.values()].map((workout) => (
                  <li key={workout.id}>
                    {workout.name} ·{" "}
                    {new Date(workout.startedAt).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            </ScrollArea>
            {[...selected.values()].some(
              (workout) => workout.status === "in_progress",
            ) && (
              <p className="font-medium">
                Your selection includes an active workout. Deleting it will end
                that session.
              </p>
            )}
          </div>
        }
        confirmLabel={`Delete ${selected.size}`}
        loading={bulkDelete.isPending}
        onConfirm={runDelete}
      />
    </div>
  );
}
