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
import {
  useCreateMarketingCampaign,
  useUpdateMarketingCampaign,
  useMarketingSegments,
} from "@/hooks/use-marketing";
import type { MarketingCampaign } from "@/lib/supabase/types";

const campaignFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  objective: z.string().optional(),
  status: z.enum(["draft", "scheduled", "running", "paused", "completed"]),
  primary_channel: z.enum(["email", "sms", "whatsapp", "social"]).optional().nullable(),
  budget_amount: z.string().optional(),
  budget_currency: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  primary_segment_id: z.string().optional().nullable(),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

const STATUS_OPTIONS = ["draft", "scheduled", "running", "paused", "completed"] as const;
const CHANNEL_OPTIONS = ["email", "sms", "whatsapp", "social"] as const;

function campaignToFormValues(c: MarketingCampaign | null): CampaignFormValues {
  if (!c) {
    return {
      name: "",
      description: "",
      objective: "",
      status: "draft",
      primary_channel: null,
      budget_amount: "",
      budget_currency: "",
      starts_at: "",
      ends_at: "",
      primary_segment_id: null,
    };
  }
  return {
    name: c.name,
    description: c.description ?? "",
    objective: c.objective ?? "",
    status: c.status as CampaignFormValues["status"],
    primary_channel: (c.primary_channel as CampaignFormValues["primary_channel"]) ?? null,
    budget_amount: c.budget_amount != null ? String(c.budget_amount) : "",
    budget_currency: c.budget_currency ?? "",
    starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
    ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
    primary_segment_id: c.primary_segment_id ?? null,
  };
}

type CampaignFormProps = {
  orgId: string;
  initialCampaign: MarketingCampaign | null;
};

export function CampaignForm({ orgId, initialCampaign }: CampaignFormProps) {
  const router = useRouter();
  const isEdit = !!initialCampaign?.id;

  const { data: segmentsData } = useMarketingSegments(orgId);
  const segments = segmentsData?.items ?? [];

  const createCampaign = useCreateMarketingCampaign(orgId);
  const updateCampaign = useUpdateMarketingCampaign(orgId, initialCampaign?.id ?? "");

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: campaignToFormValues(initialCampaign),
  });

  useEffect(() => {
    if (initialCampaign) {
      form.reset(campaignToFormValues(initialCampaign));
    }
  }, [initialCampaign?.id, form]);

  const onSubmit = form.handleSubmit((values) => {
    const payload = {
      name: values.name,
      description: values.description || null,
      objective: values.objective || null,
      status: values.status,
      primary_channel: values.primary_channel || null,
      budget_amount: values.budget_amount ? Number(values.budget_amount) : null,
      budget_currency: values.budget_currency || null,
      starts_at: values.starts_at || null,
      ends_at: values.ends_at || null,
      primary_segment_id: values.primary_segment_id || null,
    };

    if (isEdit) {
      updateCampaign.mutate(payload, {
        onSuccess: () => router.push(`/${orgId}/marketing/campaigns`),
      });
    } else {
      createCampaign.mutate(payload, {
        onSuccess: () => router.push(`/${orgId}/marketing/campaigns`),
      });
    }
  });

  const isPending = createCampaign.isPending || updateCampaign.isPending;

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-y-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgId}/marketing/campaigns`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-base font-semibold">
          {isEdit ? "Edit campaign" : "New campaign"}
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
                  placeholder="e.g. Spring Launch"
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
              <div className="space-y-2">
                <Label htmlFor="objective">Objective</Label>
                <Input
                  id="objective"
                  {...form.register("objective")}
                  placeholder="e.g. Increase sign-ups"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(v) => form.setValue("status", v as CampaignFormValues["status"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Primary channel</Label>
                  <Select
                    value={form.watch("primary_channel") ?? "none"}
                    onValueChange={(v) =>
                      form.setValue("primary_channel", v === "none" ? null : (v as CampaignFormValues["primary_channel"]))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CHANNEL_OPTIONS.map((ch) => (
                        <SelectItem key={ch} value={ch}>
                          {ch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target segment</Label>
                <Select
                  value={form.watch("primary_segment_id") ?? "none"}
                  onValueChange={(v) =>
                    form.setValue("primary_segment_id", v === "none" ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {segments.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_amount">Budget amount</Label>
                  <Input
                    id="budget_amount"
                    type="number"
                    {...form.register("budget_amount")}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_currency">Currency</Label>
                  <Input
                    id="budget_currency"
                    {...form.register("budget_currency")}
                    placeholder="USD"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Starts at</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    {...form.register("starts_at")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">Ends at</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    {...form.register("ends_at")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-t px-4 py-3 flex gap-2">
          <Button type="submit" disabled={isPending}>
            <Save className="size-3.5" />
            {isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${orgId}/marketing/campaigns`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
