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
import {
  PageHeadingSkeleton,
  PanelSkeleton,
} from "@/components/app/loading-skeletons";
import { Button } from "@/components/ui/button";
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
      <div className="overview-page" aria-hidden="true">
        <PageHeadingSkeleton />
        <div className="dashboard-top-grid">
          <Skeleton className="h-[286px] w-full rounded-2xl" />
          <PanelSkeleton rows={2} className="week-panel" />
        </div>
        <div className="stats-grid">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <div className="dashboard-middle-grid">
          <PanelSkeleton rows={5} />
          <PanelSkeleton rows={3} />
        </div>
      </div>
    );
  if (summary.isError)
    return (
      <div className="app-empty">
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
  const stats = [
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
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <h1>
            Hi{name ? `, ${name}` : ""}
            <span className="heading-dot">.</span>
          </h1>
        </div>
        <span className="date-pill">
          <CalendarDays size={15} />
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      <div className="dashboard-top-grid">
        <section
          className="workout-hero workout-hero-focused"
          aria-labelledby="workout-hero-title"
        >
          <div className="hero-copy">
            <span className="hero-tag">
              <span className="live-dot" />
              {data.activeWorkout ? "IN PROGRESS" : "UP NEXT"}
            </span>
            <div className="hero-session-info">
              <h2 id="workout-hero-title">{heroTitle}</h2>
              <p>{heroPlan}</p>
            </div>
            <div className="hero-actions">
              {data.activeWorkout ? (
                <Button asChild className="hero-button">
                  <Link to="/app/train">
                    <Play size={17} fill="currentColor" />
                    Resume workout
                    <ArrowRight size={17} />
                  </Link>
                </Button>
              ) : (
                <Button
                  className="hero-button"
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
            className="hero-dumbbell"
            alt=""
            width={960}
            height={720}
            fetchPriority="high"
          />
        </section>
        <section className="dashboard-panel week-panel">
          <div className="panel-heading">
            <h2>This week</h2>
            <span className="icon-tile peach">
              <Flame size={18} />
            </span>
          </div>
          <div className="week-total">
            <strong>
              {activity.isPending || activity.isError ? "—" : weeklyCount}
            </strong>
            <span>active {weeklyCount === 1 ? "day" : "days"}</span>
          </div>
          <div className="week-strip">
            {weekDays.map((day) => (
              <div
                key={dateKey(day.date)}
                data-today={day.today}
                data-done={day.done}
              >
                <span>
                  {day.date.toLocaleDateString(undefined, {
                    weekday: "narrow",
                  })}
                </span>
                <b>
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
          <p className="week-note">
            {weeklyCount ? "Keep it up." : "Start today."}
          </p>
          <Link to="/app/history" className="text-link">
            View activity
            <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="stats-grid">
        {stats.map((stat) =>
          "to" in stat && stat.to ? (
            <Link
              key={stat.label}
              to={stat.to}
              className="rounded-2xl focus-visible:outline-none"
            >
              <section className="stat-card">
                <div className="stat-label">
                  {stat.label}
                  <span className={`icon-tile ${stat.color}`}>
                    <stat.icon size={17} />
                  </span>
                </div>
                <strong>{stat.value}</strong>
                <p>{stat.detail}</p>
              </section>
            </Link>
          ) : (
            <section className="stat-card" key={stat.label}>
              <div className="stat-label">
                {stat.label}
                <span className={`icon-tile ${stat.color}`}>
                  <stat.icon size={17} />
                </span>
              </div>
              <strong>{stat.value}</strong>
              <p>{stat.detail}</p>
            </section>
          ),
        )}
      </div>
      <div className="dashboard-middle-grid">
        {activity.isPending ? (
          <PanelSkeleton rows={5} />
        ) : activity.isError ? (
          <section className="dashboard-panel activity-panel">
            <div className="panel-heading">
              <div>
                <h2>Consistency</h2>
              </div>
            </div>
            <div className="inline-error">
              No activity.{" "}
              <button type="button" onClick={() => activity.refetch()}>
                Retry
              </button>
            </div>
          </section>
        ) : (
          <ActivityHeatmap workouts={activity.data.data} />
        )}
        <section className="dashboard-panel plan-panel">
          <div className="panel-heading">
            <div>
              <h2>Training plan</h2>
            </div>
            <CalendarDays size={20} />
          </div>
          {data.activeSplit ? (
            <>
              <div className="active-plan-name">
                <h3>{data.activeSplit.name}</h3>
                <span>Active plan</span>
              </div>
              <div className="plan-day-list">
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
                  >
                    <span className="day-number">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <strong>{day.name}</strong>
                      <small>
                        {day.exercises.length} exercises
                        {data.activeWorkout ? " · Resume first" : ""}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
              {activeSplit.isError && (
                <div className="inline-error">
                  No days.{" "}
                  <button type="button" onClick={() => activeSplit.refetch()}>
                    Retry
                  </button>
                </div>
              )}
              <Link to="/app/splits" className="text-link">
                Manage plan
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <div className="plan-empty">
              <CalendarDays size={28} />
              <h3>No plan yet.</h3>
              <p>Pick a template to start.</p>
              <Button asChild>
                <Link to="/app/splits">
                  Browse plans <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <h2>Recent</h2>
          </div>
          <Link to="/app/history" className="text-link">
            View all
            <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="recent-session-list">
          {recent.data?.data.slice(0, 4).map((workout) => (
            <Link
              key={workout.id}
              to={
                workout.status === "in_progress"
                  ? "/app/train"
                  : "/app/history/$id"
              }
              params={{ id: String(workout.id) }}
            >
              <span className="session-icon">
                <Dumbbell size={20} />
              </span>
              <span className="session-name">
                <strong>{workout.name}</strong>
                <small>
                  {new Date(workout.startedAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </small>
              </span>
              <span className={`session-status ${workout.status}`}>
                {workout.status === "completed" ? "Completed" : "In progress"}
              </span>
              <ChevronRight size={17} />
            </Link>
          ))}
          {recent.data?.data.length === 0 && (
            <div className="inline-empty">
              <ArrowDownRight size={20} />
              <p>No sessions yet.</p>
            </div>
          )}
          {recent.isError && (
            <div className="inline-error">
              No sessions.{" "}
              <button type="button" onClick={() => recent.refetch()}>
                Retry
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
