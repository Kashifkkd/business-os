"use client";

import Link from "next/link";
import { useActivityCalls } from "@/hooks/use-activities";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { DateDisplay } from "@/components/date-display";
import { Phone, Plus, Pencil } from "lucide-react";

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type LeadCallsTabProps = {
  orgId: string;
  leadId: string;
};

export function LeadCallsTab({ orgId, leadId }: LeadCallsTabProps) {
  const { data, isLoading } = useActivityCalls(
    orgId,
    { page: 1, pageSize: 50, leadId },
    { enabled: !!orgId && !!leadId }
  );

  const calls = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex h-full flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">Calls</span>
          <Button asChild size="sm">
            <Link href={`/${orgId}/activities/calls/new?leadId=${leadId}`}>
              <Plus className="size-3.5" />
              Log call
            </Link>
          </Button>
        </div>
        <EmptyState
          title="No calls"
          description="Log a call to track phone conversations."
          icon={Phone}
          action={
            <Button asChild size="sm">
              <Link href={`/${orgId}/activities/calls/new?leadId=${leadId}`}>
                Log call
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
        <span className="text-sm font-medium">Calls</span>
        <Button asChild size="sm">
          <Link href={`/${orgId}/activities/calls/new?leadId=${leadId}`}>
            <Plus className="size-3.5" />
            Log call
          </Link>
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="divide-y divide-border">
          {calls.map((call) => (
            <li key={call.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/${orgId}/activities/calls/${call.id}`}
                  className="font-medium hover:underline"
                >
                  {call.subject || "Call"}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
                  <span className="capitalize">{call.call_type}</span>
                  <span>·</span>
                  <DateDisplay value={call.call_start_time} variant="datetime" />
                  {call.duration_seconds != null && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(call.duration_seconds)}</span>
                    </>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
                <Link href={`/${orgId}/activities/calls/${call.id}`}>
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
