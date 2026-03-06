import { expect, test } from "vitest";
import { isArrayWithValues } from "@/lib/is-array-with-values";

test("isArrayWithValues: null and undefined return false", () => {
  expect(isArrayWithValues(null)).toBe(false);
  expect(isArrayWithValues(undefined)).toBe(false);
});

test("isArrayWithValues: empty array returns false", () => {
  expect(isArrayWithValues([])).toBe(false);
});

test("isArrayWithValues: non-empty array returns true", () => {
  expect(isArrayWithValues([1])).toBe(true);
  expect(isArrayWithValues([1, 2, 3])).toBe(true);
  expect(isArrayWithValues(["a"])).toBe(true);
});

test("isArrayWithValues: type guard narrows to T[]", () => {
  const value: number[] | null = [1, 2];
  if (isArrayWithValues(value)) {
    expect(value.length).toBe(2);
    expect(value[0]).toBe(1);
  }
});
