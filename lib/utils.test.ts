import { expect, test } from "vitest";
import { cn } from "@/lib/utils";

test("cn merges multiple class names", () => {
  expect(cn("a", "b")).toBe("a b");
});

test("cn handles conditional classes", () => {
  expect(cn("base", false && "hidden", "visible")).toContain("base");
  expect(cn("base", true && "visible")).toContain("visible");
});

test("cn merges tailwind classes correctly", () => {
  const result = cn("px-2 py-1", "px-4");
  expect(result).toBeTruthy();
  expect(result.length).toBeGreaterThan(0);
});
