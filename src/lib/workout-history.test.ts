import assert from "node:assert/strict";
import test from "node:test";
import {
  myWorkoutBulkDeleteSchema,
  myWorkoutHistoryQuery,
} from "../server/validators";
import {
  csvCell,
  historyCsv,
  historyDateBounds,
  historySearchSchema,
  workoutDuration,
} from "./workout-history";

test("date filters include all of the selected local day and stop at next midnight", () => {
  const bounds = historyDateBounds("2026-09-06", "2026-09-06");
  assert.equal(bounds.from, new Date(2026, 8, 6).toISOString());
  assert.equal(bounds.to, new Date(2026, 8, 7).toISOString());
  assert.equal(myWorkoutHistoryQuery.safeParse(bounds).success, true);
  assert.deepEqual(historyDateBounds(), { from: undefined, to: undefined });
});

test("local end boundary follows the calendar through a daylight-saving change", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    const bounds = historyDateBounds("2026-03-08", "2026-03-08");
    assert.equal(bounds.from, "2026-03-08T05:00:00.000Z");
    assert.equal(bounds.to, "2026-03-09T04:00:00.000Z");
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test("invalid dates, reversed ranges and excessive pagination are rejected by the API", () => {
  for (const query of [
    { from: "2026-02-30" },
    { from: "2026-09-07T00:00:00Z", to: "2026-09-06T00:00:00Z" },
    { from: "2026-09-06T00:00:00.000Z", to: "2026-09-06T00:00:00Z" },
    { page: 0 },
    { pageSize: 101 },
    { status: "unknown" },
  ])
    assert.equal(myWorkoutHistoryQuery.safeParse(query).success, false);
  const parsed = myWorkoutHistoryQuery.parse({
    page: "2",
    pageSize: "10",
    search: " Legs ",
    sort: "oldest",
  });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.search, "Legs");
  assert.equal(parsed.sort, "oldest");
});

test("malformed URL filters fall back to usable defaults", () => {
  const result = historySearchSchema.parse({
    page: -1,
    pageSize: 999,
    from: "2026-02-30",
    status: "unknown",
  });
  assert.equal(result.page, undefined);
  assert.equal(result.pageSize, undefined);
  assert.equal(result.from, undefined);
  assert.equal(result.status, undefined);
});

test("bulk delete rejects empty, duplicate, temporary and excessive selections", () => {
  assert.deepEqual(
    myWorkoutBulkDeleteSchema.parse({ ids: [25, 26] }).ids,
    [25, 26],
  );
  for (const ids of [
    [],
    [25, 25],
    [-1],
    [0],
    [1.5],
    ["25"],
    Array.from({ length: 101 }, (_, index) => index + 1),
  ]) {
    assert.equal(myWorkoutBulkDeleteSchema.safeParse({ ids }).success, false);
  }
});

test("CSV preserves punctuation and multiline notes and escapes formula-like values", () => {
  assert.equal(csvCell('Legs, "A"'), '"Legs, ""A"""');
  assert.equal(csvCell("line one\nline two"), '"line one\nline two"');
  assert.equal(csvCell(" =1+1"), '"\' =1+1"');
  assert.equal(csvCell("@SUM(A1)"), '"\'@SUM(A1)"');
  const csv = historyCsv(
    [
      {
        id: 25,
        userId: 1,
        splitDayId: null,
        name: "Legs",
        startedAt: "2026-09-06T00:00:00Z",
        completedAt: null,
        status: "in_progress",
        notes: null,
        exerciseCount: 3,
        setCount: 4,
        volume: 400,
      },
    ],
    "kg",
  );
  assert.match(csv, /Volume \(kg\)/);
  assert.match(csv, /"3","4","400",""/);
});

test("duration distinguishes active, short and hour-long workouts", () => {
  const startedAt = "2026-09-06T00:00:00Z";
  assert.equal(
    workoutDuration({ startedAt, completedAt: null }),
    "In progress",
  );
  assert.equal(
    workoutDuration({ startedAt, completedAt: startedAt }),
    "<1 min",
  );
  assert.equal(
    workoutDuration({ startedAt, completedAt: "2026-09-06T01:03:00Z" }),
    "1h 3m",
  );
});
