"use client";

import { Fragment } from "react";
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
}: PaginatedProps) {
  if (totalPages <= 1) return null;

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

  return (
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
                href={`${pathname}${buildQuery(p, pageSize, defaultPageSize, params)}`}
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
  );
}
