"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useLeads, useDeleteLead } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { LeadsTable } from "./leads-table";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lead } from "@/lib/supabase/types";
import { UserPlus } from "lucide-react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

const LEAD_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

export default function LeadsPage() {
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
  const statusFromUrl = searchParams.get("status") ?? "";
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: { page?: number; search?: string; status?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchFromUrl;
      const st = updates.status ?? statusFromUrl;
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (st) next.set("status", st);
      else next.delete("status");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchFromUrl, statusFromUrl, searchParams]
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

  const { data, isLoading, isRefetching } = useLeads(
    orgId,
    { page, pageSize, search: search.trim() || undefined, status: status.trim() || undefined },
    { enabled: !!orgId && mounted }
  );

  const deleteLead = useDeleteLead(orgId);

  const handleDelete = useCallback(
    (lead: Lead) => {
      if (!confirm(`Delete lead "${lead.name}"? This cannot be undone.`)) return;
      deleteLead.mutate(lead.id);
    },
    [deleteLead]
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
    ...(status && { status }),
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-5xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Leads</h1>
          <p className="text-muted-foreground text-sm">
            Manage leads and inquiries across all sources.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search name, email, company..."
            className="w-56 sm:w-64"
          />
          <Select
            value={status || "all"}
            onValueChange={(v) => setParams({ status: v === "all" ? "" : v, page: 1 })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href={`/${orgId}/leads/new`}>
              <UserPlus className="size-4" />
              New lead
            </Link>
          </Button>
        </div>
      </div>

      <LeadsTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
        onDelete={handleDelete}
      />
    </div>
  );
}
