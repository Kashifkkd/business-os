import { expect, test } from "vitest";
import {
  formatPrice,
  truncate,
  formatDate,
  formatTime,
  formatDateTime,
  formatTimeAgo,
} from "@/lib/format";

test("formatPrice: null and undefined return em dash", () => {
  expect(formatPrice(null)).toBe("—");
  expect(formatPrice(undefined)).toBe("—");
});

test("formatPrice: number formats as USD with two decimals", () => {
  expect(formatPrice(0)).toBe("$0.00");
  expect(formatPrice(99.5)).toBe("$99.50");
  expect(formatPrice(1234.56)).toBe("$1,234.56");
});

test("truncate: empty or null returns em dash", () => {
  expect(truncate("", 10)).toBe("—");
  expect(truncate(null, 10)).toBe("—");
  expect(truncate(undefined, 10)).toBe("—");
});

test("truncate: string shorter than max unchanged", () => {
  expect(truncate("Hi", 10)).toBe("Hi");
});

test("truncate: string longer than max gets ellipsis", () => {
  expect(truncate("Hello world", 5)).toBe("Hello…");
  expect(truncate("Abc", 3)).toBe("Abc");
  expect(truncate("Abcd", 3)).toBe("Abc…");
});

test("formatDate: null or undefined returns em dash", () => {
  expect(formatDate(null)).toBe("—");
  expect(formatDate(undefined)).toBe("—");
});

test("formatDate: invalid date string returns em dash", () => {
  expect(formatDate("not-a-date")).toBe("—");
});

test("formatDate: valid date string formatted", () => {
  const result = formatDate("2025-01-15");
  expect(result).toMatch(/Jan/);
  expect(result).toMatch(/15/);
  expect(result).toMatch(/2025/);
});

test("formatTime: null returns em dash", () => {
  expect(formatTime(null)).toBe("—");
});

test("formatTime: valid date returns time part", () => {
  const result = formatTime("2025-01-15T14:30:00");
  expect(result).toMatch(/\d/);
});

test("formatDateTime: null returns em dash", () => {
  expect(formatDateTime(null)).toBe("—");
});

test("formatDateTime: valid date returns date and time", () => {
  const result = formatDateTime("2025-01-15T14:30:00");
  expect(result).toMatch(/Jan|15|2025/);
});

test("formatTimeAgo: null returns em dash", () => {
  expect(formatTimeAgo(null)).toBe("—");
});

test("formatTimeAgo: recent past returns just now or min ago", () => {
  const now = new Date();
  const thirtySecAgo = new Date(now.getTime() - 30 * 1000);
  expect(formatTimeAgo(thirtySecAgo)).toBe("just now");

  const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
  expect(formatTimeAgo(twoMinAgo)).toBe("2 min ago");
});
