"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateInventoryPackage } from "@/hooks/use-inventory-packages";
import { usePicklistsPaginated } from "@/hooks/use-picklists";

const schema = z.object({
  picklist_id: z.string().min(1, "Picklist required"),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPackagePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateInventoryPackage(orgId);
  const { data: picklistsData } = usePicklistsPaginated(orgId, { page: 1, pageSize: 100 }, { enabled: !!orgId });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      picklist_id: "",
      carrier: "",
      tracking_number: "",
      status: "pending",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      picklist_id: values.picklist_id,
      carrier: values.carrier || null,
      tracking_number: values.tracking_number || null,
      status: values.status || "pending",
      notes: values.notes || null,
    });
    router.push(`/${orgId}/inventory/packages`);
  });

  const picklists = picklistsData?.items ?? [];

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${orgId}/inventory/packages`} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-md font-semibold tracking-tight text-foreground">
                New package
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">Package details</h2>
            </CardHeader>
            <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Picklist *</Label>
              <Select
                value={form.watch("picklist_id")}
                onValueChange={(v) => form.setValue("picklist_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select picklist" />
                </SelectTrigger>
                <SelectContent>
                  {picklists.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id}>
                      {(pl as { sales_order_number?: string }).sales_order_number ?? pl.id.slice(0, 8)} — {(pl as { warehouse_name?: string }).warehouse_name ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.picklist_id && (
                <p className="text-destructive text-xs">{form.formState.errors.picklist_id.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="carrier">Carrier</Label>
                <Input id="carrier" {...form.register("carrier")} placeholder="UPS, FedEx, etc." />
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
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="size-3.5" />
                Create
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
