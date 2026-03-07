"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useLead,
  useDeleteLead,
  useUpdateLead,
  useLeadActivities,
  useLeadSources,
  useLeadStages,
} from "@/hooks/use-leads";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/use-api";
import { sourceColorMap } from "@/lib/lead-sources";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeadDetailHeader } from "./_components/lead-detail-header";
import { LeadDetailSidebar } from "./_components/lead-detail-sidebar";
import { LeadDetailTabs } from "./_components/lead-detail-tabs";
import { LeadDeleteDialog } from "./_components/lead-delete-dialog";
import { LeadDetailLoading } from "./_components/lead-detail-loading";
import { LeadDetailNotFound } from "./_components/lead-detail-not-found";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = params?.id as string;

  const queryClient = useQueryClient();
  const { data: lead, isLoading } = useLead(orgId, leadId);
  const { data: sourcesData } = useLeadSources(orgId);
  const { data: stagesData } = useLeadStages(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
  const stageOptions = useMemo(
    () => (stagesData?.stages ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color })),
    [stagesData?.stages]
  );
  const deleteLead = useDeleteLead(orgId);
  const updateLead = useUpdateLead(orgId, leadId);
  const { data: activities = [], isLoading: activitiesLoading } = useLeadActivities(orgId, leadId);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    if (!lead || stageOptions.length === 0) return;
    const idx = stageOptions.findIndex((s) => s.id === lead.stage_id);
    if (idx >= 0 && idx < stageOptions.length - 1) {
      updateLead.mutate({ stage_id: stageOptions[idx + 1].id });
    }
  };

  const handleMarkLost = () => {
    if (!lead || stageOptions.length === 0) return;
    const lostStage = stageOptions.find((s) => s.name.toLowerCase() === "lost");
    if (lostStage) updateLead.mutate({ stage_id: lostStage.id });
  };

  const copyEmail = () => {
    if (lead?.email) navigator.clipboard.writeText(lead.email);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      queryClient.refetchQueries({ queryKey: queryKeys.lead(orgId, leadId) }),
      queryClient.refetchQueries({ queryKey: queryKeys.leadActivities(orgId, leadId) }),
    ]);
    setIsRefreshing(false);
  };

  if (!orgId || !leadId) return null;

  if (isLoading) {
    return <LeadDetailLoading />;
  }

  if (!lead) {
    return <LeadDetailNotFound orgId={orgId} />;
  }

  if (isRefreshing) {
    return <LeadDetailLoading />;
  }

  return (
    <TooltipProvider>
      <div className="flex h-full w-full overflow-auto flex-col">
        <LeadDetailHeader
          lead={lead}
          orgId={orgId}
          stages={stageOptions}
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
          leadName={[lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Lead"}
          onConfirm={handleDeleteConfirm}
        />
      </div>
    </TooltipProvider>
  );
}
