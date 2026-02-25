"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLeads, useUpdateLeadById, useLeadSources } from "@/hooks/use-leads";
import { sourceColorMap } from "@/lib/lead-sources";
import { SourceChip } from "@/components/source-chip";
import type { Lead, LeadStatus } from "@/lib/supabase/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { UserPlus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_STATUSES: { status: LeadStatus; label: string }[] = [
  { status: "new", label: "New" },
  { status: "contacted", label: "Contacted" },
  { status: "qualified", label: "Qualified" },
  { status: "proposal", label: "Proposal" },
  { status: "won", label: "Won" },
  { status: "lost", label: "Lost" },
];

export default function LeadsPipelinePage() {
  const params = useParams();
  const orgId = params?.orgId as string;

  const { data, isLoading } = useLeads(orgId, {
    page: 1,
    pageSize: 500,
  });
  const { data: sourcesData } = useLeadSources(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
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

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("leadId", lead.id);
    e.dataTransfer.setData("fromStatus", lead.status);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (!leadId || updateLead.isPending) return;
    updateLead.mutate({ leadId, data: { status: newStatus } });
  };

  if (!orgId) return null;

  if (isLoading) {
    return (
      <div className="container mx-auto w-full max-w-6xl p-4">
        <h1 className="text-lg font-semibold mb-4">Pipeline</h1>
        <div className="flex gap-4 overflow-auto pb-4">
          {PIPELINE_STATUSES.map(({ status, label }) => (
            <div
              key={status}
              className="h-64 w-64 shrink-0 rounded-md border border-dashed bg-muted/30 animate-pulse"
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
      <div className="container mx-auto w-full max-w-6xl p-4">
        <h1 className="text-lg font-semibold mb-2">Pipeline</h1>
        <p className="text-muted-foreground text-sm mb-4">
          View and move leads by stage.
        </p>
        <EmptyState
          title="No leads"
          description="Add leads to see them in the pipeline."
          icon={LayoutGrid}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto w-full max-w-6xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Pipeline</h1>
          <p className="text-muted-foreground text-sm">
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

      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STATUSES.map(({ status, label }) => (
          <div
            key={status}
            className={cn(
              "flex min-h-[320px] w-64 shrink-0 flex-col rounded-md border bg-muted/20",
              "transition-colors",
              "data-[drag-over]:bg-muted/50"
            )}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="border-b px-3 py-2">
              <h2 className="font-medium text-sm capitalize">{label}</h2>
              <p className="text-muted-foreground text-xs">{byStatus[status].length} leads</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {byStatus[status].map((lead) => (
                <Card
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                  className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors"
                >
                  <Link
                    href={`/${orgId}/leads/${lead.id}`}
                    className="block p-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CardHeader className="p-0">
                      <p className="font-medium text-sm truncate">{lead.name}</p>
                    </CardHeader>
                    <CardContent className="p-0 mt-0.5 space-y-0.5">
                      {lead.company && (
                        <p className="text-muted-foreground text-xs truncate">{lead.company}</p>
                      )}
                      {lead.source && (
                        <div className="mt-0.5">
                          <SourceChip
                            source={lead.source}
                            color={sourceColors[lead.source]}
                            className="text-[10px]"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
