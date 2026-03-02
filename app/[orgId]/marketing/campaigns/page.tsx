"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useMarketingCampaigns } from "@/hooks/use-marketing";
import { useDebounce } from "@/hooks/use-debounce";
import { CampaignsTable } from "./campaigns-table";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "running", label: "Running" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "All channels" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "social", label: "Social" },
];

export default function MarketingCampaignsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl]);

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
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE));
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
    { enabled: !!orgId && mounted }
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
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search campaigns..."
            className="w-56 sm:w-64"
          />
          <Select
            value={status || "all"}
            onValueChange={(v) => setParams({ status: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={channel || "all"}
            onValueChange={(v) => setParams({ channel: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href={`/${orgId}/marketing/campaigns/new`}>
              <Plus className="size-3.5" />
              New campaign
            </Link>
          </Button>
        </div>
      </div>

      <CampaignsTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
      />
    </div>
  );
}
