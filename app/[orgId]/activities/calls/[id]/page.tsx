"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useActivityCall,
  useUpdateActivityCall,
  useDeleteActivityCall,
} from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import {
  ActivityCallForm,
  callToFormValues,
  type ActivityCallFormValues,
} from "../activity-call-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useState } from "react";

export default function ActivityCallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const callId = params?.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: call, isLoading } = useActivityCall(orgId, callId);
  const updateCall = useUpdateActivityCall(orgId, callId);
  const deleteCall = useDeleteActivityCall(orgId);

  const handleSubmit = (values: ActivityCallFormValues) => {
    const startTime =
      typeof values.call_start_time === "string" && values.call_start_time.trim()
        ? new Date(values.call_start_time).toISOString()
        : call!.call_start_time;
    updateCall.mutate({
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
    });
  };

  const handleDelete = () => {
    deleteCall.mutate(callId, {
      onSuccess: () => router.push(`/${orgId}/activities/calls`),
      onSettled: () => setDeleteOpen(false),
    });
  };

  if (!orgId || !callId) return null;

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

  if (!call) {
    return (
      <div className="flex h-full w-full flex-col p-4">
        <p className="text-destructive text-sm">Call not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/activities/calls`}>Back to calls</Link>
        </Button>
      </div>
    );
  }

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
              Edit call
            </h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>

        <ActivityCallForm
          key={call.id}
          orgId={orgId}
          initialValues={callToFormValues(call)}
          mode="edit"
          leadId={call.lead_id}
          dealId={call.deal_id}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${orgId}/activities/calls`)}
          isPending={updateCall.isPending}
        />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete call</AlertDialogTitle>
            <AlertDialogDescription>
              Delete this call record? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
