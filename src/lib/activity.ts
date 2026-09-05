import type { MyWorkout } from "./my-queries";

export type ActivityWorkout = Pick<
  MyWorkout,
  "id" | "name" | "startedAt" | "completedAt"
>;

/** Calendar keys use the viewer's timezone, including around midnight and DST. */
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function calendarDays(weeks: number, now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - end.getDay() - (weeks - 1) * 7);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(date.getDate() + index);
    return { date, key: dateKey(date), future: date > end };
  });
}

export function groupActivity(workouts: ActivityWorkout[]) {
  const days = new Map<string, ActivityWorkout[]>();
  for (const workout of workouts) {
    const key = dateKey(new Date(workout.startedAt));
    const entries = days.get(key) ?? [];
    entries.push(workout);
    days.set(key, entries);
  }
  return days;
}

/**
 * Completed workouts per calendar week (weeks start on Sunday), oldest first.
 * By default the newest bucket is the current week, even while it's still in
 * progress. Pass `completedOnly` to end on the most recent fully finished
 * week instead — useful where a partial "this week" bar would mislead.
 */
export function weeklyActivity(
  workouts: ActivityWorkout[],
  weeks: number,
  now = new Date(),
  completedOnly = false,
) {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Start of the calendar week containing `now` (Sunday).
  const thisWeekStart = new Date(end);
  thisWeekStart.setDate(end.getDate() - end.getDay());
  // completedOnly drops the current week, so the window shifts one week back
  // and every bucket is a finished Sunday–Saturday range.
  const start = new Date(thisWeekStart);
  start.setDate(
    thisWeekStart.getDate() - (completedOnly ? weeks : weeks - 1) * 7,
  );
  const grouped = groupActivity(workouts);
  return Array.from({ length: weeks }, (_, index) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + index * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const label = weekRangeLabel(weekStart);
    const value = weekRangeDays(weekStart, weekEnd).reduce(
      (count, date) => count + (grouped.get(dateKey(date))?.length ?? 0),
      0,
    );
    return { label, value };
  });
}

function weekRangeDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

/**
 * Completed workouts per calendar day over the trailing `days` days
 * (oldest first, ending today).
 */
export function dailyActivity(
  workouts: ActivityWorkout[],
  days = 7,
  now = new Date(),
) {
  const grouped = groupActivity(workouts);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(end);
    date.setDate(end.getDate() - (days - 1 - index));
    return {
      label: date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      value: grouped.get(dateKey(date))?.length ?? 0,
    };
  });
}

/** "Jul 12–18" or, across a month, "Jul 26–Aug 1". */
function weekRangeLabel(start: Date): string {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const short = (date: Date) =>
    date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  const startLabel = short(start);
  const endLabel = short(end);
  const month = endLabel.split(" ")[0];
  return endLabel.startsWith(`${startLabel.split(" ")[0]} `)
    ? `${startLabel}–${endLabel.slice(month.length + 1)}`
    : `${startLabel}–${endLabel}`;
}
