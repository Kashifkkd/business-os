"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useMarketingTemplates } from "@/hooks/use-marketing";
import { useDebounce } from "@/hooks/use-debounce";
import { TemplatesTable } from "./templates-table";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const CHANNELS = [
  { value: "", label: "All" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "social", label: "Social" },
];

export default function MarketingTemplatesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const searchFromUrl = searchParams.get("search") ?? "";
  const channelFromUrl = searchParams.get("channel") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl]);

  const setParams = useCallback(
    (updates: { page?: number; search?: string; channel?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const ch = updates.channel ?? searchParams.get("channel") ?? "";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
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
  const channel = searchParams.get("channel") ?? "";

  const { data, isLoading, isRefetching } = useMarketingTemplates(
    orgId,
    { page, pageSize, search: search.trim() || undefined, channel: channel.trim() || undefined },
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
  if (channel) searchParamsForTable.channel = channel;

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Templates</h1>
          <p className="text-muted-foreground text-sm">
            Email, SMS, WhatsApp, and social templates for campaigns.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search templates..."
            className="w-56 sm:w-64"
          />
          <Button asChild>
            <Link href={`/${orgId}/marketing/templates/new`}>
              <Plus className="size-3.5" />
              New template
            </Link>
          </Button>
        </div>
      </div>

      <Tabs
        value={channel || "all"}
        onValueChange={(v) => setParams({ channel: v === "all" ? "" : v, page: 1 })}
        className="mb-4"
      >
        <TabsList>
          {CHANNELS.map((ch) => (
            <TabsTrigger key={ch.value || "all"} value={ch.value || "all"}>
              {ch.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <TemplatesTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
      />
    </div>
  );
}
