"use client";

import { useForm } from "react-hook-form";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const CALL_TYPE_OPTIONS = ["inbound", "outbound"] as const;
const CALL_STATUS_OPTIONS = ["attended", "missed", "busy", "no_answer", "other"] as const;

const schema = z.object({
  subject: z.string().trim(),
  description: z.string().trim(),
  call_type: z.enum(CALL_TYPE_OPTIONS),
  call_status: z.enum(CALL_STATUS_OPTIONS),
  call_start_time: z.string().min(1, "Start time is required").trim(),
  duration_seconds: z.union([z.string(), z.number()]).optional(),
  call_result: z.string().trim(),
  call_agenda: z.string().trim(),
  call_purpose: z.string().trim(),
});

export type ActivityCallFormValues = z.infer<typeof schema>;

export const emptyActivityCallFormValues: ActivityCallFormValues = {
  subject: "",
  description: "",
  call_type: "outbound",
  call_status: "attended",
  call_start_time: "",
  duration_seconds: "",
  call_result: "",
  call_agenda: "",
  call_purpose: "",
};

export function callToFormValues(call: {
  subject: string | null;
  description: string | null;
  call_type: string;
  call_status: string;
  call_start_time: string;
  duration_seconds: number | null;
  call_result: string | null;
  call_agenda: string | null;
  call_purpose: string | null;
}): ActivityCallFormValues {
  const startTime = call.call_start_time
    ? new Date(call.call_start_time).toISOString().slice(0, 16)
    : "";
  return {
    subject: call.subject ?? "",
    description: call.description ?? "",
    call_type: (call.call_type ?? "outbound") as ActivityCallFormValues["call_type"],
    call_status: (call.call_status ?? "attended") as ActivityCallFormValues["call_status"],
    call_start_time: startTime,
    duration_seconds: call.duration_seconds ?? "",
    call_result: call.call_result ?? "",
    call_agenda: call.call_agenda ?? "",
    call_purpose: call.call_purpose ?? "",
  };
}

type ActivityCallFormProps = {
  orgId: string;
  initialValues: ActivityCallFormValues;
  mode: "create" | "edit";
  leadId?: string | null;
  dealId?: string | null;
  onSubmit: (values: ActivityCallFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function ActivityCallForm({
  orgId,
  initialValues,
  mode,
  leadId,
  dealId,
  onSubmit,
  onCancel,
  isPending = false,
}: ActivityCallFormProps) {
  const form = useForm<ActivityCallFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const handleSubmit = form.handleSubmit((values) => {
    const duration =
      values.duration_seconds === "" || values.duration_seconds == null
        ? undefined
        : Number(values.duration_seconds);
    onSubmit({
      ...values,
      duration_seconds: duration,
    });
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Log call" : "Edit call"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="call_start_time">Start time</FieldLabel>
            <Input
              id="call_start_time"
              type="datetime-local"
              {...form.register("call_start_time")}
            />
            <FieldError>{form.formState.errors.call_start_time?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="call_type">Type</FieldLabel>
              <Select
                value={form.watch("call_type")}
                onValueChange={(v) => form.setValue("call_type", v as ActivityCallFormValues["call_type"])}
              >
                <SelectTrigger id="call_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="call_status">Status</FieldLabel>
              <Select
                value={form.watch("call_status")}
                onValueChange={(v) => form.setValue("call_status", v as ActivityCallFormValues["call_status"])}
              >
                <SelectTrigger id="call_status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CALL_STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="duration_seconds">Duration (seconds)</FieldLabel>
            <Input
              id="duration_seconds"
              type="number"
              min={0}
              {...form.register("duration_seconds")}
              placeholder="e.g. 300"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="subject">Subject</FieldLabel>
            <Input
              id="subject"
              {...form.register("subject")}
              placeholder="e.g. Follow-up call"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="call_result">Result</FieldLabel>
            <Input
              id="call_result"
              {...form.register("call_result")}
              placeholder="e.g. Agreed to schedule demo"
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Optional notes"
              rows={3}
            />
          </Field>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {mode === "create" ? "Log call" : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
