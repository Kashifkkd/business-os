/**
 * Common API response wrapper for all routes.
 *
 * In API routes – no unwrapping; just return the response as defined:
 *   return NextResponse.json(apiSuccess(data));
 *   return NextResponse.json(apiSuccess(items, total), { status: 200 });
 *   return NextResponse.json(apiError(API_ERROR_CODES.NOT_FOUND, "Org not found"), { status: 404 });
 *
 * Client receives the full { success, data?, total?, error? } and handles it (e.g. via getDataOrThrow).
 */

export const API_ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export interface ApiErrorBody {
  code: ApiErrorCode | string;
  message: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  /** When data is an array (e.g. list/paginated), total count. */
  total?: number;
}

export interface ApiErrorResponse {
  success: false;
  data?: never;
  total?: never;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/** Create a success response. Use in API route: return NextResponse.json(apiSuccess(data, total?)) */
export function apiSuccess<T>(data: T, total?: number): ApiSuccessResponse<T> {
  const res: ApiSuccessResponse<T> = { success: true, data };
  if (total !== undefined) res.total = total;
  return res;
}

/** Create an error response. Use in API route: return NextResponse.json(apiError(...), { status }) */
export function apiError(
  code: ApiErrorCode | string,
  message: string
): ApiErrorResponse {
  return {
    success: false,
    error: { code, message },
  };
}

/** Map HTTP status to default error code. */
export function statusToErrorCode(status: number): ApiErrorCode | string {
  switch (status) {
    case 400:
      return API_ERROR_CODES.BAD_REQUEST;
    case 401:
      return API_ERROR_CODES.UNAUTHORIZED;
    case 403:
      return API_ERROR_CODES.FORBIDDEN;
    case 404:
      return API_ERROR_CODES.NOT_FOUND;
    case 409:
      return API_ERROR_CODES.CONFLICT;
    case 422:
      return API_ERROR_CODES.VALIDATION_ERROR;
    default:
      return API_ERROR_CODES.INTERNAL_ERROR;
  }
}

/**
 * Get data from an API response or throw on error. Use when you need T from ApiResponse<T>.
 * Call after fetcher: getDataOrThrow(await fetcher(url))
 * Supports both wrapped { success, data, error } and raw responses (treated as data) for backward compatibility.
 */
export function getDataOrThrow<T>(response: unknown): T {
  if (response && typeof response === "object" && "success" in response) {
    const w = response as ApiResponse<unknown>;
    if (w.success === false) {
      const msg = w.error?.message ?? "Request failed";
      const err = new Error(msg) as Error & { code?: string };
      err.code = w.error?.code;
      throw err;
    }
    if ("data" in w && w.success === true) return w.data as T;
  }
  return response as T;
}

/**
 * Type guard: response is success with data.
 */
export function isApiSuccess<T>(r: ApiResponse<T>): r is ApiSuccessResponse<T> {
  return r.success === true;
}
