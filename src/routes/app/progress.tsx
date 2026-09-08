import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { IconTile } from "@/components/app/icon-tile";
import { PanelSkeleton } from "@/components/app/loading-skeletons";
import { Panel, PanelHeading } from "@/components/app/panel";
import { ProgressChart } from "@/components/app/progress-chart";
import { InlineNote } from "@/components/ui/inline-note";
import { useMe, useMyAnalytics } from "@/lib/my-queries";

export const Route = createFileRoute("/app/progress")({
  component: ProgressPage,
});

type Metric = "volume" | "hardSets" | "reps";

const metricMeta = {
  volume: { label: "Volume", unit: "load × reps" },
  hardSets: { label: "Working sets", unit: "sets" },
  reps: { label: "Total reps", unit: "reps" },
} satisfies Record<Metric, { label: string; unit: string }>;

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(
    value,
  );
}

const segmentedButtonClassName =
  "min-h-[32px] rounded-[5px] px-[9px] py-[6px] text-[11px] whitespace-nowrap text-muted-foreground max-mobile:min-h-[36px] aria-[pressed=true]:bg-card aria-[pressed=true]:text-foreground aria-[pressed=true]:shadow-[0_1px_4px_#0000000d]";

function ProgressPage() {
  const [weeks, setWeeks] = useState(12);
  const [metric, setMetric] = useState<Metric>("volume");
  const analytics = useMyAnalytics(weeks);
  const me = useMe();
  const unit = me.data?.data.preferredUnit ?? "kg";
  const data = analytics.data?.data;
  const chartRows = useMemo(
    () =>
      (data?.weekly ?? []).map((week) => ({
        label: week.label,
        value: week[metric],
      })),
    [data, metric],
  );

  return (
    <div className="grid gap-6 max-mobile:gap-[18px]">
      <div className="mb-[5px] flex items-center justify-between gap-5">
        <div>
          <h1 className="text-[clamp(24px,2.35vw,34px)] leading-[1.3] font-bold tracking-[-1.25px] max-mobile:text-[28px] max-mobile:tracking-[-1.1px]">
            Progress<span className="text-chart-1">.</span>
          </h1>
        </div>
        <IconTile tone="lime">
          <TrendingUp size={20} />
        </IconTile>
      </div>

      <fieldset
        className="m-0 flex items-center justify-between gap-[14px] border-0 p-0 max-mobile:flex-col max-mobile:items-start"
        aria-label="Period"
      >
        <legend className="float-left text-[11px] font-bold text-muted-foreground">
          Period
        </legend>
        <div className="flex gap-[3px] rounded-lg border border-border bg-background p-[3px] max-mobile:w-full max-mobile:[&_button]:flex-1 max-mobile:[&_button]:px-[5px]">
          {[4, 8, 12, 24].map((period) => (
            <button
              key={period}
              type="button"
              className={segmentedButtonClassName}
              aria-pressed={weeks === period}
              onClick={() => setWeeks(period)}
            >
              {period} weeks
            </button>
          ))}
        </div>
      </fieldset>

      {analytics.isPending ? (
        <AnalyticsSkeleton />
      ) : analytics.isError ? (
        <Panel>
          <InlineNote className="[&_button]:underline [&_button]:underline-offset-[3px]">
            Couldn't load.{" "}
            <button type="button" onClick={() => analytics.refetch()}>
              Retry
            </button>
          </InlineNote>
        </Panel>
      ) : data ? (
        <>
          <Panel className="analytics-chart-panel">
            <PanelHeading className="items-start max-mobile:flex-col max-mobile:gap-[14px]">
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                  Workload
                </h2>
              </div>
              <fieldset
                className="flex gap-[3px] rounded-lg border border-border bg-background p-[3px] max-mobile:w-full max-mobile:[&_button]:flex-1 max-mobile:[&_button]:px-[5px]"
                aria-label="Workload metric"
              >
                {(Object.keys(metricMeta) as Metric[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={segmentedButtonClassName}
                    aria-pressed={metric === option}
                    onClick={() => setMetric(option)}
                  >
                    {metricMeta[option].label}
                  </button>
                ))}
              </fieldset>
            </PanelHeading>
            {chartRows.some((row) => row.value > 0) ? (
              <ProgressChart
                rows={chartRows}
                label={`${metricMeta[metric].label} by week`}
                kind="line"
                unit={metricMeta[metric].unit}
                rowHeader="Week of"
              />
            ) : (
              <EmptyAnalytics text="Log sets to see trend." />
            )}
          </Panel>

          <Panel>
            <PanelHeading>
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                  Muscles
                </h2>
              </div>
            </PanelHeading>
            {data.muscleGroups.length ? (
              <div className="grid gap-[17px]">
                {data.muscleGroups.map((muscle) => (
                  <div
                    className="grid grid-cols-[minmax(120px,0.65fr)_minmax(120px,1.5fr)_90px] items-center gap-[18px] max-mobile:grid-cols-[1fr_auto] max-mobile:gap-x-3 max-mobile:gap-y-2"
                    key={muscle.muscleGroup}
                  >
                    <div className="grid gap-1">
                      <strong className="text-xs">
                        {titleCase(muscle.muscleGroup)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground">
                        {formatNumber(muscle.setsPerWeek, 1)} sets/week
                      </span>
                    </div>
                    <div
                      className="h-2 overflow-hidden rounded-full bg-accent max-mobile:col-start-1 max-mobile:col-end-[-1] max-mobile:row-[2]"
                      aria-hidden="true"
                    >
                      <i
                        className="block h-full min-w-[3px] rounded-[inherit] bg-chart-1"
                        style={{
                          width: `${Math.min(100, (muscle.sessionsPerWeek / 3) * 100)}%`,
                        }}
                      />
                    </div>
                    <b className="text-right text-xs tabular-nums">
                      {formatNumber(muscle.sessionsPerWeek, 1)}× / week
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAnalytics text="No data yet." />
            )}
          </Panel>

          <Panel>
            <PanelHeading>
              <div>
                <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                  Lifts
                </h2>
              </div>
            </PanelHeading>
            {data.exercises.length ? (
              <div className="grid">
                {data.exercises.map((exercise) => {
                  const change = exercise.estimated1rmChange;
                  return (
                    <article
                      className="grid grid-cols-[minmax(170px,1.3fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)_100px] items-center gap-4 border-b border-border py-[15px] last:border-b-0 max-mobile:grid-cols-[1fr_1fr_auto] max-mobile:gap-x-2 max-mobile:gap-y-3"
                      key={exercise.exerciseId}
                    >
                      <div className="grid gap-1 max-mobile:col-start-1 max-mobile:col-end-[-1]">
                        <strong className="text-xs">{exercise.name}</strong>
                        <span className="text-[9px] text-muted-foreground">
                          {titleCase(exercise.muscleGroup)}
                        </span>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[9px] text-muted-foreground">
                          Prev
                        </span>
                        <strong className="text-xs">
                          {exercise.previous
                            ? `${formatNumber(exercise.previous.weight, 1)} ${unit} × ${exercise.previous.reps}`
                            : "First log"}
                        </strong>
                      </div>
                      <div className="grid gap-1">
                        <span className="text-[9px] text-muted-foreground">
                          Latest
                        </span>
                        <strong className="text-xs text-foreground">
                          {formatNumber(exercise.current.weight, 1)} {unit} ×{" "}
                          {exercise.current.reps}
                        </strong>
                      </div>
                      <span
                        className="justify-self-end rounded-md px-2 py-[6px] text-[9px] font-extrabold whitespace-nowrap max-mobile:self-end data-[direction=down]:bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] data-[direction=down]:text-destructive data-[direction=neutral]:bg-background data-[direction=neutral]:text-muted-foreground data-[direction=up]:bg-accent data-[direction=up]:text-accent-foreground"
                        data-direction={
                          change === null || Math.abs(change) < 0.05
                            ? "neutral"
                            : change > 0
                              ? "up"
                              : "down"
                        }
                      >
                        {change === null
                          ? "New"
                          : `${change >= 0 ? "+" : ""}${formatNumber(change, 1)} ${unit} e1RM`}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <EmptyAnalytics text="Log twice to compare." />
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}

function EmptyAnalytics({ text }: { text: string }) {
  return (
    <div className="flex min-h-[150px] items-center justify-center gap-[10px] p-6 text-center text-muted-foreground [&_p]:max-w-[440px] [&_p]:text-xs [&_p]:leading-[1.7]">
      <TrendingUp size={20} />
      <p>{text}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-6">
      <PanelSkeleton chart />
      <PanelSkeleton rows={5} />
      <PanelSkeleton rows={4} />
    </div>
  );
}
