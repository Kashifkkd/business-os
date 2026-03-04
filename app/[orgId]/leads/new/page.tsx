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
        initialValues={emptyLeadFormValues}
        mode="create"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${orgId}/leads`)}
        isPending={createLead.isPending}
      />
      </div>
    </div>
  );
}
