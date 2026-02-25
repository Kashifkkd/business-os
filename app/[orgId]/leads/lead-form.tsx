"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";

export const LEAD_STATUS_OPTIONS = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
] as const;

export const SOURCE_OPTIONS = [
  { value: "", label: "Select source" },
  { value: "website", label: "Website" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manual" },
  { value: "cold_outbound", label: "Cold outbound" },
  { value: "social", label: "Social media" },
  { value: "event", label: "Event" },
] as const;

const leadFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().trim(),
  phone: z.string().trim(),
  company: z.string().trim(),
  jobTitle: z.string().trim(),
  website: z.string().trim(),
  source: z.string().trim(),
  status: z.enum(LEAD_STATUS_OPTIONS),
  notes: z.string().trim(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const emptyLeadFormValues: LeadFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  website: "",
  source: "",
  status: "new",
  notes: "",
};

/** Map a Lead from API (with metadata) to LeadFormValues for the form. */
export function leadToFormValues(lead: {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  metadata?: Record<string, unknown>;
}): LeadFormValues {
  const meta = lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {};
  return {
    name: lead.name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    company: lead.company ?? "",
    jobTitle: (meta.job_title as string) ?? "",
    website: (meta.website as string) ?? "",
    source: lead.source ?? "",
    status: (lead.status ?? "new") as LeadFormValues["status"],
    notes: lead.notes ?? "",
  };
}

export function leadFormValuesToPayload(values: LeadFormValues): {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string;
  notes: string | null;
  metadata?: Record<string, unknown>;
} {
  const metadata: Record<string, unknown> = {};
  if (values.jobTitle.trim()) metadata.job_title = values.jobTitle.trim();
  if (values.website.trim()) metadata.website = values.website.trim();
  return {
    name: values.name.trim(),
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    company: values.company.trim() || null,
    source: values.source.trim() || null,
    status: values.status.trim() || "new",
    notes: values.notes.trim() || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

type LeadFormProps = {
  initialValues: LeadFormValues;
  mode: "create" | "edit";
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function LeadForm({
  initialValues,
  mode,
  onSubmit,
  onCancel,
  isPending = false,
}: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex h-full flex-1 flex-col"
    >
      <div className="flex-1 overflow-auto p-1">
        <div className="grid grid-cols-1 gap-6 pb-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact information</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Primary contact details for the lead.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-name">Name *</FieldLabel>
                    <Input
                      id="lead-form-name"
                      placeholder="Full name"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-email">Email</FieldLabel>
                    <Input
                      id="lead-form-email"
                      type="email"
                      placeholder="email@example.com"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-phone">Phone</FieldLabel>
                    <PhoneInput
                      id="lead-form-phone"
                      value={field.value || undefined}
                      onChange={(val) => field.onChange(val ?? "")}
                      placeholder="Enter phone number"
                      defaultCountry="US"
                      className="w-full"
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="company"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-company">Company</FieldLabel>
                    <Input
                      id="lead-form-company"
                      placeholder="Company name"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="jobTitle"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-job_title">Job title</FieldLabel>
                    <Input
                      id="lead-form-job_title"
                      placeholder="e.g. Marketing Manager"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="website"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-website">Website</FieldLabel>
                    <Input
                      id="lead-form-website"
                      type="url"
                      placeholder="https://..."
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualification & notes</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Source, status, and any notes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="source"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Source</FieldLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(v) => field.onChange(v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="How did they find you?" />
                      </SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value || "none"}
                            value={opt.value || "none"}
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="status"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Status</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="notes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor="lead-form-notes">Notes</FieldLabel>
                    <Textarea
                      id="lead-form-notes"
                      placeholder="Add notes about this lead, next steps, or context..."
                      rows={12}
                      className="min-h-[200px] w-full resize-y"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create lead"
                : "Save changes"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            {mode === "create" ? "Cancel" : "Discard"}
          </Button>
        </div>
      </div>
    </form>
  );
}
