"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";
import { useCreateDeal, usePipelineStages } from "@/hooks/use-sales";
import { useLeads, useLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import {
  DealForm,
  emptyDealFormValues,
  dealFormValuesToPayload,
  type DealFormValues,
} from "../../deal-form";
import { ArrowLeft } from "lucide-react";

export default function NewDealPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params?.orgId as string;
  const leadIdFromUrl = searchParams.get("lead_id") ?? "";

  const createDeal = useCreateDeal(orgId);
  const { data: stages = [] } = usePipelineStages(orgId);
  const { data: lead } = useLead(orgId, leadIdFromUrl || undefined);
  const { data: leadsData } = useLeads(orgId, { page: 1, pageSize: 200 });
  const leadOptions = (leadsData?.items ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company ?? null,
  }));

  const defaultStageId = useMemo(() => stages[0]?.id ?? "", [stages]);
  const initialValues = useMemo((): DealFormValues => {
    if (leadIdFromUrl && lead) {
      return {
        ...emptyDealFormValues,
        name: lead.company ? `${lead.name} - ${lead.company}` : lead.name,
        lead_id: lead.id,
        stage_id: defaultStageId,
      };
    }
    return { ...emptyDealFormValues, stage_id: defaultStageId };
  }, [lead, leadIdFromUrl, defaultStageId]);

  const handleSubmit = (values: DealFormValues) => {
    const payload = dealFormValuesToPayload(values);
    createDeal.mutate(
      {
        name: payload.name,
        stage_id: payload.stage_id,
        lead_id: payload.lead_id,
        value: payload.value,
        probability: payload.probability,
        expected_close_date: payload.expected_close_date,
        notes: payload.notes,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/sales/deals/${data.id}`);
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
              <Link href={`/${orgId}/sales/deals`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              New deal
            </h1>
          </div>
        </div>

        <DealForm
        initialValues={initialValues}
        mode="create"
        stages={stages}
        leadOptions={leadOptions}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/sales/deals`)}
        isPending={createDeal.isPending}
      />
      </div>
    </div>
  );
}
