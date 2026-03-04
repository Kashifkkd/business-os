"use client";

import { useParams, useRouter } from "next/navigation";
import { usePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
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
import { useUpdatePurchaseOrder } from "@/hooks/use-purchase-orders";
import { useVendors } from "@/hooks/use-vendors";
import { useWarehouses } from "@/hooks/use-warehouses";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";
import { Skeleton } from "@/components/ui/skeleton";

const lineSchema = z.object({
  item_id: z.string().min(1, "Item required"),
  quantity: z.coerce.number().min(0.001, "Qty required"),
  unit_cost: z.coerce.number().min(0, "Cost required"),
});

const schema = z.object({
  warehouse_id: z.string().optional(),
  order_date: z.string().min(1, "Date required"),
  expected_date: z.string().optional(),
  status: z.string().optional(),
  order_number: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line"),
});

type FormValues = z.infer<typeof schema>;

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: po, isLoading, isError } = usePurchaseOrder(orgId, id);
  const updateMutation = useUpdatePurchaseOrder(orgId, id);
  const { data: warehouses } = useWarehouses(orgId);
  const { data: itemsData } = useInventoryItemsPaginated(orgId, { page: 1, pageSize: 200 }, { enabled: !!orgId });

  const poItems = (po as { items?: { item_id: string; quantity: number; unit_cost: number }[] })?.items;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: po
      ? {
          warehouse_id: po.warehouse_id ?? "",
          order_date: po.order_date,
          expected_date: po.expected_date ?? "",
          status: po.status,
          order_number: po.order_number ?? "",
          currency: po.currency ?? "",
          notes: po.notes ?? "",
          lines:
            poItems && poItems.length > 0
              ? poItems.map((l) => ({
                  item_id: l.item_id,
                  quantity: l.quantity,
                  unit_cost: l.unit_cost,
                }))
              : [{ item_id: "", quantity: 1, unit_cost: 0 }],
        }
      : undefined,
  });

  const lines = form.watch("lines") ?? [];
  const items = itemsData?.items ?? [];

  const addLine = () => {
    form.setValue("lines", [...lines, { item_id: "", quantity: 1, unit_cost: 0 }]);
  };
  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    form.setValue(
      "lines",
      lines.filter((_, i) => i !== idx)
    );
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      warehouse_id: values.warehouse_id || null,
      order_date: values.order_date,
      expected_date: values.expected_date || null,
      status: values.status || "draft",
      order_number: values.order_number || null,
      currency: values.currency || null,
      notes: values.notes || null,
      items: values.lines
        .filter((l) => l.item_id && l.quantity > 0)
        .map((l) => ({ item_id: l.item_id, quantity: l.quantity, unit_cost: l.unit_cost })),
    });
    router.push(`/${orgId}/inventory/purchase-orders`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !po) return <Skeleton className="h-96 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/purchase-orders`);
    return null;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="size-3.5" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Edit Purchase Order</h2>
          <p className="text-muted-foreground text-xs">Vendor: {po.vendor_name ?? "—"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select
                  value={form.watch("warehouse_id")}
                  onValueChange={(v) => form.setValue("warehouse_id", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {(warehouses ?? []).map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order date *</Label>
                <Input id="order_date" type="date" {...form.register("order_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_date">Expected date</Label>
                <Input id="expected_date" type="date" {...form.register("expected_date")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="partially_received">Partially received</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_number">Order number</Label>
                <Input id="order_number" {...form.register("order_number")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Line items *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLine}>
                  <Plus className="size-3" />
                  Add line
                </Button>
              </div>
              {lines.map((_, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={form.watch(`lines.${idx}.item_id`)}
                      onValueChange={(v) => form.setValue(`lines.${idx}.item_id`, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} {i.sku ? `(${i.sku})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
                    className="w-20 h-8"
                    {...form.register(`lines.${idx}.quantity`)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-24 h-8"
                    {...form.register(`lines.${idx}.unit_cost`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
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
