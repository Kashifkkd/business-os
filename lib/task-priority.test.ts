import { expect, test } from "vitest";
import {
  TASK_PRIORITY_OPTIONS,
  getPriorityLabel,
  getPriorityClassName,
} from "@/lib/task-priority";

test("getPriorityLabel returns label for each priority", () => {
  expect(getPriorityLabel("none")).toBe("None");
  expect(getPriorityLabel("low")).toBe("Low");
  expect(getPriorityLabel("medium")).toBe("Medium");
  expect(getPriorityLabel("high")).toBe("High");
  expect(getPriorityLabel("urgent")).toBe("Urgent");
});

test("getPriorityLabel returns priority value for unknown", () => {
  expect(getPriorityLabel("unknown" as "none")).toBe("unknown");
});

test("getPriorityClassName returns non-empty string for each priority", () => {
  expect(getPriorityClassName("none")).toBeTruthy();
  expect(getPriorityClassName("low")).toBeTruthy();
  expect(getPriorityClassName("medium")).toBeTruthy();
  expect(getPriorityClassName("high")).toBeTruthy();
  expect(getPriorityClassName("urgent")).toBeTruthy();
});

test("TASK_PRIORITY_OPTIONS has expected entries", () => {
  expect(TASK_PRIORITY_OPTIONS.length).toBeGreaterThanOrEqual(5);
  const values = TASK_PRIORITY_OPTIONS.map((o) => o.value);
  expect(values).toContain("none");
  expect(values).toContain("urgent");
});
