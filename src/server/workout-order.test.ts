import assert from "node:assert/strict";
import test from "node:test";
import {
  myWorkoutExerciseOrderSchema,
  myWorkoutExercisesAddSchema,
} from "./validators";

test("workout order accepts a permutation and preserves its order", () => {
  assert.deepEqual(
    myWorkoutExerciseOrderSchema.parse({ exerciseIds: [9, 2, 7] }).exerciseIds,
    [9, 2, 7],
  );
});

test("workout order rejects duplicate, missing, temporary and noninteger IDs", () => {
  for (const exerciseIds of [
    [],
    [1, 1],
    [-1, 2],
    [0, 2],
    [1.5, 2],
    ["1", 2],
    new Array(501).fill(1),
  ]) {
    assert.equal(
      myWorkoutExerciseOrderSchema.safeParse({ exerciseIds }).success,
      false,
    );
  }
  assert.equal(myWorkoutExerciseOrderSchema.safeParse({}).success, false);
});

test("batch add preserves selection order and rejects invalid or excessive selections", () => {
  assert.deepEqual(
    myWorkoutExercisesAddSchema.parse({ exerciseIds: [7, 3] }).exerciseIds,
    [7, 3],
  );
  for (const exerciseIds of [
    [],
    [1, 1],
    [-1],
    [1.2],
    Array.from({ length: 51 }, (_, i) => i + 1),
  ]) {
    assert.equal(
      myWorkoutExercisesAddSchema.safeParse({ exerciseIds }).success,
      false,
    );
  }
});
