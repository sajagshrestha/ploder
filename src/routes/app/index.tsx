import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  Play,
  Scale,
} from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { ActivityHeatmap } from "@/components/app/activity-heatmap";
import { IconTile, type IconTileTone } from "@/components/app/icon-tile";
import {
  PageHeadingSkeleton,
  PanelSkeleton,
} from "@/components/app/loading-skeletons";
import { Panel, PanelHeading } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { InlineNote } from "@/components/ui/inline-note";
import { NoData } from "@/components/ui/no-data";
import { Skeleton } from "@/components/ui/skeleton";
import { dateKey, groupActivity } from "@/lib/activity";
import {
  useMe,
  useMyActivity,
  useMySplit,
  useMySummary,
  useMyWorkouts,
  useStartWorkout,
} from "@/lib/my-queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/")({ component: TodayPage });
function TodayPage() {
  const me = useMe();
  const summary = useMySummary();
  const recent = useMyWorkouts({ page: 1 });
  const activity = useMyActivity();
  const navigate = useNavigate();
  const startWorkout = useStartWorkout();
  const activeSplit = useMySplit(summary.data?.data.activeSplit?.id ?? null);
  const weekDays = useMemo(() => {
    const now = new Date();
    const grouped = groupActivity(activity.data?.data ?? []);
    const monday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - ((now.getDay() + 6) % 7),
    );
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(day.getDate() + i);
      return {
        date: day,
        today: dateKey(day) === dateKey(now),
        done: grouped.has(dateKey(day)),
      };
    });
  }, [activity.data]);
  const quickStart = (name: string, splitDayId: number | null) => {
    toast.promise(startWorkout.mutateAsync({ name, splitDayId }), {
      loading: "Starting workout…",
      success: () => {
        void navigate({ to: "/app/train" });
        return "Workout started";
      },
      error: (error) => error.message,
    });
  };
  if (summary.isPending)
    return (
      <div className="grid gap-6 max-mobile:gap-[18px]" aria-hidden="true">
        <PageHeadingSkeleton />
        <div className="grid grid-cols-[minmax(0,1.95fr)_minmax(250px,1fr)] gap-[22px] max-desktop:grid-cols-[minmax(0,1.6fr)_minmax(235px,1fr)] max-desktop:gap-4 max-tablet:grid-cols-1 max-mobile:gap-[18px]">
          <Skeleton className="h-[286px] w-full rounded-2xl" />
          <PanelSkeleton rows={2} className="max-tablet:hidden" />
        </div>
        <div className="grid grid-cols-4 gap-[17px] has-[>:nth-child(2):last-child]:grid-cols-2 has-[>:nth-child(3):last-child]:grid-cols-3 max-desktop:gap-3 max-tablet:grid-cols-2 max-mobile:gap-[11px]">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[22px] max-desktop:gap-4 max-tablet:grid-cols-1">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={3} />
        </div>
      </div>
    );
  if (summary.isError)
    return (
      <div className="grid min-h-[400px] content-center justify-items-center gap-[18px] text-center [&>p]:max-w-[360px] [&>p]:leading-[1.7] [&>p]:text-muted-foreground">
        <Dumbbell />
        <h1>Offline.</h1>
        <p>Couldn't load data.</p>
        <Button onClick={() => summary.refetch()}>Retry</Button>
      </div>
    );
  const data = summary.data.data;
  const name = me.data?.data.name?.split(" ")[0];
  const days = activeSplit.data?.data.days ?? [];
  const firstDay = days[0];
  const sessionName = data.activeWorkout?.name;
  const sessionParts = sessionName?.split("·").map((part) => part.trim());
  const heroTitle = sessionParts?.at(-1) || firstDay?.name || "Next workout";
  const heroPlan =
    sessionParts && sessionParts.length > 1
      ? sessionParts.slice(0, -1).join(" · ")
      : data.activeWorkout
        ? "Continue"
        : data.activeSplit?.name || "Freestyle";
  const weeklyCount = weekDays.filter((d) => d.done).length;
  const stats: {
    label: string;
    value: string | number;
    detail: string;
    icon: typeof Flame;
    color: IconTileTone;
    to?: string;
  }[] = [
    {
      label: "Active days",
      value: activity.isError ? "—" : weeklyCount,
      detail: "Resets Monday",
      icon: Flame,
      color: "peach",
    },
    {
      label: "Weight",
      value: data.latestBodyWeight
        ? Number(data.latestBodyWeight.weight).toFixed(1)
        : "—",
      detail: data.latestBodyWeight
        ? `${me.data?.data.preferredUnit ?? "kg"} · ${new Date(`${data.latestBodyWeight.recordedAt}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : "Log weigh-in",
      icon: Scale,
      color: "blue",
      to: "/app/weight",
    },
  ];
  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Hi{name ? `, ${name}` : ""}
            <span className="text-chart-1">.</span>
          </h1>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[9px] border border-border bg-card px-3 py-2.5 text-xs max-tablet:hidden">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="grid grid-cols-[minmax(0,1.95fr)_minmax(250px,1fr)] gap-[22px] max-desktop:grid-cols-[minmax(0,1.6fr)_minmax(235px,1fr)] max-desktop:gap-4 max-tablet:grid-cols-1 max-mobile:gap-[18px]">
        <section
          className="relative min-h-[260px] min-w-0 overflow-hidden rounded-[17px] border border-border bg-accent text-foreground shadow-none max-mobile:min-h-0"
          aria-labelledby="workout-hero-title"
        >
          <div className="relative z-[2] flex h-full max-w-none flex-col items-start p-7 max-mobile:p-5">
            <span className="inline-flex items-center gap-[7px] rounded-full bg-card px-[11px] py-2 text-[10px] font-extrabold tracking-[1px] text-muted-foreground">
              <span className="inline-block h-[6px] w-[6px] shrink-0 rounded-full bg-primary" />
              {data.activeWorkout ? "IN PROGRESS" : "UP NEXT"}
            </span>
            <div className="mt-[22px] mb-6 w-[72%] max-mobile:my-[22px] max-mobile:w-[58%]">
              <h2
                id="workout-hero-title"
                className="mb-2 text-[clamp(26px,2.4vw,36px)] leading-[1.15] font-extrabold tracking-[-1px] whitespace-normal [overflow-wrap:anywhere] [text-wrap:pretty] max-mobile:text-[27px]"
              >
                {heroTitle}
              </h2>
              <p className="m-0 max-w-none text-xs leading-[1.5] font-medium text-muted-foreground">
                {heroPlan}
              </p>
            </div>
            <div className="mt-auto flex w-full flex-wrap items-center gap-2 [&>[data-slot=button]]:justify-center has-[>button:nth-child(2)]:grid has-[>button:nth-child(2)]:grid-cols-2 has-[>button:nth-child(2)]:items-stretch max-mobile:[&>[data-slot=button]]:w-full">
              {data.activeWorkout ? (
                <Button
                  asChild
                  className="min-h-12 rounded-[10px] border-0 bg-primary! px-[18px] text-[13px] font-extrabold tracking-[0.02em] text-primary-foreground! shadow-none hover:brightness-[0.96] [&_svg:last-child]:ml-auto max-mobile:w-full"
                >
                  <Link to="/app/train">
                    <Play size={17} fill="currentColor" />
                    Resume workout
                    <ArrowRight size={17} />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="min-h-12 rounded-[10px] border-0 bg-primary! px-[18px] text-[13px] font-extrabold tracking-[0.02em] text-primary-foreground! shadow-none hover:brightness-[0.96] [&_svg:last-child]:ml-auto max-mobile:w-full"
                  disabled={startWorkout.isPending}
                  onClick={() =>
                    quickStart(
                      firstDay
                        ? `${data.activeSplit?.name} · ${firstDay.name}`
                        : "Freestyle workout",
                      firstDay?.id ?? null,
                    )
                  }
                >
                  <Play size={17} fill="currentColor" />
                  {startWorkout.isPending ? "Starting…" : "Start workout"}
                  <ArrowRight size={17} />
                </Button>
              )}
            </div>
          </div>
          <img
            src="/assets/training-dumbbell.png"
            className="hero-dumbbell pointer-events-none absolute top-[18%] right-[-3%] h-auto w-[36%] max-w-none -rotate-12 animate-none opacity-[0.85] max-mobile:top-[18%] max-mobile:right-0 max-mobile:w-[45%] max-mobile:opacity-[0.92]"
            alt=""
            width={960}
            height={720}
            fetchPriority="high"
          />
        </section>
        <Panel className="p-[23px] max-tablet:hidden">
          <PanelHeading className="mb-2">
            <h2 className="text-[15px] font-bold tracking-[-0.35px]">
              This week
            </h2>
            <IconTile tone="peach">
              <Flame size={18} />
            </IconTile>
          </PanelHeading>
          <div className="flex items-center gap-[13px]">
            <strong className="text-[50px] leading-[1.2] font-semibold tracking-[-2px]">
              {activity.isPending || activity.isError ? "—" : weeklyCount}
            </strong>
            <span className="text-[10px] leading-[1.6] text-muted-foreground">
              active {weeklyCount === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="my-[18px] grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={dateKey(day.date)}
                data-today={day.today}
                data-done={day.done}
                className="group flex flex-col gap-[9px] text-center text-[9px] text-muted-foreground"
              >
                <span>
                  {day.date.toLocaleDateString(undefined, {
                    weekday: "narrow",
                  })}
                </span>
                <b className="grid h-8 place-items-center rounded-lg border border-border text-[10px] font-semibold group-data-[today=true]:border-chart-1 group-data-[today=true]:text-foreground group-data-[done=true]:border-primary group-data-[done=true]:bg-primary group-data-[done=true]:text-primary-foreground">
                  {day.done ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span className="sr-only">Workout completed</span>
                    </>
                  ) : (
                    day.date.getDate()
                  )}
                </b>
              </div>
            ))}
          </div>
          <p className="pb-[15px] text-[10px] leading-[1.7] text-muted-foreground">
            {weeklyCount ? "Keep it up." : "Start today."}
          </p>
          <Link
            to="/app/history"
            className="inline-flex items-center gap-[9px] text-xs font-bold hover:underline hover:underline-offset-4"
          >
            View activity
            <ArrowRight size={15} />
          </Link>
        </Panel>
      </div>
      <div className="grid grid-cols-4 gap-[17px] has-[>:nth-child(2):last-child]:grid-cols-2 has-[>:nth-child(3):last-child]:grid-cols-3 max-desktop:gap-3 max-tablet:grid-cols-2 max-mobile:gap-[11px]">
        {stats.map((stat) =>
          "to" in stat && stat.to ? (
            <Link
              key={stat.label}
              to={stat.to}
              className="min-w-0 rounded-2xl focus-visible:outline-none"
            >
              <section className="rounded-[15px] border border-border bg-card p-[19px] max-desktop:p-[15px] max-mobile:p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground max-desktop:text-[9px] max-mobile:text-[10px]">
                  {stat.label}
                  <IconTile tone={stat.color}>
                    <stat.icon size={17} />
                  </IconTile>
                </div>
                <strong className="my-[9px] block text-[29px] leading-[1.1] font-semibold tracking-[-1px] max-mobile:text-[28px]">
                  {stat.value}
                </strong>
                <p className="text-[10px] leading-[1.6] text-muted-foreground max-mobile:leading-[1.5]">
                  {stat.detail}
                </p>
              </section>
            </Link>
          ) : (
            <section
              className="min-w-0 rounded-[15px] border border-border bg-card p-[19px] max-desktop:p-[15px] max-mobile:p-4"
              key={stat.label}
            >
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground max-desktop:text-[9px] max-mobile:text-[10px]">
                {stat.label}
                <IconTile tone={stat.color}>
                  <stat.icon size={17} />
                </IconTile>
              </div>
              <strong className="my-[9px] block text-[29px] leading-[1.1] font-semibold tracking-[-1px] max-mobile:text-[28px]">
                {stat.value}
              </strong>
              <p className="text-[10px] leading-[1.6] text-muted-foreground max-mobile:leading-[1.5]">
                {stat.detail}
              </p>
            </section>
          ),
        )}
      </div>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[22px] max-desktop:gap-4 max-tablet:grid-cols-1">
        {activity.isPending ? (
          <PanelSkeleton rows={5} />
        ) : activity.isError ? (
          <Panel className="activity-panel">
            <PanelHeading>
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                  Consistency
                </h2>
              </div>
            </PanelHeading>
            <InlineNote>
              No activity.{" "}
              <button
                type="button"
                className="underline underline-offset-[3px]"
                onClick={() => activity.refetch()}
              >
                Retry
              </button>
            </InlineNote>
          </Panel>
        ) : (
          <ActivityHeatmap workouts={activity.data.data} />
        )}
        <Panel className="plan-panel">
          <PanelHeading>
            <div>
              <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                Training plan
              </h2>
            </div>
            <CalendarDays size={20} />
          </PanelHeading>
          {data.activeSplit ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-2.5">
                <h3 className="text-xs font-bold">{data.activeSplit.name}</h3>
                <span className="shrink-0 rounded-[5px] bg-accent px-[6px] py-1 text-[10px] text-accent-foreground">
                  Active plan
                </span>
              </div>
              <div className="mb-4 grid">
                {days.map((day, i) => (
                  <button
                    type="button"
                    key={day.id}
                    disabled={startWorkout.isPending}
                    onClick={() =>
                      data.activeWorkout
                        ? void navigate({ to: "/app/train" })
                        : quickStart(
                            `${data.activeSplit?.name} · ${day.name}`,
                            day.id,
                          )
                    }
                    className="flex min-w-0 items-center gap-3 border-b border-border py-[13px] text-left transition-[padding] duration-200 hover:pl-1.5 [&_svg:last-child]:ml-auto"
                  >
                    <span className="grid h-[33px] w-[30px] shrink-0 place-items-center rounded-lg border border-border text-[10px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong className="block text-xs font-semibold">
                        {day.name}
                      </strong>
                      <small className="mt-1 block text-[10px] text-muted-foreground">
                        {day.exercises.length} exercises
                        {data.activeWorkout ? " · Resume first" : ""}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
              {activeSplit.isError && (
                <InlineNote>
                  No days.{" "}
                  <button
                    type="button"
                    className="underline underline-offset-[3px]"
                    onClick={() => activeSplit.refetch()}
                  >
                    Retry
                  </button>
                </InlineNote>
              )}
              <Link
                to="/app/splits"
                className="inline-flex items-center gap-[9px] text-xs font-bold hover:underline hover:underline-offset-4"
              >
                Manage plan
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <NoData
              compact
              icon={CalendarDays}
              title="Choose your training plan"
              description="Browse templates to find a routine that fits your goals."
            >
              <Button asChild>
                <Link to="/app/splits">
                  Browse plans <ArrowRight size={16} />
                </Link>
              </Button>
            </NoData>
          )}
        </Panel>
      </div>
      <Panel>
        <PanelHeading>
          <div>
            <h2 className="text-[15px] font-bold tracking-[-0.35px]">Recent</h2>
          </div>
          <Link
            to="/app/history"
            className="inline-flex items-center gap-[9px] text-xs font-bold hover:underline hover:underline-offset-4"
          >
            View all
            <ArrowUpRight size={16} />
          </Link>
        </PanelHeading>
        <div>
          {recent.data?.data.slice(0, 4).map((workout) => (
            <Link
              key={workout.id}
              to={
                workout.status === "in_progress"
                  ? "/app/train"
                  : "/app/history/$id"
              }
              params={{ id: String(workout.id) }}
              className="flex items-center gap-[14px] border-b border-border py-[15px] transition-colors last:border-b-0 last:pb-0 hover:bg-background"
            >
              <span className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground max-mobile:h-[34px] max-mobile:w-[34px]">
                <Dumbbell size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-semibold max-mobile:text-xs">
                  {workout.name}
                </strong>
                <small className="mt-[5px] block text-[11px] text-muted-foreground">
                  {new Date(workout.startedAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </small>
              </span>
              <span
                className={cn(
                  "rounded-[5px] border border-border px-[7px] py-1 text-[10px] whitespace-nowrap max-mobile:hidden",
                  workout.status === "in_progress" &&
                    "bg-accent text-accent-foreground",
                )}
              >
                {workout.status === "completed" ? "Completed" : "In progress"}
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
          {recent.data?.data.length === 0 && (
            <InlineNote>
              <ArrowDownRight size={20} />
              <p>No sessions yet.</p>
            </InlineNote>
          )}
          {recent.isError && (
            <InlineNote>
              No sessions.{" "}
              <button
                type="button"
                className="underline underline-offset-[3px]"
                onClick={() => recent.refetch()}
              >
                Retry
              </button>
            </InlineNote>
          )}
        </div>
      </Panel>
    </div>
  );
}
