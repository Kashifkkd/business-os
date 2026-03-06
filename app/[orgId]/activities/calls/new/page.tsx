"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateActivityCall } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import {
  ActivityCallForm,
  emptyActivityCallFormValues,
  type ActivityCallFormValues,
} from "../activity-call-form";
import { ArrowLeft } from "lucide-react";

export default function NewActivityCallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = searchParams.get("leadId") || undefined;
  const dealId = searchParams.get("dealId") || undefined;

  const defaultStartTime = new Date().toISOString().slice(0, 16);
  const initialValues = {
    ...emptyActivityCallFormValues,
    call_start_time: defaultStartTime,
  };

  const createCall = useCreateActivityCall(orgId);

  const handleSubmit = (values: ActivityCallFormValues) => {
    const startTime =
      typeof values.call_start_time === "string" && values.call_start_time.trim()
        ? new Date(values.call_start_time).toISOString()
        : new Date().toISOString();
    createCall.mutate(
      {
        subject: values.subject || null,
        description: values.description || null,
        call_type: values.call_type,
        call_status: values.call_status,
        call_start_time: startTime,
        duration_seconds:
          typeof values.duration_seconds === "number" && values.duration_seconds >= 0
            ? values.duration_seconds
            : null,
        call_result: values.call_result || null,
        call_agenda: values.call_agenda || null,
        call_purpose: values.call_purpose || null,
        lead_id: leadId || null,
        deal_id: dealId || null,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/activities/calls/${data.id}`);
        },
      }
    );
  };

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 px-2 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-row items-center gap-1">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${orgId}/activities/calls`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              Log call
            </h1>
          </div>
        </div>

        <ActivityCallForm
          orgId={orgId}
          initialValues={initialValues}
          mode="create"
          leadId={leadId}
          dealId={dealId}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${orgId}/activities/calls`)}
          isPending={createCall.isPending}
        />
      </div>
    </div>
  );
}
