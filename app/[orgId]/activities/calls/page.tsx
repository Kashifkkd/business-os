"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useActivityCalls } from "@/hooks/use-activities";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchBox } from "@/components/search-box";
import {
  DateRangeFilter,
  getDefaultDateRange,
  dateRangeToApiParams,
  DATE_PRESETS,
  type DateRangeValue,
  type DatePresetId,
} from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import { ActivityCallsTable } from "./activity-calls-table";
import { Plus } from "lucide-react";
import { format } from "date-fns";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function ActivityCallsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: {
      page?: number;
      search?: string;
      datePreset?: DatePresetId;
      dateFrom?: string;
      dateTo?: string;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const dp = updates.datePreset ?? searchParams.get("datePreset") ?? "allTime";
      const df = updates.dateFrom ?? searchParams.get("dateFrom") ?? "";
      const dt = updates.dateTo ?? searchParams.get("dateTo") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (dp && dp !== "allTime") next.set("datePreset", dp);
      else next.delete("datePreset");
      if (dp === "custom" && df) next.set("dateFrom", df);
      else next.delete("dateFrom");
      if (dp === "custom" && dt) next.set("dateTo", dt);
      else next.delete("dateTo");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchParams]
  );

  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === searchFromUrl.trim()) return;
    setParamsRef.current({ search: trimmed, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
  const search = searchParams.get("search") ?? "";
  const datePreset = (searchParams.get("datePreset") as DatePresetId) || "allTime";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";

  const dateRangeValue: DateRangeValue = useMemo(() => {
    const defaultRange = getDefaultDateRange();
    if (datePreset === "allTime") return defaultRange;
    if (datePreset === "custom") {
      const fromStr = dateFrom.slice(0, 10);
      const toStr = dateTo.slice(0, 10);
      if (!fromStr || !toStr) return defaultRange;
      const from = new Date(fromStr + "T12:00:00");
      const to = new Date(toStr + "T12:00:00");
      return {
        presetId: "custom",
        from: fromStr,
        to: toStr,
        label: `${format(from, "LLL dd, yy")} – ${format(to, "LLL dd, yy")}`,
      };
    }
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    return preset ? preset.getValue() : defaultRange;
  }, [datePreset, dateFrom, dateTo]);

  const handleDateRangeChange = useCallback(
    (value: DateRangeValue) => {
      setParams({
        datePreset: value.presetId,
        dateFrom: value.presetId === "custom" ? value.from : "",
        dateTo: value.presetId === "custom" ? value.to : "",
        page: 1,
      });
    },
    [setParams]
  );

  const apiDateParams = dateRangeToApiParams(datePreset, dateFrom, dateTo);

  const { data, isLoading, isRefetching } = useActivityCalls(
    orgId,
    {
      page,
      pageSize,
      search: search.trim() || undefined,
      ...apiDateParams,
    },
    { enabled: !!orgId && mounted }
  );

  const tableData = data ?? {
    items: [],
    total: 0,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const searchParamsForTable = {
    page: String(tableData.page),
    pageSize: String(tableData.pageSize),
    ...(search && { search }),
    ...(datePreset !== "allTime" && { datePreset }),
    ...(datePreset === "custom" && dateFrom && { dateFrom }),
    ...(datePreset === "custom" && dateTo && { dateTo }),
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-md font-semibold">Activity Calls</h1>
          <p className="text-muted-foreground text-xs">
            Call logs linked to leads and deals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search..."
            className="w-56 sm:w-64"
          />
          <DateRangeFilter
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            placeholder="Date range"
          />
          <Button asChild size="sm">
            <Link href={`/${orgId}/activities/calls/new`}>
              <Plus className="size-3.5" />
              Log call
            </Link>
          </Button>
        </div>
      </div>

      <ActivityCallsTable
        orgId={orgId}
        data={tableData}
        searchParams={searchParamsForTable}
        isLoading={isLoading}
        isRefetching={isRefetching}
      />
    </div>
  );
}
