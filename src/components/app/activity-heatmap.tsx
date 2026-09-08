import { Link } from "@tanstack/react-router";
import { CalendarDays, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelHeading } from "@/components/app/panel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type ActivityWorkout,
  calendarDays,
  groupActivity,
} from "@/lib/activity";

const PERIODS = [
  { weeks: 5, label: "1 month" },
  { weeks: 13, label: "3 months" },
  { weeks: 26, label: "6 months" },
  { weeks: 53, label: "1 year" },
] as const;

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
    <Panel className="activity-panel">
      <PanelHeading>
        <div>
          <h2 className="text-[15px] font-bold tracking-[-0.35px]">
            Consistency
          </h2>
        </div>
        <Select
          value={String(weeks)}
          onValueChange={(value) => {
            setWeeks(Number(value));
            setSelected(null);
            setFocused(null);
          }}
        >
          <SelectTrigger
            className="w-32"
            size="sm"
            aria-label="Activity period"
          >
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent align="end">
            {PERIODS.map((period) => (
              <SelectItem key={period.weeks} value={String(period.weeks)}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelHeading>
      <p className="mt-[-2px] mb-5 text-[10px] text-muted-foreground max-mobile:text-[9px] max-mobile:leading-[1.8] [&_strong]:font-semibold [&_strong]:text-foreground">
        <strong>{sessions} workouts</strong> · {activeDays} days.
      </p>
      <ScrollArea
        ref={scrollRef}
        type="always"
        orientation="horizontal"
        className="px-[3px] pt-[3px] pb-[10px] [&_[data-slot=scroll-area-scrollbar]]:bg-transparent"
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
            className="grid h-6 text-[8px] text-muted-foreground [&_span]:whitespace-nowrap"
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
          <div className="flex gap-2">
            <div className="grid w-[22px] shrink-0 grid-rows-7 gap-1 text-[8px] text-muted-foreground [&_span]:flex [&_span]:items-center">
              <span />
              <span>Mon</span>
              <span />
              <span>Wed</span>
              <span />
              <span>Fri</span>
              <span />
            </div>
            <div
              className="grid flex-1 grid-rows-7 grid-flow-col gap-1"
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
                    className="aspect-square min-w-0 rounded-[3px] border border-[#80808008] transition-transform duration-150 data-[future=true]:invisible data-[level=0]:bg-(--heat-0) data-[level=1]:bg-(--heat-1) data-[level=2]:bg-(--heat-2) data-[level=3]:bg-(--heat-3) data-[level=4]:bg-(--heat-4) hover:scale-[1.2] hover:outline-[1px_solid_var(--ring)] aria-[pressed=true]:outline-[2px_solid_var(--foreground)] aria-[pressed=true]:outline-offset-[1px]"
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
      <div className="mt-[14px] flex items-center justify-between gap-[14px] text-[10px] text-muted-foreground max-mobile:flex-col max-mobile:items-start max-mobile:gap-3 [&_span]:flex [&_span]:items-center [&_span]:gap-[6px]">
        <span>
          <CalendarDays size={14} /> Tap a day
        </span>
      </div>
      {selected && (
        <div
          className="mt-4 border-t border-border pt-[15px] text-[11px] max-mobile:leading-[1.8] [&_a]:flex [&_a]:items-center [&_a]:justify-between [&_a]:py-3 [&_p]:mt-[9px] [&_p]:text-muted-foreground"
          aria-live="polite"
        >
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
            <p>Rest day.</p>
          )}
        </div>
      )}
    </Panel>
  );
}
