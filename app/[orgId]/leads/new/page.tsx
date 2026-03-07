"use client";

import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateLead, useLeadSources, useLeadStages } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import type { LeadFormValues } from "../lead-form";
import { LeadForm, emptyLeadFormValues, leadFormValuesToPayload } from "../lead-form";
import { ArrowLeft } from "lucide-react";

export default function NewLeadPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const createLead = useCreateLead(orgId);
  const { data: sourcesData } = useLeadSources(orgId);
  const { data: stagesData } = useLeadStages(orgId);
  const sourceOptions = [
    { value: "", label: "Select source" },
    ...(sourcesData?.sources ?? []).map((s) => ({
      value: s.name,
      label: s.name.replace(/_/g, " "),
    })),
  ];
  const stageOptions = stagesData?.stages ?? [];
  const defaultStageId = useMemo(
    () => stageOptions.find((s) => s.is_default)?.id ?? stageOptions[0]?.id ?? "",
    [stageOptions]
  );
  const initialValues = useMemo<LeadFormValues>(
    () => ({ ...emptyLeadFormValues, stage_id: defaultStageId }),
    [defaultStageId]
  );

  const handleSubmit = (values: LeadFormValues) => {
    const payload = leadFormValuesToPayload(values);
    createLead.mutate(
      {
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        phone: payload.phone,
        company_id: payload.company_id,
        source: payload.source,
        stage_id: payload.stage_id,
        notes: payload.notes,
        metadata: payload.metadata,
        assignee_ids: payload.assignee_ids,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/leads/${data.id}`);
        },
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-6xl flex-1 space-y-4 px-2 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${orgId}/leads`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              New lead
            </h1>
          </div>
        </div>

        <LeadForm
          orgId={orgId}
          initialValues={initialValues}
          mode="create"
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${orgId}/leads`)}
          isPending={createLead.isPending}
          sourceOptions={sourceOptions}
          stageOptions={stageOptions}
        />
      </div>
    </div>
  );
}
