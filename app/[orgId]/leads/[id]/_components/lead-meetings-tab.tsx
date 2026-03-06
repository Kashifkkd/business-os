"use client";

import Link from "next/link";
import { useActivityMeetings } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { DateDisplay } from "@/components/date-display";
import { Video, Plus, Pencil } from "lucide-react";

type LeadMeetingsTabProps = {
  orgId: string;
  leadId: string;
};

export function LeadMeetingsTab({ orgId, leadId }: LeadMeetingsTabProps) {
  const { data, isLoading } = useActivityMeetings(
    orgId,
    { page: 1, pageSize: 50, leadId },
    { enabled: !!orgId && !!leadId }
  );

  const meetings = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Meetings</span>
          <Button asChild size="sm">
            <Link href={`/${orgId}/activities/meetings/new?leadId=${leadId}`}>
              <Plus className="size-3.5" />
              Schedule meeting
            </Link>
          </Button>
        </div>
        <EmptyState
          title="No meetings"
          description="Schedule a meeting to track appointments."
          icon={Video}
          action={
            <Button asChild size="sm">
              <Link href={`/${orgId}/activities/meetings/new?leadId=${leadId}`}>
                Schedule meeting
              </Link>
            </Button>
          }
          className="flex-1 min-h-[120px]"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-medium">Meetings</span>
        <Button asChild size="sm">
          <Link href={`/${orgId}/activities/meetings/new?leadId=${leadId}`}>
            <Plus className="size-3.5" />
            Schedule meeting
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${orgId}/activities/meetings/${meeting.id}`}
                  className="font-medium hover:underline"
                >
                  {meeting.title}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  <DateDisplay value={meeting.start_time} variant="datetime" />
                  {meeting.venue && (
                    <>
                      <span>·</span>
                      <span>{meeting.venue}</span>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
                <Link href={`/${orgId}/activities/meetings/${meeting.id}`}>
                  <Pencil className="size-3.5" />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
