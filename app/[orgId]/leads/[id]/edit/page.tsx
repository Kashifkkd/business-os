"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLead, useUpdateLead } from "@/hooks/use-leads";
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

  const handleSubmit = (values: LeadFormValues) => {
    const payload = leadFormValuesToPayload(values);
    updateLead.mutate(
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company,
        source: payload.source,
        status: payload.status,
        notes: payload.notes,
        metadata: payload.metadata,
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
        initialValues={leadToFormValues(lead)}
        mode="edit"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/leads/${leadId}`)}
        isPending={updateLead.isPending}
      />
    </div>
  );
}
