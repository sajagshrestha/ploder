import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type ActivityWorkout,
  calendarDays,
  groupActivity,
} from "@/lib/activity";

export function ActivityHeatmap({ workouts }: { workouts: ActivityWorkout[] }) {
  const [weeks, setWeeks] = useState(13);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const days = useMemo(() => calendarDays(weeks), [weeks]);
  useEffect(() => {
    // On small screens, open the long calendar at the current week.
    const viewport = scrollRef.current?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    );
    if (viewport && days.length) viewport.scrollLeft = viewport.scrollWidth;
  }, [days]);
  const lastVisibleKey = days.filter((day) => !day.future).at(-1)?.key;
  const grouped = useMemo(() => groupActivity(workouts), [workouts]);
  const sessions = days.reduce(
    (n, d) => n + (d.future ? 0 : (grouped.get(d.key)?.length ?? 0)),
    0,
  );
  const activeDays = days.filter((d) => !d.future && grouped.has(d.key)).length;
  const selectedWorkouts = selected ? (grouped.get(selected) ?? []) : [];
  return (
    <section className="dashboard-panel activity-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">SHOWING UP ADDS UP</p>
          <h2>Training consistency</h2>
        </div>
        <fieldset className="segmented" aria-label="Activity period">
          {[
            { weeks: 5, label: "1 month" },
            { weeks: 13, label: "3 months" },
            { weeks: 26, label: "6 months" },
            { weeks: 53, label: "1 year" },
          ].map((period) => (
            <button
              key={period.weeks}
              type="button"
              aria-pressed={weeks === period.weeks}
              onClick={() => {
                setWeeks(period.weeks);
                setSelected(null);
                setFocused(null);
              }}
            >
              {period.label}
            </button>
          ))}
        </fieldset>
      </div>
      <p className="activity-caption">
        <strong>{sessions} workouts</strong> across {activeDays} active days.
        Every session counts.
      </p>
      <ScrollArea
        ref={scrollRef}
        type="always"
        orientation="horizontal"
        className="heatmap-scroll"
        aria-label="Workout activity calendar. Scroll horizontally to explore."
      >
        <div
          className="heatmap-calendar"
          style={{
            minWidth: weeks * 14 + 32,
            maxWidth: weeks * (weeks === 5 ? 40 : 20) + 32,
          }}
        >
          <div
            className="heatmap-months"
            style={{ gridTemplateColumns: `30px repeat(${weeks}, 1fr)` }}
          >
            <span />
            {Array.from({ length: weeks }, (_, i) => {
              const day = days[i * 7].date;
              const previous = i > 0 ? days[(i - 1) * 7].date : null;
              return (
                <span key={days[i * 7].key}>
                  {!previous || previous.getMonth() !== day.getMonth()
                    ? day.toLocaleDateString(undefined, { month: "short" })
                    : ""}
                </span>
              );
            })}
          </div>
          <div className="heatmap-body">
            <div className="heatmap-weekdays">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>
            <div
              className="heatmap-grid"
              style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
            >
              {days.map((day, index) => {
                const count = grouped.get(day.key)?.length ?? 0;
                const label = `${day.date.toLocaleDateString(undefined, { dateStyle: "full" })}: ${count} ${count === 1 ? "workout" : "workouts"}`;
                return (
                  <button
                    key={day.key}
                    type="button"
                    data-day={day.key}
                    tabIndex={(focused ?? lastVisibleKey) === day.key ? 0 : -1}
                    onFocus={() => setFocused(day.key)}
                    onKeyDown={(event) => {
                      const offsets: Record<string, number> = {
                        ArrowLeft: -7,
                        ArrowRight: 7,
                        ArrowUp: -1,
                        ArrowDown: 1,
                      };
                      const offset = offsets[event.key];
                      if (offset === undefined) return;
                      event.preventDefault();
                      const next = days[index + offset];
                      if (next && !next.future)
                        event.currentTarget.parentElement
                          ?.querySelector<HTMLButtonElement>(
                            `[data-day="${next.key}"]`,
                          )
                          ?.focus();
                    }}
                    className="heatmap-cell"
                    data-level={Math.min(count, 4)}
                    data-future={day.future}
                    disabled={day.future}
                    aria-label={label}
                    title={label}
                    aria-pressed={selected === day.key}
                    onClick={() => setSelected(day.key)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
      <div className="heatmap-footer">
        <span>
          <CalendarDays size={14} /> Select a day to explore your sessions
        </span>
        <div className="heatmap-legend">
          Less{" "}
          {[0, 1, 2, 3, 4].map((n) => (
            <i key={n} data-level={n} />
          ))}{" "}
          More
        </div>
      </div>
      {selected && (
        <div className="activity-selection" aria-live="polite">
          <strong>
            {new Date(`${selected}T12:00:00`).toLocaleDateString(undefined, {
              dateStyle: "long",
            })}
          </strong>
          {selectedWorkouts.length ? (
            selectedWorkouts.map((workout) => (
              <Link
                key={workout.id}
                to="/app/history/$id"
                params={{ id: String(workout.id) }}
              >
                {workout.name}
                <ChevronRight size={16} />
              </Link>
            ))
          ) : (
            <p>
              No completed workouts on this day. Rest is part of the process.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
