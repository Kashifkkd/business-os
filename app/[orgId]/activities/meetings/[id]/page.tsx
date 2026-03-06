"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useActivityMeeting,
  useUpdateActivityMeeting,
  useDeleteActivityMeeting,
} from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import {
  ActivityMeetingForm,
  meetingToFormValues,
  type ActivityMeetingFormValues,
} from "../activity-meeting-form";
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

export default function ActivityMeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const meetingId = params?.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: meeting, isLoading } = useActivityMeeting(orgId, meetingId);
  const updateMeeting = useUpdateActivityMeeting(orgId, meetingId);
  const deleteMeeting = useDeleteActivityMeeting(orgId);

  const handleSubmit = (values: ActivityMeetingFormValues) => {
    const startTime =
      typeof values.start_time === "string" && values.start_time.trim()
        ? new Date(values.start_time).toISOString()
        : meeting!.start_time;
    const endTime =
      typeof values.end_time === "string" && values.end_time.trim()
        ? new Date(values.end_time).toISOString()
        : meeting!.end_time;
    updateMeeting.mutate({
      title: values.title,
      description: values.description || null,
      start_time: startTime,
      end_time: endTime,
      venue: values.venue || null,
      all_day: values.all_day,
    });
  };

  const handleDelete = () => {
    deleteMeeting.mutate(meetingId, {
      onSuccess: () => router.push(`/${orgId}/activities/meetings`),
      onSettled: () => setDeleteOpen(false),
    });
  };

  if (!orgId || !meetingId) return null;

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

  if (!meeting) {
    return (
      <div className="flex h-full w-full flex-col p-4">
        <p className="text-destructive text-sm">Meeting not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/activities/meetings`}>Back to meetings</Link>
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
              <Link href={`/${orgId}/activities/meetings`} className="gap-1.5">
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
            <h1 className="text-md font-semibold tracking-tight text-foreground">
              Edit meeting
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

        <ActivityMeetingForm
          key={meeting.id}
          orgId={orgId}
          initialValues={meetingToFormValues(meeting)}
          mode="edit"
          leadId={meeting.lead_id}
          dealId={meeting.deal_id}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/${orgId}/activities/meetings`)}
          isPending={updateMeeting.isPending}
        />
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &quot;{meeting.title}&quot;? This cannot be undone.
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
