"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateSalesOrder } from "@/hooks/use-sales-orders";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";

const lineSchema = z.object({
  item_id: z.string().min(1, "Item required"),
  quantity: z.coerce.number().min(0.001, "Qty required"),
  unit_price: z.coerce.number().min(0, "Price required"),
});

const schema = z.object({
  order_date: z.string().min(1, "Date required"),
  expected_ship_date: z.string().optional(),
  status: z.string().optional(),
  order_number: z.string().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, "Add at least one line"),
});

type FormValues = z.infer<typeof schema>;

export default function NewSalesOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateSalesOrder(orgId);
  const { data: itemsData } = useInventoryItemsPaginated(orgId, { page: 1, pageSize: 200 }, { enabled: !!orgId });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      order_date: new Date().toISOString().slice(0, 10),
      expected_ship_date: "",
      status: "draft",
      order_number: "",
      currency: "",
      notes: "",
      lines: [{ item_id: "", quantity: 1, unit_price: 0 }],
    },
  });

  const lines = form.watch("lines");
  const items = itemsData?.items ?? [];

  const addLine = () => {
    form.setValue("lines", [...lines, { item_id: "", quantity: 1, unit_price: 0 }]);
  };
  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    form.setValue(
      "lines",
      lines.filter((_, i) => i !== idx)
    );
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      order_date: values.order_date,
      expected_ship_date: values.expected_ship_date || null,
      status: values.status || "draft",
      order_number: values.order_number || null,
      currency: values.currency || null,
      notes: values.notes || null,
      items: values.lines
        .filter((l) => l.item_id && l.quantity > 0)
        .map((l) => ({ item_id: l.item_id, quantity: l.quantity, unit_price: l.unit_price })),
    });
    router.push(`/${orgId}/inventory/sales-orders`);
  });

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${orgId}/inventory/sales-orders`} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-md font-semibold tracking-tight text-foreground">
                New sales order
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">Order details</h2>
            </CardHeader>
            <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order date *</Label>
                <Input id="order_date" type="date" {...form.register("order_date")} />
                {form.formState.errors.order_date && (
                  <p className="text-destructive text-xs">{form.formState.errors.order_date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_ship_date">Expected ship date</Label>
                <Input id="expected_ship_date" type="date" {...form.register("expected_ship_date")} />
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_number">Order number</Label>
                <Input id="order_number" {...form.register("order_number")} placeholder="SO-001" />
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
                    placeholder="Qty"
                    className="w-20 h-8"
                    {...form.register(`lines.${idx}.quantity`)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Price"
                    className="w-24 h-8"
                    {...form.register(`lines.${idx}.unit_price`)}
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
              {form.formState.errors.lines?.root && (
                <p className="text-destructive text-xs">{form.formState.errors.lines.root.message}</p>
              )}
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
