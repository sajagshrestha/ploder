import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { ProgressChart } from "@/components/app/progress-chart";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="progress-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRAIN WITH FEEDBACK</p>
          <h1>
            Know what is progressing<span className="heading-dot">.</span>
          </h1>
          <p>
            Follow training frequency, working-set volume, and performance on
            every lift.
          </p>
        </div>
        <span className="icon-tile lime">
          <TrendingUp size={20} />
        </span>
      </div>

      <fieldset className="analytics-period" aria-label="Analytics period">
        <legend>Time period</legend>
        <div className="segmented">
          {[4, 8, 12, 24].map((period) => (
            <button
              key={period}
              type="button"
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
        <section className="dashboard-panel">
          <div className="inline-error">
            Couldn’t load training analytics.{" "}
            <button type="button" onClick={() => analytics.refetch()}>
              Retry
            </button>
          </div>
        </section>
      ) : data ? (
        <>
          <section className="dashboard-panel analytics-chart-panel">
            <div className="panel-heading analytics-heading">
              <div>
                <p className="eyebrow">PROGRESSIVE OVERLOAD</p>
                <h2>Workload over time</h2>
              </div>
              <fieldset className="segmented" aria-label="Workload metric">
                {(Object.keys(metricMeta) as Metric[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={metric === option}
                    onClick={() => setMetric(option)}
                  >
                    {metricMeta[option].label}
                  </button>
                ))}
              </fieldset>
            </div>
            <p className="form-help">
              Weekly totals from completed working sets. Use volume with reps
              and lift performance; no single metric tells the whole story.
            </p>
            {chartRows.some((row) => row.value > 0) ? (
              <ProgressChart
                rows={chartRows}
                label={`${metricMeta[metric].label} by week`}
                kind="line"
                unit={metricMeta[metric].unit}
                rowHeader="Week of"
              />
            ) : (
              <EmptyAnalytics text="Complete and log working sets to build your workload trend." />
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">STIMULUS DISTRIBUTION</p>
                <h2>Muscle-group frequency</h2>
              </div>
            </div>
            <p className="form-help">
              Average distinct sessions and working sets per week for each
              primary muscle group.
            </p>
            {data.muscleGroups.length ? (
              <div className="muscle-frequency-list">
                {data.muscleGroups.map((muscle) => (
                  <div
                    className="muscle-frequency-row"
                    key={muscle.muscleGroup}
                  >
                    <div>
                      <strong>{titleCase(muscle.muscleGroup)}</strong>
                      <span>
                        {formatNumber(muscle.setsPerWeek, 1)} sets/week
                      </span>
                    </div>
                    <div className="frequency-bar" aria-hidden="true">
                      <i
                        style={{
                          width: `${Math.min(100, (muscle.sessionsPerWeek / 3) * 100)}%`,
                        }}
                      />
                    </div>
                    <b>{formatNumber(muscle.sessionsPerWeek, 1)}× / week</b>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyAnalytics text="Your trained muscle groups will appear after your first completed workout." />
            )}
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">LIFT BY LIFT</p>
                <h2>Exercise progression</h2>
              </div>
            </div>
            <p className="form-help">
              Best estimated 1RM set from your latest session compared with the
              previous time you performed that exercise.
            </p>
            {data.exercises.length ? (
              <div className="exercise-progress-list">
                {data.exercises.map((exercise) => {
                  const change = exercise.estimated1rmChange;
                  return (
                    <article
                      className="exercise-progress-row"
                      key={exercise.exerciseId}
                    >
                      <div className="exercise-progress-name">
                        <strong>{exercise.name}</strong>
                        <span>{titleCase(exercise.muscleGroup)}</span>
                      </div>
                      <div className="lift-comparison">
                        <span>Previous</span>
                        <strong>
                          {exercise.previous
                            ? `${formatNumber(exercise.previous.weight, 1)} ${unit} × ${exercise.previous.reps}`
                            : "First logged session"}
                        </strong>
                      </div>
                      <div className="lift-comparison current">
                        <span>Latest</span>
                        <strong>
                          {formatNumber(exercise.current.weight, 1)} {unit} ×{" "}
                          {exercise.current.reps}
                        </strong>
                      </div>
                      <span
                        className="progress-delta"
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
              <EmptyAnalytics text="Log the same exercise in two completed sessions to see a useful comparison." />
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function EmptyAnalytics({ text }: { text: string }) {
  return (
    <div className="analytics-empty">
      <TrendingUp size={20} />
      <p>{text}</p>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="analytics-loading">
      <Skeleton className="h-80 rounded-3xl" />
      <Skeleton className="h-64 rounded-3xl" />
    </div>
  );
}
