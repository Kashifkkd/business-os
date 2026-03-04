"use client";

import { useParams, useRouter } from "next/navigation";
import { usePicklist } from "@/hooks/use-picklists";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePicklist } from "@/hooks/use-picklists";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditPicklistPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: picklist, isLoading, isError } = usePicklist(orgId, id);
  const updateMutation = useUpdatePicklist(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: picklist
      ? {
          status: picklist.status,
          notes: picklist.notes ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      status: values.status || "open",
      notes: values.notes || null,
    });
    router.push(`/${orgId}/inventory/picklists`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !picklist) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/picklists`);
    return null;
  }

  const pl = picklist as { warehouse_name?: string; sales_order_number?: string };

  return (
    <div className="container mx-auto max-w-xl p-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="size-3.5" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Edit Picklist</h2>
          <p className="text-muted-foreground text-xs">
            Order: {pl.sales_order_number ?? "—"} · Warehouse: {pl.warehouse_name ?? "—"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="size-3.5" />
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
