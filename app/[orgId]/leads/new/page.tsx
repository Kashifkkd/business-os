"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCreateLead } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import type { LeadFormValues } from "../lead-form";
import { LeadForm, emptyLeadFormValues, leadFormValuesToPayload } from "../lead-form";
import { ArrowLeft } from "lucide-react";

export default function NewLeadPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const createLead = useCreateLead(orgId);

  const handleSubmit = (values: LeadFormValues) => {
    const payload = leadFormValuesToPayload(values);
    createLead.mutate(
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
        onSuccess: (data) => {
          router.push(`/${orgId}/leads/${data.id}`);
        },
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full flex-col p-4">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/${orgId}/leads`}>
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">New lead</h1>
          <p className="text-muted-foreground text-xs">
            Add a new lead or inquiry. Fill in the details below.
          </p>
        </div>
      </div>

      <LeadForm
        initialValues={emptyLeadFormValues}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/leads`)}
        isPending={createLead.isPending}
      />
    </div>
  );
}
