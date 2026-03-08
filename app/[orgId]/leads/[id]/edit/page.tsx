"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLead, useUpdateLead, useLeadSources, useLeadStages } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import {
  LeadForm,
  leadToFormValues,
  leadFormValuesToPayload,
  type LeadFormValues,
} from "../../lead-form";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = params?.id as string;

  const { data: lead, isLoading } = useLead(orgId, leadId);
  const updateLead = useUpdateLead(orgId, leadId);
  const { data: sourcesData } = useLeadSources(orgId);
  const { data: stagesData } = useLeadStages(orgId);
  const sourceOptions = [
    { value: "", label: "Select source" },
    ...(sourcesData?.sources ?? [])
      .filter((s) => s.id)
      .map((s) => ({
        value: s.id!,
        label: (s.name ?? "").replace(/_/g, " "),
      })),
  ];
  const stageOptions = stagesData?.stages ?? [];

  const handleSubmit = (values: LeadFormValues) => {
    const payload = leadFormValuesToPayload(values);
    updateLead.mutate(
      {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        company_id: payload.company_id,
        source_id: payload.source_id,
        stage_id: payload.stage_id,
        job_title_id: payload.job_title_id,
        notes: payload.notes,
        metadata: payload.metadata,
        assignee_ids: payload.assignee_ids,
      },
      {
        onSuccess: () => {
          router.push(`/${orgId}/leads/${leadId}`);
        },
      }
    );
  };

  if (!orgId || !leadId) return null;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground text-sm">Lead not found.</p>
        <Button variant="link" className="mt-2 px-0" asChild>
          <Link href={`/${orgId}/leads`}>Back to leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4 md:p-6">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/leads/${leadId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Edit lead</h1>
          <p className="text-muted-foreground text-xs">
            Update contact details, qualification, and notes.
          </p>
        </div>
      </div>

      <LeadForm
        orgId={orgId}
        initialValues={leadToFormValues(lead)}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/leads/${leadId}`)}
        isPending={updateLead.isPending}
        sourceOptions={sourceOptions}
        stageOptions={stageOptions}
      />
    </div>
  );
}
