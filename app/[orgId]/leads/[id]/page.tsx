"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useLead,
  useDeleteLead,
  useUpdateLead,
  useLeadActivities,
  useLeadSources,
} from "@/hooks/use-leads";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-api";
import { sourceColorMap } from "@/lib/lead-sources";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { LeadStatus } from "@/lib/supabase/types";
import { LeadDetailHeader } from "./_components/lead-detail-header";
import { LeadDetailSidebar } from "./_components/lead-detail-sidebar";
import { LeadDetailTabs } from "./_components/lead-detail-tabs";
import { LeadDeleteDialog } from "./_components/lead-delete-dialog";
import { LeadDetailLoading } from "./_components/lead-detail-loading";
import { LeadDetailNotFound } from "./_components/lead-detail-not-found";

const PIPELINE_ORDER: LeadStatus[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = params?.id as string;

  const queryClient = useQueryClient();
  const { data: lead, isLoading } = useLead(orgId, leadId);
  const { data: sourcesData } = useLeadSources(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
  const deleteLead = useDeleteLead(orgId);
  const updateLead = useUpdateLead(orgId, leadId);
  const { data: activities = [], isLoading: activitiesLoading } = useLeadActivities(orgId, leadId);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleDeleteConfirm = () => {
    if (!lead) return;
    deleteLead.mutate(lead.id, {
      onSuccess: () => router.push(`/${orgId}/leads`),
      onSettled: () => setDeleteDialogOpen(false),
    });
  };

  const handleAdvanceStatus = () => {
    if (!lead) return;
    const idx = PIPELINE_ORDER.indexOf(lead.status);
    if (idx >= 0 && idx < PIPELINE_ORDER.length - 1) {
      updateLead.mutate({ status: PIPELINE_ORDER[idx + 1] });
    }
  };

  const handleMarkLost = () => {
    if (!lead) return;
    updateLead.mutate({ status: "lost" });
  };

  const copyEmail = () => {
    if (lead?.email) navigator.clipboard.writeText(lead.email);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.lead(orgId, leadId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.leadActivities(orgId, leadId) });
  };

  if (!orgId || !leadId) return null;

  if (isLoading) {
    return <LeadDetailLoading />;
  }

  if (!lead) {
    return <LeadDetailNotFound orgId={orgId} />;
  }

  return (
    <TooltipProvider>
      <div className="flex h-full w-full overflow-auto flex-col">
        <LeadDetailHeader
          lead={lead}
          orgId={orgId}
          onAdvanceStatus={handleAdvanceStatus}
          onMarkLost={handleMarkLost}
          onDeleteClick={handleDeleteClick}
          onRefresh={handleRefresh}
          deleteError={deleteLead.isError ? deleteLead.error?.message ?? null : null}
          isDeleting={deleteLead.isPending}
        />

        <div className="grid h-full flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-12">
          <aside className="flex flex-col lg:col-span-4">
            <LeadDetailSidebar
              lead={lead}
              sourceColors={sourceColors}
              onCopyEmail={copyEmail}
            />
          </aside>

          <main className="min-h-0 flex-1 lg:col-span-8">
            <LeadDetailTabs
              orgId={orgId}
              leadId={leadId}
              activities={activities}
              activitiesLoading={activitiesLoading}
            />
          </main>
        </div>

        <LeadDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          leadName={lead.name}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </TooltipProvider>
  );
}
