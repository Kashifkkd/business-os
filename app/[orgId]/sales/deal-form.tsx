"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { SalesPipelineStage } from "@/lib/supabase/types";

const dealFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  value: z.coerce.number().min(0, "Value must be ≥ 0"),
  stage_id: z.string().min(1, "Stage is required"),
  lead_id: z.string().trim(),
  expected_close_date: z.string().trim(),
  probability: z.coerce.number().min(0).max(100).optional(),
  notes: z.string().trim(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

export const emptyDealFormValues: DealFormValues = {
  name: "",
  value: 0,
  stage_id: "",
  lead_id: "",
  expected_close_date: "",
  probability: undefined,
  notes: "",
};

export function dealToFormValues(deal: {
  name: string;
  value: number;
  stage_id: string;
  lead_id: string | null;
  expected_close_date: string | null;
  probability: number | null;
  notes: string | null;
}): DealFormValues {
  return {
    name: deal.name ?? "",
    value: deal.value ?? 0,
    stage_id: deal.stage_id ?? "",
    lead_id: deal.lead_id ?? "",
    expected_close_date: deal.expected_close_date ?? "",
    probability: deal.probability ?? undefined,
    notes: deal.notes ?? "",
  };
}

export function dealFormValuesToPayload(values: DealFormValues): {
  name: string;
  stage_id: string;
  lead_id: string | null;
  value: number;
  probability: number | null;
  expected_close_date: string | null;
  notes: string | null;
} {
  return {
    name: values.name.trim(),
    stage_id: values.stage_id.trim(),
    lead_id: values.lead_id.trim() || null,
    value: values.value,
    probability: values.probability ?? null,
    expected_close_date: values.expected_close_date.trim() || null,
    notes: values.notes.trim() || null,
  };
}

type DealFormProps = {
  initialValues: DealFormValues;
  mode: "create" | "edit";
  stages: SalesPipelineStage[];
  leadOptions?: { id: string; name: string; company: string | null }[];
  onSubmit: (values: DealFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function DealForm({
  initialValues,
  mode,
  stages,
  leadOptions = [],
  onSubmit,
  onCancel,
  isPending = false,
}: DealFormProps) {
  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
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
              <CardTitle className="text-base">Deal details</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Name, value, and stage.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-form-name">Deal name *</FieldLabel>
                    <Input
                      id="deal-form-name"
                      placeholder="e.g. Acme Corp - Enterprise"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="value"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-form-value">Value *</FieldLabel>
                    <Input
                      id="deal-form-value"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="stage_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Stage *</FieldLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((s) => (
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
                name="lead_id"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Link to lead</FieldLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {leadOptions.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                            {l.company ? ` (${l.company})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="probability"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-form-probability">Probability (%)</FieldLabel>
                    <Input
                      id="deal-form-probability"
                      type="number"
                      min={0}
                      max={100}
                      placeholder="50"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dates & notes</CardTitle>
              <p className="text-muted-foreground text-sm font-normal">
                Expected close date and notes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Controller
                name="expected_close_date"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="deal-form-expected-close">Expected close date</FieldLabel>
                    <Input
                      id="deal-form-expected-close"
                      type="date"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                      {...field}
                    />
                    <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
                  </Field>
                )}
              />
              <Controller
                name="notes"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="flex-1">
                    <FieldLabel htmlFor="deal-form-notes">Notes</FieldLabel>
                    <Textarea
                      id="deal-form-notes"
                      placeholder="Add notes about this deal..."
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

      <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creating…"
                : "Saving…"
              : mode === "create"
                ? "Create deal"
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
