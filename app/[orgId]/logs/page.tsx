"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import { useLogsInfinite } from "@/hooks/use-logs";
import { useOrganization } from "@/hooks/use-organization";
import {
  DateRangeFilter,
  getDefaultDateRange,
  dateRangeToApiParams,
  DATE_PRESETS,
  type DateRangeValue,
  type DatePresetId,
} from "@/components/date-range-filter";
import { DateDisplay } from "@/components/date-display";
import { CreatedByDisplay } from "@/components/created-by-display";
import { EmptyState } from "@/components/empty-state";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";
import { format } from "date-fns";
import type { ActivityLogRow } from "@/app/api/orgs/[orgId]/logs/route";
import { ENTITY_TYPES, ACTIONS } from "@/lib/activity-log";
import { getPersonDisplayName } from "@/lib/display-name";

const ACTION_OPTIONS = [
  { value: "", label: "All actions" },
  { value: ACTIONS.CREATE, label: "Created" },
  { value: ACTIONS.UPDATE, label: "Updated" },
  { value: ACTIONS.DELETE, label: "Deleted" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: ENTITY_TYPES.LEAD, label: "Lead" },
  { value: ENTITY_TYPES.LEAD_SOURCE, label: "Lead source" },
  { value: ENTITY_TYPES.MENU_ITEM, label: "Menu item" },
  { value: ENTITY_TYPES.EMPLOYEE, label: "Employee" },
];

function getResourceLink(orgId: string, entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  switch (entityType) {
    case ENTITY_TYPES.LEAD:
      return `/${orgId}/leads/${entityId}`;
    case ENTITY_TYPES.MENU_ITEM:
      return `/${orgId}/menu/items/${entityId}`;
    case ENTITY_TYPES.EMPLOYEE:
      return `/${orgId}/staff/${entityId}`;
    default:
      return null;
  }
}

function groupByDate(items: ActivityLogRow[]): { dateLabel: string; dateKey: string; items: ActivityLogRow[] }[] {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(new Date(Date.now() - 864e5), "yyyy-MM-dd");
  const map = new Map<string, ActivityLogRow[]>();
  for (const item of items) {
    const d = item.created_at.slice(0, 10);
    const list = map.get(d) ?? [];
    list.push(item);
    map.set(d, list);
  }
  const sortedDates = [...map.keys()].sort((a, b) => b.localeCompare(a));
  return sortedDates.map((dateKey) => {
    let dateLabel: string;
    if (dateKey === today) dateLabel = "Today";
    else if (dateKey === yesterday) dateLabel = "Yesterday";
    else dateLabel = format(new Date(dateKey + "T12:00:00"), "MMMM d, yyyy");
    return { dateLabel, dateKey, items: map.get(dateKey)! };
  });
}

export default function LogsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const datePreset = (searchParams.get("datePreset") as DatePresetId) || "allTime";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const action = searchParams.get("action") ?? "";
  const entityType = searchParams.get("entity_type") ?? "";
  const userId = searchParams.get("user_id") ?? "";

  const apiDate = dateRangeToApiParams(datePreset, dateFrom, dateTo);
  const from = apiDate.dateFrom;
  const to = apiDate.dateTo;

  const setParams = useCallback(
    (updates: {
      datePreset?: DatePresetId;
      dateFrom?: string;
      dateTo?: string;
      action?: string;
      entity_type?: string;
      user_id?: string;
    }) => {
      const next = new URLSearchParams(searchParams.toString());
      const dp = updates.datePreset ?? datePreset;
      const df = updates.dateFrom ?? dateFrom;
      const dt = updates.dateTo ?? dateTo;
      const a = updates.action ?? action;
      const et = updates.entity_type ?? entityType;
      const uid = updates.user_id ?? userId;
      if (dp && dp !== "allTime") next.set("datePreset", dp);
      else next.delete("datePreset");
      if (dp === "custom" && df) next.set("dateFrom", df);
      else next.delete("dateFrom");
      if (dp === "custom" && dt) next.set("dateTo", dt);
      else next.delete("dateTo");
      if (a) next.set("action", a);
      else next.delete("action");
      if (et) next.set("entity_type", et);
      else next.delete("entity_type");
      if (uid) next.set("user_id", uid);
      else next.delete("user_id");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchParams, datePreset, dateFrom, dateTo, action, entityType, userId]
  );

  const dateRangeValue: DateRangeValue = useMemo(() => {
    const defaultRange = getDefaultDateRange();
    if (datePreset === "allTime") return defaultRange;
    if (datePreset === "custom") {
      const fromStr = dateFrom.slice(0, 10);
      const toStr = dateTo.slice(0, 10);
      if (!fromStr || !toStr) return defaultRange;
      const fromDate = new Date(fromStr + "T12:00:00");
      const toDate = new Date(toStr + "T12:00:00");
      return {
        presetId: "custom",
        from: fromStr,
        to: toStr,
        label: `${format(fromDate, "LLL dd, yy")} – ${format(toDate, "LLL dd, yy")}`,
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
      });
    },
    [setParams]
  );

  const { orgMembers } = useOrganization(orgId, { enabled: !!orgId });
  const members = orgMembers ?? [];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useLogsInfinite(
    orgId,
    {
      from,
      to,
      action: action || undefined,
      entity_type: entityType || undefined,
      user_id: userId || undefined,
      limit: 20,
    },
    { enabled: !!orgId }
  );

  const allItems = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.items),
    [data?.pages]
  );
  const grouped = useMemo(() => groupByDate(allItems), [allItems]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNextPage();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!orgId) return null;

  return (
    <div className="w-full min-w-0 p-4 pb-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Activity log</h1>
          <p className="text-muted-foreground text-sm">
            All create, update, and delete activity across your organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            placeholder="Date range"
          />
          <SearchCombobox
            options={ACTION_OPTIONS}
            value={action}
            onValueChange={(v) => setParams({ action: v })}
            placeholder="All actions"
            className="w-[140px]"
            showClear
          />
          <SearchCombobox
            options={ENTITY_TYPE_OPTIONS}
            value={entityType}
            onValueChange={(v) => setParams({ entity_type: v })}
            placeholder="All types"
            className="w-[150px]"
            showClear
          />
          <SearchCombobox
            options={[
              { value: "", label: "All users" },
              ...members.map((m) => ({
                value: m.user_id,
                label: getPersonDisplayName(m) ?? m.user_id,
              })),
            ]}
            value={userId}
            onValueChange={(v) => setParams({ user_id: v })}
            placeholder="All users"
            className="w-[180px]"
            showClear
          />
        </div>
      </div>

      <div className="w-full min-w-0 space-y-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-1">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <EmptyState
            title="No activity"
            description="Activity for the selected filters will appear here."
            icon={ScrollText}
          />
        ) : (
          grouped.map(({ dateLabel, items }) => (
            <section key={dateLabel} className="w-full min-w-0 space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {dateLabel}
              </h2>
              <ul className="w-full min-w-0 space-y-1 rounded-md border border-border bg-card">
                {items.map((row) => {
                  const link = getResourceLink(orgId, row.entity_type, row.entity_id);
                  const content = (
                    <>
                      <div className="flex shrink-0 pt-1">
                        <CreatedByDisplay
                          creator={row.creator ?? null}
                          variant="compact"
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{row.description}</p>
                        <p className="text-muted-foreground text-xs">
                          <DateDisplay value={row.created_at} variant="timeAgo" />
                        </p>
                      </div>
                    </>
                  );
                  return (
                    <li key={row.id} className="flex w-full min-w-0 gap-3 px-3 py-2 hover:bg-muted/50">
                      {link ? (
                        <Link href={link} className="flex min-w-0 flex-1 gap-3 w-full">
                          {content}
                        </Link>
                      ) : (
                        <div className="flex min-w-0 flex-1 gap-3 w-full">{content}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}

        <div ref={sentinelRef} className="h-4" aria-hidden />
        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Skeleton className="h-8 w-32" />
          </div>
        )}
      </div>
    </div>
  );
}
