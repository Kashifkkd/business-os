"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateActivityMeeting } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import {
  ActivityMeetingForm,
  emptyActivityMeetingFormValues,
  type ActivityMeetingFormValues,
} from "../activity-meeting-form";
import { ArrowLeft } from "lucide-react";

export default function NewActivityMeetingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = searchParams.get("leadId") || undefined;
  const dealId = searchParams.get("dealId") || undefined;

  const now = new Date();
  const end = new Date(now.getTime() + 60 * 60 * 1000);
  const initialValues = {
    ...emptyActivityMeetingFormValues,
    start_time: now.toISOString().slice(0, 16),
    end_time: end.toISOString().slice(0, 16),
  };

  const createMeeting = useCreateActivityMeeting(orgId);

  const handleSubmit = (values: ActivityMeetingFormValues) => {
    const startTime =
      typeof values.start_time === "string" && values.start_time.trim()
        ? new Date(values.start_time).toISOString()
        : new Date().toISOString();
    const endTime =
      typeof values.end_time === "string" && values.end_time.trim()
        ? new Date(values.end_time).toISOString()
        : new Date(Date.now() + 60 * 60 * 1000).toISOString();
    createMeeting.mutate(
      {
        title: values.title,
        description: values.description || null,
        start_time: startTime,
        end_time: endTime,
        venue: values.venue || null,
        all_day: values.all_day,
        lead_id: leadId || null,
        deal_id: dealId || null,
      },
      {
        onSuccess: (data) => {
          router.push(`/${orgId}/activities/meetings/${data.id}`);
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
              <Link href={`/${orgId}/activities/meetings`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              Schedule meeting
            </h1>
          </div>
        </div>

        <ActivityMeetingForm
          orgId={orgId}
          initialValues={initialValues}
          mode="create"
          leadId={leadId}
          dealId={dealId}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${orgId}/activities/meetings`)}
          isPending={createMeeting.isPending}
        />
      </div>
    </div>
  );
}
