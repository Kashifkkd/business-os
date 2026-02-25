"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLeads, useDeleteLead, useBulkUpdateLeadsStatus, useBulkDeleteLeads, useLeadSources } from "@/hooks/use-leads";
import { sourceColorMap } from "@/lib/lead-sources";
import type { GetLeadsResult } from "@/hooks/use-leads";
import { useDebounce } from "@/hooks/use-debounce";
import { LeadsTable } from "./leads-table";
import { DateRangeFilter, getDefaultDateRange, type DateRangeValue } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Lead } from "@/lib/supabase/types";
import { Download } from "lucide-react";
import { format } from "date-fns";

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

const FALLBACK_SOURCE_OPTIONS = [
  { value: "", label: "All sources" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "cold_outbound", label: "Cold outbound" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "created_at_asc", label: "Oldest first" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "company_asc", label: "Company A–Z" },
  { value: "company_desc", label: "Company Z–A" },
  { value: "status_asc", label: "Status A–Z" },
  { value: "status_desc", label: "Status Z–A" },
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
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: {
      page?: number;
      search?: string;
      status?: string;
      source?: string;
      created_after?: string;
      created_before?: string;
      sortBy?: string;
      order?: string;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      const p = updates.page ?? Math.max(1, Number(searchParams.get("page")) || 1);
      const s = updates.search ?? searchParams.get("search") ?? "";
      const st = updates.status ?? searchParams.get("status") ?? "";
      const src = updates.source ?? searchParams.get("source") ?? "";
      const ca = updates.created_after ?? searchParams.get("created_after") ?? "";
      const cb = updates.created_before ?? searchParams.get("created_before") ?? "";
      const sortBy = updates.sortBy ?? searchParams.get("sortBy") ?? "created_at";
      const order = updates.order ?? searchParams.get("order") ?? "desc";
      if (p > 1) next.set("page", String(p));
      else next.delete("page");
      if (s) next.set("search", s);
      else next.delete("search");
      if (st) next.set("status", st);
      else next.delete("status");
      if (src) next.set("source", src);
      else next.delete("source");
      if (ca) next.set("created_after", ca);
      else next.delete("created_after");
      if (cb) next.set("created_before", cb);
      else next.delete("created_before");
      if (sortBy && sortBy !== "created_at") next.set("sortBy", sortBy);
      else next.delete("sortBy");
      if (order && order !== "desc") next.set("order", order);
      else next.delete("order");
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
  const status = searchParams.get("status") ?? "";
  const source = searchParams.get("source") ?? "";
  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";
  const sortBy = searchParams.get("sortBy") ?? "created_at";
  const order = (searchParams.get("order") ?? "desc") as "asc" | "desc";

  const dateRangeValue: DateRangeValue = useMemo(() => {
    const defaultRange = getDefaultDateRange();
    if (!createdAfter?.trim() || !createdBefore?.trim()) {
      return defaultRange;
    }
    const fromStr = createdAfter.slice(0, 10);
    const toStr = createdBefore.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    const isAllTime = fromStr === "2000-01-01" && (toStr <= today || toStr >= "2000-01-01");
    if (isAllTime) {
      return { from: fromStr, to: toStr, label: "All time" };
    }
    const from = new Date(createdAfter);
    const to = new Date(createdBefore);
    return {
      from: createdAfter,
      to: createdBefore,
      label: `${format(from, "LLL dd, yy")} – ${format(to, "LLL dd, yy")}`,
    };
  }, [createdAfter, createdBefore]);

  const handleDateRangeChange = useCallback(
    (value: DateRangeValue) => {
      setParams({
        created_after: value.from,
        created_before: value.to,
        page: 1,
      });
    },
    [setParams]
  );

  const { data: sourcesData } = useLeadSources(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);

  const { data, isLoading, isRefetching } = useLeads(
    orgId,
    {
      page,
      pageSize,
      search: search.trim() || undefined,
      status: status.trim() || undefined,
      source: source.trim() || undefined,
      created_after: createdAfter.trim() || undefined,
      created_before: createdBefore.trim() || undefined,
      sortBy,
      order,
    },
    { enabled: !!orgId && mounted }
  );

  const deleteLead = useDeleteLead(orgId);
  const bulkUpdateStatus = useBulkUpdateLeadsStatus(orgId);
  const bulkDelete = useBulkDeleteLeads(orgId);

  const handleDeleteRequest = useCallback((lead: Lead) => {
    setLeadToDelete(lead);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!leadToDelete) return;
    deleteLead.mutate(leadToDelete.id, {
      onSuccess: () => setLeadToDelete(null),
    });
  }, [leadToDelete, deleteLead]);

  const handleBulkDeleteConfirm = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    bulkDelete.mutate(ids, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  }, [selectedIds, bulkDelete]);

  const handleBulkStatusChange = useCallback(
    (newStatus: string) => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0 || !newStatus) return;
      bulkUpdateStatus.mutate(
        { ids, status: newStatus },
        { onSuccess: () => setSelectedIds(new Set()) }
      );
    },
    [selectedIds, bulkUpdateStatus]
  );

  const handleExport = useCallback(async () => {
    if (!orgId) return;
    const sp = new URLSearchParams();
    sp.set("page", "1");
    sp.set("pageSize", "500");
    if (search.trim()) sp.set("search", search);
    if (status.trim()) sp.set("status", status);
    if (source.trim()) sp.set("source", source);
    if (createdAfter.trim()) sp.set("created_after", createdAfter);
    if (createdBefore.trim()) sp.set("created_before", createdBefore);
    sp.set("sortBy", sortBy);
    sp.set("order", order);
    const res = await fetch(`/api/orgs/${orgId}/leads?${sp.toString()}`);
    const json = await res.json();
    const payload = json?.data as GetLeadsResult | undefined;
    const items = payload?.items ?? [];
    const headers = ["Name", "Email", "Phone", "Company", "Source", "Status", "Created"];
    const escape = (v: string) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = items.map((l) =>
      [
        l.name,
        l.email ?? "",
        l.phone ?? "",
        l.company ?? "",
        l.source ?? "",
        l.status,
        l.created_at ? new Date(l.created_at).toISOString() : "",
      ].map(escape).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [orgId, search, status, source, createdAfter, createdBefore, sortBy, order]);

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
    ...(source && { source }),
    ...(createdAfter && { created_after: createdAfter }),
    ...(createdBefore && { created_before: createdBefore }),
    sortBy,
    order,
  };

  if (!orgId) return null;

  const isBulkSelected = selectedIds.size > 0

  return (
    <div className="container mx-auto p-4">
      {/* Row 1: Title + subtitle (left) | Date range filter + Export (right) */}
      {!isBulkSelected && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Leads</h1>
            <p className="text-muted-foreground text-sm">
              Manage leads and inquiries across all sources.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              placeholder="Date range"
            />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      )}

      <LeadsTable
        orgId={orgId}
        data={tableData}
        params={searchParamsForTable}
        isLoading={isLoading || isRefetching}
        onDelete={handleDeleteRequest}
        sortBy={sortBy}
        order={order}
        onSortChange={(sb, ord) => setParams({ sortBy: sb, order: ord, page: 1 })}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        bulkStatusOptions={LEAD_STATUS_OPTIONS.filter((o) => o.value !== "")}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDeleteClick={() => setBulkDeleteOpen(true)}
        bulkUpdatePending={bulkUpdateStatus.isPending}
        bulkDeletePending={bulkDelete.isPending}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onFilterClick={() => setFilterDialogOpen(true)}
        sourceColors={sourceColors}
      />

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected leads</AlertDialogTitle>
            <AlertDialogDescription>
              Delete {selectedIds.size} lead{selectedIds.size !== 1 ? "s" : ""}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <FilterDialogContent
            key={filterDialogOpen ? `open-${status}-${source}-${sortBy}-${order}` : "closed"}
            status={status}
            source={source}
            sortBy={sortBy}
            order={order}
            sourceOptions={
              sourcesData?.sources?.length
                ? [{ value: "", label: "All sources" }, ...sourcesData.sources.map((s) => ({ value: s.name, label: s.name.replace(/_/g, " ") }))]
                : FALLBACK_SOURCE_OPTIONS
            }
            onApply={(st, src, sb, ord) => {
              setParams({ status: st, source: src, sortBy: sb, order: ord, page: 1 });
              setFilterDialogOpen(false);
            }}
            onClear={() => {
              setParams({
                status: "",
                source: "",
                sortBy: "created_at",
                order: "desc",
                page: 1,
              });
              setFilterDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!leadToDelete} onOpenChange={(open) => !open && setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead</AlertDialogTitle>
            <AlertDialogDescription>
              Delete lead &quot;{leadToDelete?.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterDialogContent({
  status,
  source,
  sortBy,
  order,
  sourceOptions,
  onApply,
  onClear,
}: {
  status: string;
  source: string;
  sortBy: string;
  order: string;
  sourceOptions: { value: string; label: string }[];
  onApply: (status: string, source: string, sortBy: string, order: "asc" | "desc") => void;
  onClear: () => void;
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [localSource, setLocalSource] = useState(source);
  const [localSort, setLocalSort] = useState(`${sortBy}_${order}`);

  const handleApply = () => {
    const [sb, ord] = localSort.split("_") as [string, "asc" | "desc"];
    onApply(localStatus, localSource, sb, ord);
  };

  return (
    <>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">Status</label>
          <Select value={localStatus || "all"} onValueChange={(v) => setLocalStatus(v === "all" ? "" : v)}>
            <SelectTrigger>
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
        </div>
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">Source</label>
          <Select value={localSource || "all"} onValueChange={(v) => setLocalSource(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((opt) => (
                <SelectItem key={opt.value || "all"} value={opt.value || "all"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-muted-foreground text-sm font-medium">Sort</label>
          <Select value={localSort} onValueChange={setLocalSort}>
            <SelectTrigger>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="flex gap-2 sm:gap-0">
        <Button variant="outline" onClick={onClear}>
          Clear
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </DialogFooter>
    </>
  );
}
