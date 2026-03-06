import { expect, test } from "vitest";
import { getInitials } from "@/lib/get-initials";

test("getInitials returns first and last initial for full name", () => {
  expect(getInitials("John Doe")).toBe("JD");
  expect(getInitials("Jane Marie Smith")).toBe("JS");
});

test("getInitials returns first two chars for single name", () => {
  expect(getInitials("John")).toBe("JO");
  expect(getInitials("A")).toBe("A");
});

test("getInitials uses fallback when provided", () => {
  expect(getInitials("", "AB")).toBe("AB");
  expect(getInitials("John Doe", "XY")).toBe("XY");
});

test("getInitials trims whitespace", () => {
  expect(getInitials("  John   Doe  ")).toBe("JD");
});

test("getInitials returns em dash for empty string without fallback", () => {
  expect(getInitials("")).toBe("—");
  expect(getInitials("   ")).toBe("—");
});
