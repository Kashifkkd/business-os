import { expect, test } from "vitest";
import {
  apiSuccess,
  apiError,
  API_ERROR_CODES,
  statusToErrorCode,
  getDataOrThrow,
  isApiSuccess,
} from "@/lib/api-response";

test("apiSuccess returns success true and data", () => {
  const res = apiSuccess({ id: 1 });
  expect(res.success).toBe(true);
  expect(res.data).toEqual({ id: 1 });
  expect(res.total).toBeUndefined();
});

test("apiSuccess with total includes total", () => {
  const res = apiSuccess([{ id: 1 }], 42);
  expect(res.success).toBe(true);
  expect(res.total).toBe(42);
});

test("apiError returns success false and error", () => {
  const res = apiError(API_ERROR_CODES.NOT_FOUND, "Org not found");
  expect(res.success).toBe(false);
  expect(res.error).toEqual({ code: "NOT_FOUND", message: "Org not found" });
  expect(res.data).toBeUndefined();
});

test("statusToErrorCode maps status codes", () => {
  expect(statusToErrorCode(400)).toBe(API_ERROR_CODES.BAD_REQUEST);
  expect(statusToErrorCode(401)).toBe(API_ERROR_CODES.UNAUTHORIZED);
  expect(statusToErrorCode(403)).toBe(API_ERROR_CODES.FORBIDDEN);
  expect(statusToErrorCode(404)).toBe(API_ERROR_CODES.NOT_FOUND);
  expect(statusToErrorCode(409)).toBe(API_ERROR_CODES.CONFLICT);
  expect(statusToErrorCode(422)).toBe(API_ERROR_CODES.VALIDATION_ERROR);
  expect(statusToErrorCode(500)).toBe(API_ERROR_CODES.INTERNAL_ERROR);
});

test("getDataOrThrow returns data for success response", () => {
  const data = { id: 1 };
  expect(getDataOrThrow({ success: true, data })).toEqual(data);
});

test("getDataOrThrow throws for error response with message and code", () => {
  expect(() =>
    getDataOrThrow({
      success: false,
      error: { code: "NOT_FOUND", message: "Not found" },
    })
  ).toThrow("Not found");

  try {
    getDataOrThrow({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Unauthorized" },
    });
  } catch (e) {
    expect((e as Error & { code?: string }).code).toBe("UNAUTHORIZED");
  }
});

test("getDataOrThrow returns raw response when not wrapped", () => {
  const raw = { items: [] };
  expect(getDataOrThrow(raw)).toEqual(raw);
});

test("isApiSuccess type guard: true for success", () => {
  const res = apiSuccess(1);
  expect(isApiSuccess(res)).toBe(true);
  if (isApiSuccess(res)) expect(res.data).toBe(1);
});

test("isApiSuccess type guard: false for error", () => {
  const res = apiError(API_ERROR_CODES.BAD_REQUEST, "Bad");
  expect(isApiSuccess(res)).toBe(false);
});
