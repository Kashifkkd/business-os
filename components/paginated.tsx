"use client";

import { Fragment, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export type PaginatedParams = Record<string, string>;

type PaginatedProps = {
  /** Base path for links (e.g. /orgId/menu/items) */
  pathname: string;
  /** Current page (1-based) */
  page: number;
  /** Page size (used only to include in URL when not default) */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Default page size; when pageSize === defaultPageSize, pageSize is omitted from URL */
  defaultPageSize?: number;
  /** Extra query params to include in every page link (e.g. { search: "foo" }) */
  params?: PaginatedParams;
  /** Page size options for selector; when omitted, selector is hidden */
  pageSizeOptions?: number[];
};

function buildQuery(
  page: number,
  pageSize: number,
  defaultPageSize: number,
  params?: PaginatedParams
): string {
  const q: PaginatedParams = { ...params };
  if (page > 1) q.page = String(page);
  if (pageSize !== defaultPageSize) q.pageSize = String(pageSize);
  const search = new URLSearchParams(q).toString();
  return search ? `?${search}` : "";
}

export function Paginated({
  pathname,
  page,
  pageSize,
  totalPages,
  defaultPageSize = 10,
  params = {},
  pageSizeOptions = [10, 20, 50, 100],
}: PaginatedProps) {
  const router = useRouter();

  const pages = [
    1,
    ...Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) =>
        p > 1 &&
        p < totalPages &&
        p >= page - 2 &&
        p <= page + 2
    ),
    ...(totalPages > 1 ? [totalPages] : []),
  ]
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .sort((a, b) => a - b);

  const prevHref =
    page > 1
      ? `${pathname}${buildQuery(page - 1, pageSize, defaultPageSize, params)}`
      : "#";
  const nextHref =
    page < totalPages
      ? `${pathname}${buildQuery(page + 1, pageSize, defaultPageSize, params)}`
      : "#";

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const size = Number(value);
      if (!Number.isFinite(size) || size <= 0) return;
      const search = buildQuery(1, size, defaultPageSize, params);
      router.push(`${pathname}${search}`);
    },
    [pathname, params, defaultPageSize, router]
  );

  if (totalPages <= 1) return null;


  return (
    <div className="sticky bottom-0 z-20 border-t bg-background/95 px-2 py-2 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {pageSizeOptions.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={prevHref}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {pages.map((p, i) => (
              <Fragment key={p}>
                {i > 0 && pages[i - 1] !== p - 1 && (
                  <PaginationItem>
                    <span className="flex size-9 items-center justify-center px-1 text-muted-foreground">
                      …
                    </span>
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href={`${pathname}${buildQuery(
                      p,
                      pageSize,
                      defaultPageSize,
                      params
                    )}`}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              </Fragment>
            ))}
            <PaginationItem>
              <PaginationNext
                href={nextHref}
                className={
                  page >= totalPages ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
