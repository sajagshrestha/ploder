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

import { IconTile, type IconTileTone } from "@/components/app/icon-tile";
import { Panel, PanelHeading } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/lib/queries";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data, isPending, isError, refetch } = useStats();

  const stats: {
    label: string;
    value: number | undefined;
    detail: string;
    icon: typeof Dumbbell;
    color: IconTileTone;
    to: string;
  }[] = [
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
  ];

  if (isError) {
    return (
      <div className="grid gap-6 max-mobile:gap-[18px]">
        <div className="grid min-h-[400px] content-center justify-items-center gap-[18px] text-center [&>p]:max-w-[360px] [&>p]:leading-[1.7] [&>p]:text-muted-foreground">
          <Dumbbell />
          <h1>Let’s reconnect.</h1>
          <p>We couldn’t load admin stats. Try again when you’re back.</p>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <Eyebrow>ADMINISTRATION OVERVIEW</Eyebrow>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Coach the community<span className="text-chart-1">.</span>
          </h1>
          <p className="mt-[9px] text-[13px] text-muted-foreground max-mobile:text-[11px]">
            Exercises, plans, members, and every logged rep — at a glance.
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-[9px] border border-border bg-card px-3 py-2.5 text-xs max-tablet:hidden">
          <ShieldCheck size={15} />
          Admin space
        </span>
      </div>

      <div className="grid grid-cols-4 gap-[17px] has-[>:nth-child(2):last-child]:grid-cols-2 has-[>:nth-child(3):last-child]:grid-cols-3 max-desktop:gap-3 max-tablet:grid-cols-2 max-mobile:gap-[11px]">
        {stats.map((stat) => (
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
              {isPending ? (
                <Skeleton className="mt-2 h-9 w-20" />
              ) : (
                <strong className="my-[9px] block text-[29px] leading-[1.1] font-semibold tracking-[-1px] max-mobile:text-[28px]">
                  {stat.value ?? "—"}
                </strong>
              )}
              <p className="text-[10px] leading-[1.6] text-muted-foreground max-mobile:leading-[1.5]">
                {stat.detail}
              </p>
            </section>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-[22px] max-desktop:gap-4 max-tablet:grid-cols-1">
        <Panel>
          <PanelHeading>
            <div>
              <Eyebrow className="mb-[7px] text-[8px] tracking-[1.25px]">
                WHERE TO NEXT
              </Eyebrow>
              <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                Manage the library
              </h2>
            </div>
            <Link
              to="/admin/exercises"
              className="icon-link"
              aria-label="Manage exercises"
            >
              <ArrowUpRight size={20} />
            </Link>
          </PanelHeading>
          <div className="mb-4 grid">
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
              <Link
                key={row.to}
                to={row.to}
                className="flex min-w-0 items-center gap-3 border-b border-border py-[13px] text-left transition-[padding] duration-200 hover:pl-1.5 [&_svg:last-child]:ml-auto"
              >
                <span className="grid h-[33px] w-[30px] shrink-0 place-items-center rounded-lg border border-border text-[10px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong className="block text-xs font-semibold">
                    {row.title}
                  </strong>
                  <small className="mt-1 block text-[10px] text-muted-foreground">
                    {row.hint}
                  </small>
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
          <Link
            to="/admin/splits"
            className="inline-flex items-center gap-[9px] text-xs font-bold hover:underline hover:underline-offset-4"
          >
            Open split templates
            <ArrowRight size={15} />
          </Link>
        </Panel>

        <Panel>
          <PanelHeading>
            <div>
              <Eyebrow className="mb-[7px] text-[8px] tracking-[1.25px]">
                THE WORK BEING PUT IN
              </Eyebrow>
              <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                Logged activity
              </h2>
            </div>
            <ClipboardList size={20} />
          </PanelHeading>
          <div className="mb-3 flex items-center justify-between gap-2.5">
            <h3 className="text-xs font-bold">
              {isPending
                ? "Loading…"
                : `${data?.data.completedWorkouts ?? 0} sessions completed`}
            </h3>
            <span className="shrink-0 rounded-[5px] bg-accent px-[6px] py-1 text-[10px] text-accent-foreground">
              Live data
            </span>
          </div>
          <div>
            <Link
              to="/admin/workouts"
              className="flex items-center gap-[14px] border-b border-border py-[15px] transition-colors last:border-b-0 last:pb-0 hover:bg-background"
            >
              <span className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground max-mobile:h-[34px] max-mobile:w-[34px]">
                <ClipboardList size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-semibold max-mobile:text-xs">
                  All workouts
                </strong>
                <small className="mt-[5px] block text-[11px] text-muted-foreground">
                  {isPending
                    ? "Counting sessions…"
                    : `${data?.data.workouts ?? 0} total · ${data?.data.sets ?? 0} sets logged`}
                </small>
              </span>
              <ArrowRight size={17} />
            </Link>
            <Link
              to="/admin/body-weights"
              className="flex items-center gap-[14px] border-b border-border py-[15px] transition-colors last:border-b-0 last:pb-0 hover:bg-background"
            >
              <span className="grid h-[39px] w-[39px] shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground max-mobile:h-[34px] max-mobile:w-[34px]">
                <Scale size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-[13px] font-semibold max-mobile:text-xs">
                  Body weight entries
                </strong>
                <small className="mt-[5px] block text-[11px] text-muted-foreground">
                  {isPending
                    ? "Counting weigh-ins…"
                    : `${data?.data.bodyWeights ?? 0} entries logged`}
                </small>
              </span>
              <ArrowRight size={17} />
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
