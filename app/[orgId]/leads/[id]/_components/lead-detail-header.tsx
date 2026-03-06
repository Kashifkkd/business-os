"use client";

import Link from "next/link";
import { LeadStatusPipeline } from "@/components/lead-status-pipeline";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import type { Lead, LeadStatus } from "@/lib/supabase/types";
import { ArrowLeft, Pencil, Trash2, DollarSign, RefreshCw } from "lucide-react";

type LeadDetailHeaderProps = {
  lead: Lead;
  orgId: string;
  onAdvanceStatus: () => void;
  onMarkLost: () => void;
  onDeleteClick: () => void;
  onRefresh: () => void;
  deleteError: string | null;
  isDeleting: boolean;
};

export function LeadDetailHeader({
  lead,
  orgId,
  onAdvanceStatus,
  onMarkLost,
  onDeleteClick,
  onRefresh,
  deleteError,
  isDeleting,
}: LeadDetailHeaderProps) {
  const leadId = lead.id;

  return (
    <div className="sticky top-0 z-10 -mt-6 mb-4 flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex min-w-0 items-center gap-2 text-sm">
          <Link
            href={`/${orgId}/leads`}
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center transition-colors"
            aria-label="Back to leads"
          >
            <ArrowLeft className="size-3.5" />
          </Link>
          <Avatar className="size-7 shrink-0 rounded-full border border-border">
            <AvatarFallback className="text-xs font-medium">
              {getInitials(lead.name)}
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-base font-semibold text-foreground">{lead.name}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-1.5">
          {deleteError && (
            <p className="w-full text-sm text-destructive sm:w-auto">{deleteError}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs"
            onClick={onRefresh}
            aria-label="Refresh"
          >
            <RefreshCw className="size-3" />
          </Button>
          <Button size="sm" className="h-8 px-2.5 text-xs" asChild>
            <Link href={`/${orgId}/sales/deals/new?lead_id=${leadId}`}>
              <DollarSign className="size-3" />
              Convert to deal
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs" asChild>
            <Link href={`/${orgId}/leads/${leadId}/edit`}>
              <Pencil className="size-3" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={onDeleteClick}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
      <LeadStatusPipeline
        currentStatus={lead.status as LeadStatus}
        onAdvance={onAdvanceStatus}
        onDisqualify={onMarkLost}
        orientation="horizontal"
        compact
        className="w-full max-w-2xl"
      />
    </div>
  );
}
