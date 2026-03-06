"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDeal, useDeleteDeal, useDealActivities, useCreateDealActivity, usePipelineStages } from "@/hooks/use-sales";
import { useTenant } from "@/hooks/use-tenant";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Pencil, Trash2, MessageSquare, Phone, Video } from "lucide-react";
import { DealCallsTab } from "./_components/deal-calls-tab";
import { DealMeetingsTab } from "./_components/deal-meetings-tab";

function formatCurrency(value: number, symbol: string): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const dealId = params?.id as string;
  const { tenant } = useTenant();
  const symbol = tenant?.currency_symbol ?? "$";

  const { data: deal, isLoading } = useDeal(orgId, dealId);
  const { data: stages = [] } = usePipelineStages(orgId);
  const stageMap = new Map(stages.map((s) => [s.id, s]));
  const stageName = deal ? stageMap.get(deal.stage_id)?.name ?? "—" : "—";

  const deleteDeal = useDeleteDeal(orgId);
  const { data: activities = [], isLoading: activitiesLoading } = useDealActivities(orgId, dealId);
  const createActivity = useCreateDealActivity(orgId, dealId);
  const [newNote, setNewNote] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    if (!deal) return;
    deleteDeal.mutate(deal.id, {
      onSuccess: () => router.push(`/${orgId}/sales/deals`),
      onSettled: () => setDeleteDialogOpen(false),
    });
  };

  if (!orgId || !dealId) return null;

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

  if (!deal) {
    return (
      <div className="flex h-full w-full flex-col p-4 md:p-6">
        <p className="text-destructive text-sm">Deal not found.</p>
        <Button variant="link" asChild className="mt-2 p-0">
          <Link href={`/${orgId}/sales/deals`}>Back to deals</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full min-h-0 flex-col p-4 md:p-6">
      <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="shrink-0" asChild>
            <Link href={`/${orgId}/sales/deals`}>
              <ArrowLeft className="size-4" />
              Back to deals
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
              {deal.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatCurrency(deal.value, symbol)}
              {stageName !== "—" && ` · ${stageName}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {deleteDeal.isError && (
            <p className="w-full text-sm text-destructive sm:w-auto">{deleteDeal.error?.message}</p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/${orgId}/sales/deals/${dealId}/edit`}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteDeal.isPending}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <section className="flex flex-col gap-6 lg:col-span-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="secondary">{stageName}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Value</dt>
                  <dd className="font-medium">{formatCurrency(deal.value, symbol)}</dd>
                </div>
                {deal.expected_close_date && (
                  <div>
                    <dt className="text-muted-foreground">Expected close</dt>
                    <dd>{deal.expected_close_date}</dd>
                  </div>
                )}
                {deal.probability != null && (
                  <div>
                    <dt className="text-muted-foreground">Probability</dt>
                    <dd>{deal.probability}%</dd>
                  </div>
                )}
                {deal.lead_id && (
                  <div>
                    <dt className="text-muted-foreground">Linked lead</dt>
                    <dd>
                      <Link
                        href={`/${orgId}/leads/${deal.lead_id}`}
                        className="text-primary hover:underline"
                      >
                        View lead
                      </Link>
                    </dd>
                  </div>
                )}
                {deal.notes && (
                  <div>
                    <dt className="text-muted-foreground">Notes</dt>
                    <dd className="whitespace-pre-wrap">{deal.notes}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Created</dt>
                  <dd>{new Date(deal.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>

        <section className="flex min-h-0 flex-col lg:col-span-8">
          <Card className="flex min-h-0 flex-1 flex-col py-0 gap-0">
            <Tabs defaultValue="activity" className="flex h-full min-h-0 flex-1 flex-col">
              <TabsList className="w-full shrink-0 rounded-b-none border-b border-border px-4">
                <TabsTrigger value="activity">
                  <MessageSquare className="size-3.5" />
                  Activity
                </TabsTrigger>
                <TabsTrigger value="calls">
                  <Phone className="size-3.5" />
                  Calls
                </TabsTrigger>
                <TabsTrigger value="meetings">
                  <Video className="size-3.5" />
                  Meetings
                </TabsTrigger>
              </TabsList>
              <CardContent className="min-h-0 flex-1 overflow-hidden rounded-t-none border-0 p-0 pt-0">
                <TabsContent value="activity" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
                  <div className="flex flex-1 flex-col gap-4 p-4">
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
                  </div>
                </TabsContent>
                <TabsContent value="calls" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
                  <DealCallsTab orgId={orgId} dealId={dealId} />
                </TabsContent>
                <TabsContent value="meetings" className="mt-0 flex h-full flex-col overflow-hidden data-[state=inactive]:hidden">
                  <DealMeetingsTab orgId={orgId} dealId={dealId} />
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </section>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete deal</AlertDialogTitle>
            <AlertDialogDescription>
              Delete deal &quot;{deal.name}&quot;? This cannot be undone.
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
