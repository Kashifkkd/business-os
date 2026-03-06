"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SourceChip } from "@/components/source-chip";
import { Separator } from "@/components/ui/separator";
import type { Lead } from "@/lib/supabase/types";
import { Mail, Phone, MessageCircle, ImageIcon, MoreHorizontal, Copy } from "lucide-react";

type LeadDetailSidebarProps = {
  lead: Lead;
  sourceColors: Record<string, string>;
  onCopyEmail: () => void;
};

export function LeadDetailSidebar({
  lead,
  sourceColors,
  onCopyEmail,
}: LeadDetailSidebarProps) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        {lead.email && (
          <Button variant="outline" size="icon" className="size-8" asChild>
            <a href={`mailto:${lead.email}`} aria-label="Email">
              <Mail className="size-3.5" />
            </a>
          </Button>
        )}
        {lead.phone && (
          <Button variant="outline" size="icon" className="size-8" asChild>
            <a href={`tel:${lead.phone}`} aria-label="Call">
              <Phone className="size-3.5" />
            </a>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="size-8" disabled>
              <MessageCircle className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="size-8" disabled>
              <ImageIcon className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="size-8" disabled>
              <MoreHorizontal className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Coming soon</TooltipContent>
        </Tooltip>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Contact
        </h2>
        <dl className="space-y-3.5 text-sm">
          <div>
            <dt className="text-muted-foreground">Email</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 break-all font-medium">
              {lead.email ?? "—"}
              {lead.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={onCopyEmail}
                      className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Copy email"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Copy email</TooltipContent>
                </Tooltip>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Phone</dt>
            <dd className="mt-0.5 font-medium">{lead.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Address</dt>
            <dd className="mt-0.5 text-muted-foreground/80">Coming soon</dd>
          </div>
        </dl>
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Details
        </h2>
        <dl className="space-y-3.5 text-sm">
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="mt-0.5 font-medium">
              {new Date(lead.created_at).toLocaleDateString(undefined, { dateStyle: "long" })}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Source</dt>
            <dd className="mt-0.5">
              <SourceChip source={lead.source} color={sourceColors[lead.source ?? ""]} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Assigned to</dt>
            <dd className="mt-0.5 text-muted-foreground/80">Coming soon</dd>
          </div>
        </dl>
      </div>

      <Button variant="outline" size="sm" className="w-full" disabled>
        Add a property
      </Button>
      <p className="text-center text-xs text-muted-foreground">Coming soon</p>

      {lead.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notes
            </h2>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">{lead.notes}</p>
          </div>
        </>
      )}
    </div>
  );
}
