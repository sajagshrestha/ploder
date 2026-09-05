import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Scale,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/queries";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isPending, isError, refetch } = useStats();

  const stats = [
    {
      label: "Exercises",
      value: data?.data.exercises,
      detail: "Moves in the global library",
      icon: Dumbbell,
      color: "lime",
      to: "/admin/exercises",
    },
    {
      label: "Split templates",
      value: data?.data.splits,
      detail: "Coach-built training plans",
      icon: CalendarDays,
      color: "peach",
      to: "/admin/splits",
    },
    {
      label: "Members",
      value: data?.data.users,
      detail: "Athletes training with Ploder",
      icon: Users,
      color: "purple",
      to: "/admin/users",
    },
    {
      label: "Workouts logged",
      value: data?.data.workouts,
      detail: `${data?.data.completedWorkouts ?? 0} completed · ${data?.data.sets ?? 0} sets`,
      icon: Activity,
      color: "blue",
      to: "/admin/workouts",
    },
  ] as const;

  if (isError) {
    return (
      <div className="overview-page">
        <div className="app-empty">
          <Dumbbell />
          <h1>Let’s reconnect.</h1>
          <p>We couldn’t load admin stats. Try again when you’re back.</p>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION OVERVIEW</p>
          <h1>
            Coach the community<span className="heading-dot">.</span>
          </h1>
          <p>Exercises, plans, members, and every logged rep — at a glance.</p>
        </div>
        <span className="date-pill">
          <ShieldCheck size={15} />
          Admin space
        </span>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
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
              {isPending ? (
                <Skeleton className="mt-2 h-9 w-20" />
              ) : (
                <strong>{stat.value ?? "—"}</strong>
              )}
              <p>{stat.detail}</p>
            </section>
          </Link>
        ))}
      </div>

      <div className="dashboard-middle-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">WHERE TO NEXT</p>
              <h2>Manage the library</h2>
            </div>
            <Link
              to="/admin/exercises"
              className="icon-link"
              aria-label="Manage exercises"
            >
              <ArrowUpRight size={20} />
            </Link>
          </div>
          <div className="plan-day-list">
            {[
              {
                to: "/admin/exercises",
                icon: Dumbbell,
                title: "Exercise catalog",
                hint: `${data?.data.exercises ?? "—"} movements · compound & isolation`,
              },
              {
                to: "/admin/splits",
                icon: CalendarDays,
                title: "Split templates",
                hint: `${data?.data.splits ?? "—"} plans members can clone`,
              },
              {
                to: "/admin/users",
                icon: Users,
                title: "Members & roles",
                hint: `${data?.data.users ?? "—"} users · ${data?.data.admins ?? 0} admins`,
              },
            ].map((row, i) => (
              <Link key={row.to} to={row.to}>
                <span className="day-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{row.title}</strong>
                  <small>{row.hint}</small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
          <Link to="/admin/splits" className="text-link">
            Open split templates
            <ArrowRight size={15} />
          </Link>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">THE WORK BEING PUT IN</p>
              <h2>Logged activity</h2>
            </div>
            <ClipboardList size={20} />
          </div>
          <div className="active-plan-name">
            <h3>
              {isPending
                ? "Loading…"
                : `${data?.data.completedWorkouts ?? 0} sessions completed`}
            </h3>
            <span>Live data</span>
          </div>
          <div className="recent-session-list">
            <Link to="/admin/workouts">
              <span className="session-icon">
                <ClipboardList size={20} />
              </span>
              <span className="session-name">
                <strong>All workouts</strong>
                <small>
                  {isPending
                    ? "Counting sessions…"
                    : `${data?.data.workouts ?? 0} total · ${data?.data.sets ?? 0} sets logged`}
                </small>
              </span>
              <ArrowRight size={17} />
            </Link>
            <Link to="/admin/body-weights">
              <span className="session-icon">
                <Scale size={20} />
              </span>
              <span className="session-name">
                <strong>Body weight entries</strong>
                <small>
                  {isPending
                    ? "Counting weigh-ins…"
                    : `${data?.data.bodyWeights ?? 0} entries logged`}
                </small>
              </span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
