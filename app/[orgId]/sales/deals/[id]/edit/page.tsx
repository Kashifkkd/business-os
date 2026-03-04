"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDeal, useUpdateDeal, usePipelineStages } from "@/hooks/use-sales";
import { useLeads } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { DealForm, DealFormValues, dealFormValuesToPayload, dealToFormValues } from "../../../deal-form";

export default function EditDealPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const dealId = params?.id as string;

  const { data: deal, isLoading } = useDeal(orgId, dealId);
  const updateDeal = useUpdateDeal(orgId, dealId);
  const { data: stages = [] } = usePipelineStages(orgId);
  const { data: leadsData } = useLeads(orgId, { page: 1, pageSize: 200 });
  const leadOptions = (leadsData?.items ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    company: l.company ?? null,
  }));

  const handleSubmit = (values: DealFormValues) => {
    const payload = dealFormValuesToPayload(values);
    updateDeal.mutate(
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
        onSuccess: () => {
          router.push(`/${orgId}/sales/deals/${dealId}`);
        },
      }
    );
  };

  if (!orgId || !dealId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex h-full w-full flex-col p-4">
        <p className="text-destructive text-sm">Deal not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/sales/deals`}>Back to deals</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/sales/deals/${dealId}`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Edit deal</h1>
          <p className="text-muted-foreground text-xs">
            Update deal details.
          </p>
        </div>
      </div>

      <DealForm
        key={deal.id}
        initialValues={dealToFormValues(deal)}
        mode="edit"
        stages={stages}
        leadOptions={leadOptions}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/sales/deals/${dealId}`)}
        isPending={updateDeal.isPending}
      />
    </div>
  );
}
