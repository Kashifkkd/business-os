"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpsertMarketingSegment } from "@/hooks/use-marketing";
import type { MarketingSegment } from "@/lib/supabase/types";

const segmentFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  status: z.string().optional(),
  source: z.string().optional(),
  created_after: z.string().optional(),
  created_before: z.string().optional(),
});

export type SegmentFormValues = z.infer<typeof segmentFormSchema>;

const LEAD_STATUS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

const SOURCE_OPTIONS = [
  { value: "", label: "Any" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "cold_outbound", label: "Cold outbound" },
  { value: "social", label: "Social" },
  { value: "event", label: "Event" },
];

function formValuesToDefinition(values: SegmentFormValues): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  if (values.status?.trim()) filters.status = values.status.trim();
  if (values.source?.trim()) filters.source = values.source.trim();
  if (values.created_after?.trim()) filters.created_after = values.created_after.trim();
  if (values.created_before?.trim()) filters.created_before = values.created_before.trim();
  return { filters };
}

function segmentToFormValues(s: MarketingSegment | null): SegmentFormValues {
  if (!s?.definition?.filters || typeof s.definition.filters !== "object") {
    return {
      name: "",
      description: "",
      status: "",
      source: "",
      created_after: "",
      created_before: "",
    };
  }
  const f = s.definition.filters as Record<string, unknown>;
  return {
    name: s.name,
    description: s.description ?? "",
    status: (f.status as string) ?? "",
    source: (f.source as string) ?? "",
    created_after: (f.created_after as string) ?? "",
    created_before: (f.created_before as string) ?? "",
  };
}

type SegmentFormProps = {
  orgId: string;
  initialSegment: MarketingSegment | null;
};

export function SegmentForm({ orgId, initialSegment }: SegmentFormProps) {
  const router = useRouter();
  const isEdit = !!initialSegment?.id;

  const upsertSegment = useUpsertMarketingSegment(orgId);

  const form = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: segmentToFormValues(initialSegment),
  });

  useEffect(() => {
    if (initialSegment) {
      form.reset(segmentToFormValues(initialSegment));
    }
  }, [initialSegment?.id, form]);

  const onSubmit = form.handleSubmit((values) => {
    const definition = formValuesToDefinition(values);
    upsertSegment.mutate(
      {
        id: initialSegment?.id,
        name: values.name,
        description: values.description || null,
        definition,
      },
      {
        onSuccess: () => router.push(`/${orgId}/marketing/segments`),
      }
    );
  });

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-y-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgId}/marketing/segments`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-base font-semibold">
          {isEdit ? "Edit segment" : "New segment"}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 space-y-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="e.g. New leads (website)"
                />
                {form.formState.errors.name && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register("description")}
                  placeholder="Optional"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Filters (leads)</CardTitle>
              <p className="text-muted-foreground text-xs">
                Limit this segment to leads matching these criteria.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status") || "any"}
                    onValueChange={(v) => form.setValue("status", v === "any" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "any"} value={opt.value || "any"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={form.watch("source") || "any"}
                    onValueChange={(v) => form.setValue("source", v === "any" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Any" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "any"} value={opt.value || "any"}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="created_after">Created after</Label>
                  <Input
                    id="created_after"
                    type="date"
                    {...form.register("created_after")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created_before">Created before</Label>
                  <Input
                    id="created_before"
                    type="date"
                    {...form.register("created_before")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-t px-4 py-3 flex gap-2">
          <Button type="submit" disabled={upsertSegment.isPending}>
            <Save className="size-3.5" />
            {isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${orgId}/marketing/segments`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
