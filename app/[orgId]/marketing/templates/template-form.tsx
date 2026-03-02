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
import { Switch } from "@/components/ui/switch";
import { useUpsertMarketingTemplate } from "@/hooks/use-marketing";
import type { MarketingTemplate } from "@/lib/supabase/types";

const templateFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  channel: z.enum(["email", "sms", "whatsapp", "social"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Body is required"),
  is_active: z.boolean(),
});

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

const CHANNELS = ["email", "sms", "whatsapp", "social"] as const;

function templateToFormValues(t: MarketingTemplate | null): TemplateFormValues {
  if (!t) {
    return {
      name: "",
      description: "",
      channel: "email",
      subject: "",
      body: "",
      is_active: true,
    };
  }
  return {
    name: t.name,
    description: t.description ?? "",
    channel: t.channel as TemplateFormValues["channel"],
    subject: t.subject ?? "",
    body: t.body ?? "",
    is_active: t.is_active,
  };
}

type TemplateFormProps = {
  orgId: string;
  initialTemplate: MarketingTemplate | null;
};

export function TemplateForm({ orgId, initialTemplate }: TemplateFormProps) {
  const router = useRouter();
  const isEdit = !!initialTemplate?.id;

  const upsertTemplate = useUpsertMarketingTemplate(orgId);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: templateToFormValues(initialTemplate),
  });

  useEffect(() => {
    if (initialTemplate) {
      form.reset(templateToFormValues(initialTemplate));
    }
  }, [initialTemplate?.id, form]);

  const onSubmit = form.handleSubmit((values) => {
    upsertTemplate.mutate(
      {
        id: initialTemplate?.id,
        name: values.name,
        description: values.description || null,
        channel: values.channel,
        subject: values.channel === "email" ? (values.subject || null) : null,
        body: values.body,
        is_active: values.is_active,
      },
      {
        onSuccess: () => router.push(`/${orgId}/marketing/templates`),
      }
    );
  });

  const channel = form.watch("channel");
  const isEmail = channel === "email";

  return (
    <div className="h-full w-full min-h-0 flex flex-col overflow-y-auto">
      <div className="border-b px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/${orgId}/marketing/templates`}>
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-base font-semibold">
          {isEdit ? "Edit template" : "New template"}
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
                  placeholder="e.g. Welcome email"
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
                  <Label>Channel</Label>
                  <Select
                    value={form.watch("channel")}
                    onValueChange={(v) =>
                      form.setValue("channel", v as TemplateFormValues["channel"])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CHANNELS.map((ch) => (
                        <SelectItem key={ch} value={ch}>
                          {ch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-8">
                  <Switch
                    id="is_active"
                    checked={form.watch("is_active")}
                    onCheckedChange={(v) => form.setValue("is_active", v)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              {isEmail && (
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    {...form.register("subject")}
                    placeholder="Email subject"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  {...form.register("body")}
                  placeholder={
                    isEmail
                      ? "HTML or plain text. Use {{lead.name}} for variables."
                      : "Message body. Use {{lead.name}} for variables."
                  }
                  rows={12}
                  className="font-mono text-sm"
                />
                {form.formState.errors.body && (
                  <p className="text-destructive text-xs">
                    {form.formState.errors.body.message}
                  </p>
                )}
                {channel === "sms" && (
                  <p className="text-muted-foreground text-xs">
                    SMS has a 160 character limit for single segment.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="border-t px-4 py-3 flex gap-2">
          <Button type="submit" disabled={upsertTemplate.isPending}>
            <Save className="size-3.5" />
            {isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/${orgId}/marketing/templates`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
