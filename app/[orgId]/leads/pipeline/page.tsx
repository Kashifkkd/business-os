"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
  type GetLeadsResult,
} from "@/hooks/use-leads";
import { sourceColorMap } from "@/lib/lead-sources";
import { SourceChip } from "@/components/source-chip";
import { getStageColors, getStageBorderClasses } from "@/lib/lead-stage-colors";
import { formatTimeAgo } from "@/lib/format";
import type { Lead, LeadStatus } from "@/lib/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { UserPlus, LayoutGrid, Mail, Phone, Building2, Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SLOT_PREFIX = "slot-";

function parseSlotId(id: string): { status: LeadStatus; index: number } | null {
  if (!id || typeof id !== "string" || !id.startsWith(SLOT_PREFIX)) return null;
  const parts = id.slice(SLOT_PREFIX.length).split("-");
  if (parts.length < 2) return null;
  const index = parseInt(parts[parts.length - 1], 10);
  const status = parts.slice(0, -1).join("-") as LeadStatus;
  if (Number.isNaN(index) || index < 0) return null;
  const valid: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  if (!valid.includes(status)) return null;
  return { status, index };
}

const PIPELINE_STATUSES: { status: LeadStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "contacted", label: "Contacted" },
  { status: "qualified", label: "Qualified" },
  { status: "proposal", label: "Proposal" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
];

type LeadCardProps = {
  lead: Lead;
  orgId: string;
  sourceColors: Record<string, string>;
  isOverlay?: boolean;
};

function LeadCard({ lead, orgId, sourceColors, isOverlay }: LeadCardProps) {
  const borderClasses = getStageBorderClasses(lead.status as LeadStatus);

  return (
    <Card
      className={cn(
        "overflow-hidden bg-background transition-shadow py-0",
        borderClasses,
        !isOverlay && "hover:shadow-md"
      )}
    >
      <Link
        href={`/${orgId}/leads/${lead.id}`}
        className="block w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <CardContent className="w-full px-2 py-2">
          <div className="flex w-full flex-col gap-1.5">
            <p className="w-full truncate font-medium text-sm">{lead.name}</p>
            <div className="flex w-full flex-col gap-1">
              {lead.company && (
                <div className="flex w-full min-w-0 items-center gap-1.5 text-muted-foreground">
                  <Building2 className="size-3 shrink-0" />
                  <span className="min-w-0 flex-1 truncate text-xs">{lead.company}</span>
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
      <LeadCard lead={lead} orgId={orgId} sourceColors={sourceColors} />
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
  status: LeadStatus;
  label: string;
  leads: Lead[];
  orgId: string;
  sourceColors: Record<string, string>;
};

function PipelineColumn({ status, label, leads, orgId, sourceColors }: PipelineColumnProps) {
  const colors = getStageColors(status);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-72 shrink-0 flex-col overflow-hidden rounded-lg border-2 bg-background transition-colors",
        colors.border
      )}
    >
      <div className={cn("shrink-0 border-b border-border/50 px-3 py-2", colors.bgMuted)}>
        <h2 className={cn("font-semibold text-sm capitalize", colors.text)}>{label}</h2>
        <p className="text-muted-foreground text-xs mt-0.5">{leads.length} leads</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto bg-background px-2">
        <div className="space-y-1">
          {leads.flatMap((lead, i) => [
            <InsertionSlot key={`slot-${i}`} id={`${SLOT_PREFIX}${status}-${i}`} />,
            <DraggableLeadCard
              key={lead.id}
              lead={lead}
              orgId={orgId}
              sourceColors={sourceColors}
            />,
          ])}
          <InsertionSlot
            key={`slot-${leads.length}`}
            id={`${SLOT_PREFIX}${status}-${leads.length}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function LeadsPipelinePage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  const { data, isLoading } = useLeads(orgId, {
    page: 1,
    pageSize: 500,
  });
  const { data: sourcesData } = useLeadSources(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
  const queryClient = useQueryClient();
  const updateLead = useUpdateLeadById(orgId);

  const byStatus = useMemo(() => {
    const items = data?.items ?? [];
    const map: Record<LeadStatus, Lead[]> = {
      new: [],
      contacted: [],
      qualified: [],
      proposal: [],
      won: [],
      lost: [],
    };
    const statuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
    for (const lead of items) {
      const s = statuses.includes(lead.status as LeadStatus) ? (lead.status as LeadStatus) : "new";
      map[s].push(lead);
    }
    return map;
  }, [data?.items]);

  const leadMap = useMemo(() => {
    const m = new Map<string, Lead>();
    for (const lead of data?.items ?? []) {
      m.set(lead.id, lead);
    }
    return m;
  }, [data?.items]);

  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [optimisticByStatus, setOptimisticByStatus] = useState<Record<LeadStatus, Lead[]> | null>(
    null
  );
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!updateError) return;
    const t = setTimeout(() => setUpdateError(null), 5000);
    return () => clearTimeout(t);
  }, [updateError]);


  const displayByStatus = optimisticByStatus ?? byStatus;

  const applyMove = useCallback(
    (
      prev: Record<LeadStatus, Lead[]>,
      leadId: string,
      fromStatus: LeadStatus,
      toStatus: LeadStatus,
      insertIndex: number
    ): Record<LeadStatus, Lead[]> => {
      const lead = leadMap.get(leadId);
      if (!lead) return prev;

      const next = { ...prev };
      next[fromStatus] = next[fromStatus].filter((l) => l.id !== leadId);
      const updatedLead = { ...lead, status: toStatus };
      const target = [...next[toStatus]];
      target.splice(Math.min(insertIndex, target.length), 0, updatedLead);
      next[toStatus] = target;
      return next;
    },
    [leadMap]
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

    const { status: newStatus, index: insertIndex } = parsed;
    const validStatuses: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];
    if (!validStatuses.includes(newStatus)) return;

    const fromStatus = lead.status as LeadStatus;
    setUpdateError(null);
    setOptimisticByStatus(
      applyMove(displayByStatus, leadId, fromStatus, newStatus, insertIndex)
    );

    if (fromStatus !== newStatus) {
      updateLead.mutate(
        { leadId, data: { status: newStatus } },
        {
          onSuccess: () => {
            queryClient.setQueriesData<GetLeadsResult>(
              { queryKey: ["orgs", orgId, "leads"], exact: false },
              (old) => {
                if (!old?.items) return old;
                return {
                  ...old,
                  items: old.items.map((l) =>
                    l.id === leadId ? { ...l, status: newStatus } : l
                  ),
                };
              }
            );
            setOptimisticByStatus(null);
          },
          onError: (err) => {
            setOptimisticByStatus(null);
            setUpdateError(err?.message ?? "Failed to update");
          },
        }
      );
    }
  };

  if (!orgId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <h1 className="mb-4 shrink-0 text-lg font-semibold">Pipeline</h1>
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto pb-4">
          {PIPELINE_STATUSES.map(({ status }) => (
            <div
              key={status}
              className="h-full w-72 shrink-0 rounded-lg border-2 border-dashed bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const totalLeads = data?.items?.length ?? 0;
  if (totalLeads === 0) {
    const emptyAction = (
      <Button size="sm" asChild>
        <Link href={`/${orgId}/leads/new`}>
          <UserPlus className="size-3.5" />
          Add lead
        </Link>
      </Button>
    );
    return (
      <div className="flex h-full min-h-0 flex-col p-4">
        <h1 className="mb-2 shrink-0 text-lg font-semibold">Pipeline</h1>
        <p className="mb-4 shrink-0 text-sm text-muted-foreground">
          View and move leads by stage.
        </p>
        <div className="flex min-h-0 flex-1 items-center">
          <EmptyState
            title="No leads"
            description="Add leads to see them in the pipeline."
            icon={LayoutGrid}
            action={emptyAction}
          />
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-1 flex-col max-h-full min-h-full h-full px-4 py-2 overflow-auto">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Drag cards between columns to update status.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href={`/${orgId}/leads/new`}>
              <UserPlus className="size-3.5" />
              New lead
            </Link>
          </Button>
        </div>

        <div className="flex h-full flex-1 gap-4 overflow-auto pb-2">
          {PIPELINE_STATUSES.map(({ status, label }) => (
            <PipelineColumn
              key={status}
              status={status}
              label={label}
              leads={displayByStatus[status]}
              orgId={orgId}
              sourceColors={sourceColors}
            />
          ))}
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
              isOverlay
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
