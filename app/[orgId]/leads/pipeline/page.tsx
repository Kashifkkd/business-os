"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLeads,
  useUpdateLeadById,
  useLeadSources,
  useLeadStages,
  type GetLeadsResult,
} from "@/hooks/use-leads";
import { sourceColorMap } from "@/lib/lead-sources";
import { SourceChip } from "@/components/source-chip";
import { getStageBorderClasses } from "@/lib/lead-stage-colors";
import { formatTimeAgo } from "@/lib/format";
import type { Lead } from "@/lib/supabase/types";
import type { LeadStageItem } from "@/lib/lead-stages";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import {
  DateRangeFilter,
  getDefaultDateRange,
  type DateRangeValue,
} from "@/components/date-range-filter";
import { UserPlus, LayoutGrid, Mail, Phone, Building2, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const SLOT_PREFIX = "slot-";

function slotId(stageId: string, index: number): string {
  return `${SLOT_PREFIX}${stageId}-${index}`;
}

function parseSlotId(id: string): { stageId: string; index: number } | null {
  if (!id || typeof id !== "string" || !id.startsWith(SLOT_PREFIX)) return null;
  const rest = id.slice(SLOT_PREFIX.length);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash < 0) return null;
  const index = parseInt(rest.slice(lastDash + 1), 10);
  const stageId = rest.slice(0, lastDash);
  if (Number.isNaN(index) || index < 0 || !stageId) return null;
  return { stageId, index };
}

type LeadCardProps = {
  lead: Lead;
  orgId: string;
  sourceColors: Record<string, string>;
  stageColor?: string;
  isOverlay?: boolean;
};

function LeadCard({ lead, orgId, sourceColors, stageColor, isOverlay }: LeadCardProps) {
  const borderClasses = stageColor ? "border-l-4" : getStageBorderClasses((lead.stage_name?.toLowerCase() ?? "new") as "new" | "contacted" | "qualified" | "proposal" | "won" | "lost");

  return (
    <Card
      className={cn(
        "overflow-hidden bg-background transition-shadow py-0",
        borderClasses,
        !isOverlay && "hover:shadow-md"
      )}
      style={stageColor ? { borderLeftColor: stageColor } : undefined}
    >
      <Link
        href={`/${orgId}/leads/${lead.id}`}
        className="block w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="w-full px-2 py-2">
          <div className="flex w-full flex-col gap-1.5">
            <p className="w-full truncate font-medium text-sm">{[lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "—"}</p>
            <div className="flex w-full flex-col gap-1">
              {lead.company_name && (
                <div className="flex w-full min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Building2 className="size-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs">{lead.company_name}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex w-full min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Mail className="size-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex w-full min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Phone className="size-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs">{lead.phone}</span>
                </div>
              )}
              <div className="flex w-full min-w-0 items-center gap-1.5 text-muted-foreground">
                <Calendar className="size-3 shrink-0" />
                <span className="min-w-0 flex-1 text-xs">{formatTimeAgo(lead.created_at)}</span>
              </div>
              {lead.source && (
                <div className="w-full pt-0.5">
                  <SourceChip
                    source={lead.source}
                    color={sourceColors[lead.source]}
                    className="text-[10px]"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}

type DraggableLeadCardProps = LeadCardProps & {
  isDragging?: boolean;
};

function DraggableLeadCard({
  lead,
  orgId,
  sourceColors,
  stageColor,
  isDragging,
}: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, isDragging: dndDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const dragging = isDragging ?? dndDragging;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "touch-none",
        dragging && "opacity-50",
        !dragging && "cursor-grab active:cursor-grabbing"
      )}
    >
      <LeadCard lead={lead} orgId={orgId} sourceColors={sourceColors} stageColor={stageColor} />
    </div>
  );
}

function InsertionSlot({ id }: { id: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-2 shrink-0 rounded transition-colors",
        isOver && "min-h-8 bg-primary/20"
      )}
    />
  );
}

type PipelineColumnProps = {
  stage: LeadStageItem;
  leads: Lead[];
  orgId: string;
  sourceColors: Record<string, string>;
};

function PipelineColumn({ stage, leads, orgId, sourceColors }: PipelineColumnProps) {
  const borderColor = stage.color ?? "#64748b";

  return (
    <div
      className="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden rounded-lg border-2 border-border bg-background transition-colors"
      style={{ borderTopColor: borderColor, borderTopWidth: 2 }}
    >
      <div className="shrink-0 border-b border-border/50 bg-muted/50 px-3 py-2">
        <h2 className="font-semibold text-sm">{stage.name}</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{leads.length} leads</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-background px-2">
        <div className="space-y-1">
          {leads.flatMap((lead, i) => [
            <InsertionSlot key={`slot-${i}`} id={slotId(stage.id, i)} />,
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              orgId={orgId}
              sourceColors={sourceColors}
              stageColor={stage.color}
            />,
          ])}
          <InsertionSlot key={`slot-${leads.length}`} id={slotId(stage.id, leads.length)} />
        </div>
      </div>
    </div>
  );
}

function PipelineColumnSkeleton({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden rounded-lg border-2 border-border bg-background">
      <div className="shrink-0 border-b border-border/50 bg-muted/50 px-3 py-2">
        <h2 className="font-semibold text-sm">{label}</h2>
        <Skeleton className="mt-1 h-3 w-12" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-background px-2 py-2">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeadsPipelinePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;

  const createdAfter = searchParams.get("created_after") ?? "";
  const createdBefore = searchParams.get("created_before") ?? "";

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

  const setParams = useCallback(
    (updates: { created_after?: string; created_before?: string }) => {
      const next = new URLSearchParams(searchParams.toString());
      const ca = updates.created_after ?? searchParams.get("created_after") ?? "";
      const cb = updates.created_before ?? searchParams.get("created_before") ?? "";
      if (ca) next.set("created_after", ca);
      else next.delete("created_after");
      if (cb) next.set("created_before", cb);
      else next.delete("created_before");
      const q = next.toString();
      router.push(`${pathname}${q ? `?${q}` : ""}`);
    },
    [pathname, router, searchParams]
  );

  const handleDateRangeChange = useCallback(
    (value: DateRangeValue) => {
      setParams({ created_after: value.from, created_before: value.to });
    },
    [setParams]
  );

  const { data, isLoading, isRefetching, refetch } = useLeads(orgId, {
    page: 1,
    pageSize: 500,
    created_after: createdAfter || undefined,
    created_before: createdBefore || undefined,
  });
  const { data: sourcesData } = useLeadSources(orgId);
  const { data: stagesData } = useLeadStages(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
  const stages = useMemo(() => stagesData?.stages ?? [], [stagesData?.stages]);
  const queryClient = useQueryClient();
  const updateLead = useUpdateLeadById(orgId);

  const byStage = useMemo(() => {
    const items = data?.items ?? [];
    const map: Record<string, Lead[]> = {};
    for (const s of stages) {
      map[s.id] = [];
    }
    const defaultStageId = stages[0]?.id;
    for (const lead of items) {
      const sid = lead.stage_id && map[lead.stage_id] ? lead.stage_id : defaultStageId;
      if (sid) {
        if (!map[sid]) map[sid] = [];
        map[sid].push(lead);
      }
    }
    return map;
  }, [data?.items, stages]);

  const leadMap = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const lead of data?.items ?? []) {
      m.set(lead.id, lead);
    }
    return m;
  }, [data?.items]);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [optimisticByStage, setOptimisticByStage] = useState<Record<string, Lead[]> | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    if (!updateError) return;
    const t = setTimeout(() => setUpdateError(null), 5000);
    return () => clearTimeout(t);
  }, [updateError]);


  const displayByStage = optimisticByStage ?? byStage;

  const applyMove = useCallback(
    (
      prev: Record<string, Lead[]>,
      leadId: string,
      fromStageId: string,
      toStageId: string,
      insertIndex: number
    ): Record<string, Lead[]> => {
      const lead = leadMap.get(leadId);
      if (!lead) return prev;

      const next: Record<string, Lead[]> = {};
      for (const k of Object.keys(prev)) {
        next[k] = k === fromStageId ? prev[k].filter((l) => l.id !== leadId) : [...prev[k]];
      }
      const updatedLead = { ...lead, stage_id: toStageId, stage_name: stages.find((s) => s.id === toStageId)?.name };
      const target = [...(next[toStageId] ?? [])];
      target.splice(Math.min(insertIndex, target.length), 0, updatedLead);
      next[toStageId] = target;
      return next;
    },
    [leadMap, stages]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const lead = leadMap.get(String(event.active.id));
    if (lead) setActiveLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveLead(null);
    const leadId = String(event.active.id);
    const overId = event.over?.id;
    if (!overId || !leadId || updateLead.isPending) return;

    const lead = leadMap.get(leadId);
    if (!lead) return;

    const parsed = parseSlotId(String(overId));
    if (!parsed) return;

    const { stageId: toStageId, index: insertIndex } = parsed;
    if (!stages.some((s) => s.id === toStageId)) return;

    const fromStageId = lead.stage_id;
    setUpdateError(null);
    setOptimisticByStage(
      applyMove(displayByStage, leadId, fromStageId, toStageId, insertIndex)
    );

    if (fromStageId !== toStageId) {
      const stageName = stages.find((s) => s.id === toStageId)?.name;
      updateLead.mutate(
        { leadId, data: { stage_id: toStageId } },
        {
          onSuccess: () => {
            queryClient.setQueriesData<GetLeadsResult>(
              { queryKey: ["orgs", orgId, "leads"], exact: false },
              (old) => {
                if (!old?.items) return old;
                return {
                  ...old,
                  items: old.items.map((l) =>
                    l.id === leadId ? { ...l, stage_id: toStageId, stage_name: stageName ?? l.stage_name } : l
                  ),
                };
              }
            );
            setOptimisticByStage(null);
          },
          onError: (err) => {
            setOptimisticByStage(null);
            setUpdateError(err?.message ?? "Failed to update");
          },
        }
      );
    }
  };

  if (!orgId) return null;

  const totalLeads = data?.items?.length ?? 0;
  const showSkeleton = isLoading || isRefetching;
  const showEmpty = !showSkeleton && totalLeads === 0;

  const emptyAction = (
    <Button size="sm" asChild>
      <Link href={`/${orgId}/leads/new`}>
        <UserPlus className="size-3.5" />
        Add lead
      </Link>
    </Button>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 flex-col max-h-full min-h-full h-full px-4 py-2 overflow-auto">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Drag cards between columns to update stage.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangeFilter
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              placeholder="Date range"
              className="min-w-[140px]"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isRefetching}
              aria-label="Refresh"
            >
              <RefreshCw
                className={cn("size-3.5", (isRefreshing || isRefetching) && "animate-spin")}
              />
            </Button>
            <Button size="sm" asChild>
              <Link href={`/${orgId}/leads/new`}>
                <UserPlus className="size-3.5" />
                New lead
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex h-full flex-1 gap-4 overflow-auto pb-2">
          {showSkeleton ? (
            <>
              {stages.length > 0
                ? stages.map((s) => <PipelineColumnSkeleton key={s.id} label={s.name} />)
                : [1, 2, 3].map((i) => <PipelineColumnSkeleton key={i} label={`Stage ${i}`} />)}
            </>
          ) : showEmpty ? (
            <div className="flex w-full min-w-0 flex-1 items-center">
              <EmptyState
                title="No leads"
                description="Add leads to see them in the pipeline."
                icon={LayoutGrid}
                action={emptyAction}
                className="w-full"
              />
            </div>
          ) : (
            <>
              {stages.map((stage) => (
                <PipelineColumn
                  key={stage.id}
                  stage={stage}
                  leads={displayByStage[stage.id] ?? []}
                  orgId={orgId}
                  sourceColors={sourceColors}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {updateError && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          <span>Update failed. Reverted.</span>
        </div>
      )}

      <DragOverlay dropAnimation={null}>
        {activeLead ? (
          <div className="rotate-2 scale-105 opacity-95">
            <LeadCard
              lead={activeLead}
              orgId={orgId}
              sourceColors={sourceColors}
              stageColor={activeLead.stage_id ? stages.find((s) => s.id === activeLead.stage_id)?.color : undefined}
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
