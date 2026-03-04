"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useMarketingCampaigns } from "@/hooks/use-marketing";
import { useDebounce } from "@/hooks/use-debounce";
import { CampaignsTable } from "@/app/[orgId]/marketing/campaigns/campaigns-table";
import { Button } from "@/components/ui/button";
import {
  DateRangeFilter,
  getDefaultDateRange,
  type DateRangeValue,
} from "@/components/date-range-filter";
import { Upload } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export default function MarketingCampaignsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [dateRange, setDateRange] = useState<DateRangeValue>(getDefaultDateRange());

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const setParams = useCallback(
    (updates: { page?: number; search?: string; status?: string; channel?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const st = updates.status ?? searchParams.get("status") ?? "";
      const ch = updates.channel ?? searchParams.get("channel") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (st) next.set("status", st);
      else next.delete("status");
      if (ch) next.set("channel", ch);
      else next.delete("channel");
      router.push(`${pathname}${next.toString() ? `?${next}` : ""}`);
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
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  );
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const channel = searchParams.get("channel") ?? "";

  const { data, isLoading, isRefetching } = useMarketingCampaigns(
    orgId,
    {
      page,
      pageSize,
      search: search.trim() || undefined,
      status: status.trim() || undefined,
      channel: channel.trim() || undefined,
    },
    { enabled: !!orgId  }
  );

  const tableData = data ?? {
    items: [],
    total: 0,
    page: DEFAULT_PAGE,
    pageSize: DEFAULT_PAGE_SIZE,
  };

  const searchParamsForTable: Record<string, string> = {
    page: String(tableData.page),
    pageSize: String(tableData.pageSize),
  };
  if (search) searchParamsForTable.search = search;
  if (status) searchParamsForTable.status = status;
  if (channel) searchParamsForTable.channel = channel;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Campaigns</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage marketing campaigns across channels.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            value={dateRange}
            onChange={setDateRange}
            placeholder="Date range"
          />
          <Button variant="outline" size="sm">
            <Upload className="size-3.5" />
            Import
          </Button>
        </div>
      </div>

      <CampaignsTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        status={status}
        channel={channel}
        onStatusChange={(value: string) => setParams({ status: value, page: 1 })}
        onChannelChange={(value: string) => setParams({ channel: value, page: 1 })}
      />
    </div>
  );
}

