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
import { SearchCombobox } from "@/components/ui/search-combobox";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useCompanies, useCreateCompany } from "@/hooks/use-companies";
import { useOrganization } from "@/hooks/use-organization";
import { getPersonDisplayName } from "@/lib/display-name";

const leadFormSchema = z.object({
  first_name: z.string().min(1, "First name is required").trim(),
  last_name: z.string().trim(),
  email: z.string().trim(),
  phone: z.string().trim(),
  company_id: z.string().trim(),
  assignee_ids: z.array(z.string()),
  jobTitle: z.string().trim(),
  website: z.string().trim(),
  source: z.string().trim(),
  stage_id: z.string().min(1, "Stage is required").trim(),
  notes: z.string().trim(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const emptyLeadFormValues: LeadFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  company_id: "",
  assignee_ids: [],
  jobTitle: "",
  website: "https://",
  source: "",
  stage_id: "",
  notes: "",
};

/** Map a Lead from API (with metadata) to LeadFormValues for the form. */
export function leadToFormValues(lead: {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source: string | null;
  stage_id: string;
  notes: string | null;
  metadata?: Record<string, unknown>;
  assignee_ids?: string[];
}): LeadFormValues {
  const meta = lead.metadata && typeof lead.metadata === "object" ? lead.metadata : {};
  const website = (meta.website as string)?.trim() ?? "";
  return {
    first_name: lead.first_name ?? "",
    last_name: lead.last_name ?? "",
    email: lead.email ?? "",
    phone: lead.phone ?? "",
    company_id: lead.company_id ?? "",
    assignee_ids: lead.assignee_ids ?? [],
    jobTitle: (meta.job_title as string) ?? "",
    website: website || "https://",
    source: lead.source ?? "",
    stage_id: lead.stage_id ?? "",
    notes: lead.notes ?? "",
  };
}

function normalizeWebsite(url: string): string {
  const t = url.trim();
  if (!t) return "";
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
}

export function leadFormValuesToPayload(values: LeadFormValues): {
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  source: string | null;
  stage_id: string;
  notes: string | null;
  metadata?: Record<string, unknown>;
  assignee_ids: string[];
} {
  const metadata: Record<string, unknown> = {};
  if (values.jobTitle.trim()) metadata.job_title = values.jobTitle.trim();
  const website = normalizeWebsite(values.website);
  if (website) metadata.website = website;
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    company_id: values.company_id.trim() || null,
    source: values.source.trim() || null,
    stage_id: values.stage_id.trim(),
    notes: values.notes.trim() || null,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    assignee_ids: values.assignee_ids ?? [],
  };
}

export type SourceOption = { value: string; label: string };

type LeadFormProps = {
  orgId: string;
  initialValues: LeadFormValues;
  mode: "create" | "edit";
  onSubmit: (values: LeadFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
  /** Lead source options (from API). Used in combobox; include empty option for "Select source". */
  sourceOptions?: SourceOption[];
  /** Lead stage options (from API). Required for stage dropdown. */
  stageOptions?: { id: string; name: string }[];
};

export function LeadForm({
  orgId,
  initialValues,
  mode,
  onSubmit,
  onCancel,
  isPending = false,
  sourceOptions = [],
  stageOptions = [],
}: LeadFormProps) {
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: initialValues,
  });

  const { data: companies = [] } = useCompanies(orgId);
  const createCompany = useCreateCompany(orgId);
  const { orgMembers: members = [] } = useOrganization(orgId);

  const companyOptions = [
    { value: "", label: "Select company" },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];
  const memberOptions = members.map((m) => ({
    value: m.user_id,
    label: getPersonDisplayName({ first_name: m.first_name, last_name: m.last_name, email: m.email }) ?? m.email ?? m.user_id,
  }));

  useEffect(() => {
    form.reset(initialValues);
  }, [initialValues, form]);

  const handleAddCompany = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || createCompany.isPending) return;
    createCompany.mutate(
      { name: trimmed },
      {
        onSuccess: (data) => {
          form.setValue("company_id", data.id);
        },
      }
    );
  };

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
                name="first_name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-first-name">First name *</FieldLabel>
                    <Input
                      id="lead-form-first-name"
                      placeholder="First name"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="last_name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lead-form-last-name">Last name</FieldLabel>
                    <Input
                      id="lead-form-last-name"
                      placeholder="Last name"
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
                name="company_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Company</FieldLabel>
                    <SearchCombobox
                      options={companyOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select company"
                      emptyMessage="No companies. Type a name to add one."
                      onAddNew={handleAddCompany}
                      id="lead-form-company"
                      className="w-full"
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="assignee_ids"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Assigned to</FieldLabel>
                    <MultiSelectCombobox
                      options={memberOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select members"
                      emptyMessage="No members found."
                      id="lead-form-assignees"
                      className="w-full"
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
                      placeholder="https://"
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
                Source, stage, and any notes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="source"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Source</FieldLabel>
                    {sourceOptions.length > 0 ? (
                      <SearchCombobox
                        options={sourceOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select source"
                        emptyMessage="No sources found."
                        id="lead-form-source"
                        className="w-full"
                      />
                    ) : (
                      <Select
                        value={field.value ? field.value : "__none__"}
                        onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Select source</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="stage_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Stage</FieldLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Select stage</SelectItem>
                        {stageOptions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
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
