"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryPackage } from "@/hooks/use-inventory-packages";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { useUpdateInventoryPackage } from "@/hooks/use-inventory-packages";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: pkg, isLoading, isError } = useInventoryPackage(orgId, id);
  const updateMutation = useUpdateInventoryPackage(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: pkg
      ? {
          carrier: pkg.carrier ?? "",
          tracking_number: pkg.tracking_number ?? "",
          status: pkg.status,
          notes: pkg.notes ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      carrier: values.carrier || null,
      tracking_number: values.tracking_number || null,
      status: values.status || "pending",
      notes: values.notes || null,
    });
    router.push(`/${orgId}/inventory/packages`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !pkg) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/packages`);
    return null;
  }

  return (
    <div className="container mx-auto max-w-xl p-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="size-3.5" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Edit Package</h2>
          <p className="text-muted-foreground text-xs">Picklist: {pkg.picklist_id.slice(0, 8)}…</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input id="carrier" {...form.register("carrier")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tracking_number">Tracking number</Label>
                <Input id="tracking_number" {...form.register("tracking_number")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
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
