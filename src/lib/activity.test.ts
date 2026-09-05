import assert from "node:assert/strict";
import test from "node:test";
import {
  calendarDays,
  dailyActivity,
  dateKey,
  groupActivity,
  weeklyActivity,
} from "./activity";

test("calendar aligns Sunday columns, includes today, and disables future dates", () => {
  const now = new Date(2026, 8, 2, 15);
  const days = calendarDays(53, now);
  assert.equal(days.length, 371);
  assert.equal(days[0].date.getDay(), 0);
  assert.equal(days.filter((d) => d.key === "2026-09-02").length, 1);
  assert.equal(days.filter((d) => d.future).length, 3);
  assert.equal(new Set(days.map((d) => d.key)).size, days.length);
});

test("calendar uses calendar arithmetic across daylight-saving transitions", () => {
  const previous = process.env.TZ;
  process.env.TZ = "America/New_York";
  try {
    const days = calendarDays(4, new Date(2026, 2, 15));
    assert.equal(new Set(days.map((d) => d.key)).size, 28);
    assert.ok(days.some((d) => d.key === "2026-03-08"));
    assert.ok(days.every((d) => d.date.getHours() === 0));
  } finally {
    if (previous) process.env.TZ = previous;
    else delete process.env.TZ;
  }
});

test("multiple sessions on one local date share a cell and count toward weekly totals", () => {
  const at = (id: number, day: number) => ({
    id,
    name: "Session",
    startedAt: new Date(2026, 8, day, 8).toISOString(),
    completedAt: new Date(2026, 8, day, 9).toISOString(),
  });
  const rows = [at(1, 1), at(2, 1), at(3, 3)];
  assert.equal(groupActivity(rows).get("2026-09-01")?.length, 2);
  const weeks = weeklyActivity(rows, 4, new Date(2026, 8, 5));
  assert.deepEqual(
    weeks.map((w) => w.value),
    [0, 0, 0, 3],
  );
});

test("completedOnly ends on the last finished week and skips the in-progress one", () => {
  const at = (id: number, month: number, day: number) => ({
    id,
    name: "Session",
    startedAt: new Date(2026, month, day, 8).toISOString(),
    completedAt: new Date(2026, month, day, 9).toISOString(),
  });
  const rows = [at(1, 8, 1), at(2, 7, 26)]; // this week + last week
  const now = new Date(2026, 8, 5);
  const withCurrent = weeklyActivity(rows, 2, now);
  assert.deepEqual(
    withCurrent.map((w) => w.value),
    [1, 1],
  );
  const finishedOnly = weeklyActivity(rows, 2, now, true);
  assert.deepEqual(
    finishedOnly.map((w) => w.value),
    [0, 1],
  );
  assert.equal(finishedOnly.at(-1)?.label, "Aug 23–29");
});

test("a workout near UTC midnight belongs to the viewer's local day", () => {
  const date = new Date(2026, 0, 1, 0, 15);
  const row = {
    id: 1,
    name: "Night session",
    startedAt: date.toISOString(),
    completedAt: date.toISOString(),
  };
  assert.equal(groupActivity([row]).get(dateKey(date))?.length, 1);
});

test("dailyActivity buckets the trailing days oldest-first and ends today", () => {
  // Now = Sat 2026-09-05; trailing 7 days span Aug 30 – Sep 5.
  const at = (id: number, day: number) => ({
    id,
    name: "Session",
    startedAt: new Date(2026, 8, day, 8).toISOString(),
    completedAt: new Date(2026, 8, day, 9).toISOString(),
  });
  const rows = [at(1, 3), at(2, 5), at(3, 5)];
  const daily = dailyActivity(rows, 7, new Date(2026, 8, 5));
  assert.equal(daily.length, 7);
  assert.deepEqual(
    daily.map((d) => d.value),
    [0, 0, 0, 0, 1, 0, 2],
  );
  assert.equal(daily.at(-1)?.label, "Sep 5");
});
