"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLead, useDeleteLead, useLeadActivities, useCreateLeadActivity, useLeadSources } from "@/hooks/use-leads";
import { sourceColorMap } from "@/lib/lead-sources";
import { SourceChip } from "@/components/source-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2, Mail, Phone, MessageSquare, DollarSign } from "lucide-react";

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const leadId = params?.id as string;

  const { data: lead, isLoading } = useLead(orgId, leadId);
  const { data: sourcesData } = useLeadSources(orgId);
  const sourceColors = sourceColorMap(sourcesData?.sources ?? []);
  const deleteLead = useDeleteLead(orgId);
  const { data: activities = [], isLoading: activitiesLoading } = useLeadActivities(orgId, leadId);
  const createActivity = useCreateLeadActivity(orgId, leadId);
  const [newNote, setNewNote] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleDeleteConfirm = () => {
    if (!lead) return;
    deleteLead.mutate(lead.id, {
      onSuccess: () => router.push(`/${orgId}/leads`),
      onSettled: () => setDeleteDialogOpen(false),
    });
  };

  if (!orgId || !leadId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col p-4 md:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="h-64 bg-muted rounded lg:col-span-4" />
            <div className="h-64 bg-muted rounded lg:col-span-8" />
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-full w-full flex-col p-4 md:p-6">
        <p className="text-destructive text-sm">Lead not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/leads`}>Back to leads</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col p-4 md:p-6">
      {/* Page header — full width, scalable for more actions/tabs later */}
      <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link href={`/${orgId}/leads`}>
              <ArrowLeft className="size-4" />
              Back to leads
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {lead.name}
            </h1>
            {lead.company && (
              <p className="truncate text-sm text-muted-foreground">{lead.company}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deleteLead.isError && (
            <p className="w-full text-sm text-destructive sm:w-auto">{deleteLead.error?.message}</p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${orgId}/sales/deals/new?lead_id=${leadId}`}>
              <DollarSign className="size-4" />
              Convert to deal
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${orgId}/leads/${leadId}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteClick}
            disabled={deleteLead.isPending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </header>

      {/* Main content — 12-col grid: add more columns (e.g. Tasks, Deals) by changing col spans */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        {/* Lead info — fixed width column; add more cards in this column later */}
        <section className="flex flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary" className="capitalize">
                  {lead.status}
                </Badge>
              </div>
              {(lead.email || lead.phone) && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {lead.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="size-3.5" />
                        Email
                      </a>
                    </Button>
                  )}
                  {lead.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${lead.phone}`}>
                        <Phone className="size-3.5" />
                        Call
                      </a>
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all">{lead.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{lead.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Company</dt>
                  <dd>{lead.company ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Source</dt>
                  <dd>
                    <SourceChip source={lead.source} color={sourceColors[lead.source ?? ""]} />
                  </dd>
                </div>
                {lead.notes && (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="whitespace-pre-wrap">{lead.notes}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(lead.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>

        {/* Activity + future panels (Tasks, Deals, etc.) — take remaining columns */}
        <section className="flex min-h-0 flex-col lg:col-span-8">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="shrink-0">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="size-4" />
                Activity
              </h2>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const content = newNote.trim();
                  if (!content || createActivity.isPending) return;
                  createActivity.mutate({ type: "note", content }, { onSuccess: () => setNewNote("") });
                }}
                className="flex shrink-0 flex-col gap-2"
              >
                <Textarea
                  placeholder="Add a note…"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="resize-none"
                  disabled={createActivity.isPending}
                />
                <Button type="submit" size="sm" disabled={!newNote.trim() || createActivity.isPending}>
                  {createActivity.isPending ? "Adding…" : "Add note"}
                </Button>
              </form>
              <div className="min-h-0 overflow-y-auto">
                {activitiesLoading ? (
                  <p className="text-muted-foreground text-sm">Loading activity…</p>
                ) : activities.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No activity yet.</p>
                ) : (
                  <ul className="space-y-3 border-l-2 border-muted pl-4">
                    {activities.map((a) => (
                      <li key={a.id} className="text-sm">
                        <span className="text-muted-foreground capitalize">{a.type.replace("_", " ")}</span>
                        <span className="text-muted-foreground"> · {new Date(a.created_at).toLocaleString()}</span>
                        {a.content && <p className="mt-0.5 whitespace-pre-wrap">{a.content}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead</AlertDialogTitle>
            <AlertDialogDescription>
              Delete lead &quot;{lead.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
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
