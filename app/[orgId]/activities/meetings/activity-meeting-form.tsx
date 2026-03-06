"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

const schema = z.object({
  title: z.string().min(1, "Title is required").trim(),
  description: z.string().trim(),
  start_time: z.string().min(1, "Start time is required").trim(),
  end_time: z.string().min(1, "End time is required").trim(),
  venue: z.string().trim(),
  all_day: z.boolean(),
});

export type ActivityMeetingFormValues = z.infer<typeof schema>;

export const emptyActivityMeetingFormValues: ActivityMeetingFormValues = {
  title: "",
  description: "",
  start_time: "",
  end_time: "",
  venue: "",
  all_day: false,
};

export function meetingToFormValues(meeting: {
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  venue: string | null;
  all_day: boolean;
}): ActivityMeetingFormValues {
  return {
    title: meeting.title ?? "",
    description: meeting.description ?? "",
    start_time: meeting.start_time
      ? new Date(meeting.start_time).toISOString().slice(0, 16)
      : "",
    end_time: meeting.end_time
      ? new Date(meeting.end_time).toISOString().slice(0, 16)
      : "",
    venue: meeting.venue ?? "",
    all_day: meeting.all_day ?? false,
  };
}

type ActivityMeetingFormProps = {
  orgId: string;
  initialValues: ActivityMeetingFormValues;
  mode: "create" | "edit";
  leadId?: string | null;
  dealId?: string | null;
  onSubmit: (values: ActivityMeetingFormValues) => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function ActivityMeetingForm({
  orgId,
  initialValues,
  mode,
  leadId,
  dealId,
  onSubmit,
  onCancel,
  isPending = false,
}: ActivityMeetingFormProps) {
  const form = useForm<ActivityMeetingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values);
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Schedule meeting" : "Edit meeting"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              {...form.register("title")}
              placeholder="e.g. Demo call"
            />
            <FieldError>{form.formState.errors.title?.message}</FieldError>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="start_time">Start time</FieldLabel>
              <Input
                id="start_time"
                type="datetime-local"
                {...form.register("start_time")}
              />
              <FieldError>{form.formState.errors.start_time?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="end_time">End time</FieldLabel>
              <Input
                id="end_time"
                type="datetime-local"
                {...form.register("end_time")}
              />
              <FieldError>{form.formState.errors.end_time?.message}</FieldError>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="venue">Venue</FieldLabel>
            <Input
              id="venue"
              {...form.register("venue")}
              placeholder="e.g. Zoom, Conference room A"
            />
          </Field>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="all_day"
              {...form.register("all_day")}
              className="rounded border-input"
            />
            <FieldLabel htmlFor="all_day" className="font-normal">
              All-day event
            </FieldLabel>
          </div>

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
          {mode === "create" ? "Schedule" : "Save"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
