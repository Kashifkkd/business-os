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
import { useUpsertMarketingJourney } from "@/hooks/use-marketing";
import type { MarketingJourney } from "@/lib/supabase/types";

const journeyFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused"]),
  trigger_type: z.enum(["lead_created", "lead_status_changed", "lead_entered_segment"]),
  segment_id: z.string().optional(),
  steps: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      type: z.enum(["wait", "send_message", "update_lead", "create_task"]),
      config: z.record(z.unknown()),
    })
  ),
});

export type JourneyFormValues = z.infer<typeof journeyFormSchema>;

const TRIGGER_OPTIONS = [
  { value: "lead_created", label: "Lead created" },
  { value: "lead_status_changed", label: "Lead status changed" },
  { value: "lead_entered_segment", label: "Lead entered segment" },
];

const STEP_TYPES = [
  { value: "wait", label: "Wait" },
  { value: "send_message", label: "Send message" },
  { value: "update_lead", label: "Update lead" },
  { value: "create_task", label: "Create task" },
];

function journeyToFormValues(j: MarketingJourney | null): JourneyFormValues {
  if (!j) {
    return {
      name: "",
      description: "",
      status: "draft",
      trigger_type: "lead_created",
      segment_id: "",
      steps: [],
    };
  }
  const triggerConfig = (j.trigger_config ?? {}) as Record<string, unknown>;
  const steps = Array.isArray(j.steps)
    ? (j.steps as { id?: string; order?: number; type?: string; config?: Record<string, unknown> }[]).map(
        (s, i) => ({
          id: (s.id as string) ?? `step-${i}`,
          order: s.order ?? i,
          type: (s.type as JourneyFormValues["steps"][0]["type"]) ?? "wait",
          config: (s.config as Record<string, unknown>) ?? {},
        })
      )
    : [];
  return {
    name: j.name,
    description: j.description ?? "",
    status: j.status as JourneyFormValues["status"],
    trigger_type: j.trigger_type as JourneyFormValues["trigger_type"],
    segment_id: (triggerConfig.segment_id as string) ?? "",
    steps,
  };
}

type JourneyFormProps = {
  orgId: string;
  initialJourney: MarketingJourney | null;
};

export function JourneyForm({ orgId, initialJourney }: JourneyFormProps) {
  const router = useRouter();
  const isEdit = !!initialJourney?.id;

  const upsertJourney = useUpsertMarketingJourney(orgId);

  const form = useForm<JourneyFormValues>({
    resolver: zodResolver(journeyFormSchema),
    defaultValues: journeyToFormValues(initialJourney),
  });

  useEffect(() => {
    if (initialJourney) {
      form.reset(journeyToFormValues(initialJourney));
    }
  }, [initialJourney?.id, form]);

  const onSubmit = form.handleSubmit((values) => {
    const trigger_config: Record<string, unknown> = {};
    if (values.segment_id?.trim()) trigger_config.segment_id = values.segment_id.trim();

    const steps = values.steps.map((s, i) => ({
      id: s.id,
      order: i,
      type: s.type,
      config: s.config,
    }));

    upsertJourney.mutate(
      {
        id: initialJourney?.id,
        name: values.name,
        description: values.description || null,
        status: values.status,
        trigger_type: values.trigger_type,
        trigger_config,
        steps,
      },
      {
        onSuccess: () => router.push(`/${orgId}/marketing/journeys`),
      }
    );
  });

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-y-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgId}/marketing/journeys`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-base font-semibold">
          {isEdit ? "Edit journey" : "New journey"}
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
                  placeholder="e.g. New lead nurture"
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) =>
                      form.setValue("status", v as JourneyFormValues["status"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Trigger</Label>
                  <Select
                    value={form.watch("trigger_type")}
                    onValueChange={(v) =>
                      form.setValue("trigger_type", v as JourneyFormValues["trigger_type"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {form.watch("trigger_type") === "lead_entered_segment" && (
                <div className="space-y-2">
                  <Label htmlFor="segment_id">Segment ID (optional)</Label>
                  <Input
                    id="segment_id"
                    {...form.register("segment_id")}
                    placeholder="UUID of target segment"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Steps</CardTitle>
              <p className="text-muted-foreground text-xs">
                Linear sequence: wait, send message, update lead, or create task.
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                {form.watch("steps").length === 0
                  ? "No steps. Add steps when the journey engine is connected."
                  : `${form.watch("steps").length} step(s) configured.`}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="border-t px-4 py-3 flex gap-2">
          <Button type="submit" disabled={upsertJourney.isPending}>
            <Save className="size-3.5" />
            {isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${orgId}/marketing/journeys`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
