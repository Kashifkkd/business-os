"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreatePicklist } from "@/hooks/use-picklists";
import { useSalesOrdersPaginated } from "@/hooks/use-sales-orders";
import { useWarehouses } from "@/hooks/use-warehouses";

const schema = z.object({
  sales_order_id: z.string().min(1, "Sales order required"),
  warehouse_id: z.string().min(1, "Warehouse required"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPicklistPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreatePicklist(orgId);
  const { data: ordersData } = useSalesOrdersPaginated(orgId, { page: 1, pageSize: 100 }, { enabled: !!orgId });
  const { data: warehouses } = useWarehouses(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sales_order_id: "",
      warehouse_id: "",
      status: "open",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      sales_order_id: values.sales_order_id,
      warehouse_id: values.warehouse_id,
      status: values.status || "open",
      notes: values.notes || null,
    });
    router.push(`/${orgId}/inventory/picklists`);
  });

  const orders = ordersData?.items ?? [];

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${orgId}/inventory/picklists`} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-md font-semibold tracking-tight text-foreground">
                New picklist
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">Picklist details</h2>
            </CardHeader>
            <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Sales order *</Label>
              <Select
                value={form.watch("sales_order_id")}
                onValueChange={(v) => form.setValue("sales_order_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.order_number ?? o.id.slice(0, 8)} — {o.order_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.sales_order_id && (
                <p className="text-destructive text-xs">{form.formState.errors.sales_order_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <Select
                value={form.watch("warehouse_id")}
                onValueChange={(v) => form.setValue("warehouse_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {(warehouses ?? []).map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.warehouse_id && (
                <p className="text-destructive text-xs">{form.formState.errors.warehouse_id.message}</p>
              )}
            </div>
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
