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
      <div className="space-y-5">
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="h-72 w-full rounded-3xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
      </div>
    );
  if (summary.isError)
    return (
      <div className="app-empty">
        <Dumbbell />
        <h1>Let’s reconnect.</h1>
        <p>
          We couldn’t load your training data. Try again when you’re back
          online.
        </p>
        <Button onClick={() => summary.refetch()}>Try again</Button>
      </div>
    );
  const data = summary.data.data;
  const name = me.data?.data.name?.split(" ")[0];
  const days = activeSplit.data?.data.days ?? [];
  const firstDay = days[0];
  const sessionName = data.activeWorkout?.name;
  const sessionParts = sessionName?.split("·").map((part) => part.trim());
  const heroTitle =
    sessionParts?.at(-1) || firstDay?.name || "Your next workout";
  const heroPlan =
    sessionParts && sessionParts.length > 1
      ? sessionParts.slice(0, -1).join(" · ")
      : data.activeWorkout
        ? "Continue your session"
        : data.activeSplit?.name || "Train at your own pace";
  const weeklyCount = weekDays.filter((d) => d.done).length;
  const stats = [
    {
      label: "Active days this week",
      value: activity.isError ? "—" : weeklyCount,
      detail: "A fresh start every Monday",
      icon: Flame,
      color: "peach",
    },
    {
      label: "Latest body weight",
      value: data.latestBodyWeight
        ? Number(data.latestBodyWeight.weight).toFixed(1)
        : "—",
      detail: data.latestBodyWeight
        ? `${me.data?.data.preferredUnit ?? "kg"} · ${new Date(`${data.latestBodyWeight.recordedAt}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
        : "Log your first weigh-in",
      icon: Scale,
      color: "blue",
      to: "/app/weight",
    },
  ];
  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MAKE TODAY COUNT</p>
          <h1>
            Let’s get stronger{name ? `, ${name}` : ""}
            <span className="heading-dot">.</span>
          </h1>
          <p>Your plan, your pace. A little progress every day.</p>
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
            <span>
              active {weeklyCount === 1 ? "day" : "days"}
              <br />
              and counting
            </span>
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
            {weeklyCount
              ? "You’re building momentum. Keep your rhythm."
              : "Your next session is a great place to begin."}
          </p>
          <Link to="/app/history" className="text-link">
            View your activity
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
          <Skeleton className="h-80 w-full rounded-3xl" />
        ) : activity.isError ? (
          <section className="dashboard-panel activity-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">SHOWING UP ADDS UP</p>
                <h2>Training consistency</h2>
              </div>
            </div>
            <div className="inline-error">
              Couldn’t load activity.{" "}
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
              <p className="eyebrow">A LITTLE STRUCTURE GOES A LONG WAY</p>
              <h2>Your training plan</h2>
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
                        {data.activeWorkout
                          ? " · Resume your active session first"
                          : ""}
                      </small>
                    </span>
                    <ArrowUpRight size={17} />
                  </button>
                ))}
              </div>
              {activeSplit.isError && (
                <div className="inline-error">
                  Couldn’t load training days.{" "}
                  <button type="button" onClick={() => activeSplit.refetch()}>
                    Retry
                  </button>
                </div>
              )}
              <Link to="/app/splits" className="text-link">
                Manage training plan
                <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <div className="plan-empty">
              <CalendarDays size={28} />
              <h3>Find your rhythm.</h3>
              <p>
                Choose a coach-built plan to give your week a little structure.
              </p>
              <Button asChild>
                <Link to="/app/splits">
                  Explore training plans <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          )}
        </section>
      </div>
      <section className="dashboard-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">THE WORK YOU PUT IN</p>
            <h2>Recent sessions</h2>
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
              <p>
                Your story starts with a session. Your workouts will appear
                here.
              </p>
            </div>
          )}
          {recent.isError && (
            <div className="inline-error">
              Couldn’t load sessions.{" "}
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
