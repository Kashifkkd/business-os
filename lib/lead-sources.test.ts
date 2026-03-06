import { expect, test } from "vitest";
import {
  DEFAULT_SOURCE_COLOR,
  normalizeSourceColor,
  sourceColorMap,
} from "@/lib/lead-sources";

test("normalizeSourceColor: undefined returns default", () => {
  expect(normalizeSourceColor(undefined)).toBe(DEFAULT_SOURCE_COLOR);
});

test("normalizeSourceColor: empty string returns default", () => {
  expect(normalizeSourceColor("")).toBe(DEFAULT_SOURCE_COLOR);
});

test("normalizeSourceColor: adds # if missing", () => {
  expect(normalizeSourceColor("abc")).toBe("#abc");
  expect(normalizeSourceColor("64748b")).toMatch(/^#/);
});

test("normalizeSourceColor: keeps # and truncates to 7 chars", () => {
  expect(normalizeSourceColor("#64748b")).toBe("#64748b");
  expect(normalizeSourceColor("#64748bff")).toBe("#64748b");
});

test("sourceColorMap: builds name to color map", () => {
  const sources = [
    { name: "Web", color: "#2563eb" },
    { name: "Referral", color: "059669" },
  ];
  const map = sourceColorMap(sources);
  expect(map.Web).toBe("#2563eb");
  expect(map.Referral).toBe("#059669");
});

test("sourceColorMap: skips empty name", () => {
  const sources = [
    { name: "  ", color: "#111" },
    { name: "A", color: "#222" },
  ];
  const map = sourceColorMap(sources);
  expect(map["A"]).toBe("#222");
  expect(Object.keys(map)).toContain("A");
});
