"use client";

import { useRouter } from "next/navigation";
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
import { useCreateInventoryItem, useUpdateInventoryItem } from "@/hooks/use-inventory-items";
import { useInventoryItemGroups } from "@/hooks/use-inventory-item-groups";
import type { InventoryItem } from "@/lib/supabase/types";

const inventoryItemFormSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  sku: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  group_id: z.string().optional(),
  is_active: z.boolean().optional(),
  reorder_level: z.string().optional(),
  cost: z.string().optional(),
  selling_price: z.string().optional(),
  tax_rate: z.string().optional(),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemFormSchema>;

function getDefaultValues(initialItem?: InventoryItem | null): InventoryItemFormValues {
  return {
    name: initialItem?.name ?? "",
    sku: initialItem?.sku ?? "",
    description: initialItem?.description ?? "",
    unit: initialItem?.unit ?? "",
    group_id: initialItem?.group_id ?? "",
    is_active: initialItem?.is_active ?? true,
    reorder_level: initialItem?.reorder_level != null ? String(initialItem.reorder_level) : "",
    cost: initialItem?.cost != null ? String(initialItem.cost) : "",
    selling_price: initialItem?.selling_price != null ? String(initialItem.selling_price) : "",
    tax_rate: initialItem?.tax_rate != null ? String(initialItem.tax_rate) : "",
  };
}

type InventoryItemFormProps = {
  orgId: string;
  initialItem?: InventoryItem | null;
};

export function InventoryItemForm({ orgId, initialItem }: InventoryItemFormProps) {
  const router = useRouter();
  const isEdit = !!initialItem?.id;
  const createMutation = useCreateInventoryItem(orgId);
  const updateMutation = useUpdateInventoryItem(orgId, initialItem?.id ?? "");
  const { data: groups } = useInventoryItemGroups(orgId);

  const form = useForm<InventoryItemFormValues>({
    resolver: zodResolver(inventoryItemFormSchema),
    defaultValues: getDefaultValues(initialItem),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      sku: values.sku?.trim() || null,
      description: values.description?.trim() || null,
      unit: values.unit?.trim() || null,
      group_id: values.group_id?.trim() || null,
      is_active: values.is_active ?? true,
      reorder_level: values.reorder_level ? parseInt(values.reorder_level, 10) : null,
      cost: values.cost ? parseFloat(values.cost) : null,
      selling_price: values.selling_price ? parseFloat(values.selling_price) : null,
      tax_rate: values.tax_rate ? parseFloat(values.tax_rate) : null,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync(payload);
        router.push(`/${orgId}/inventory/items`);
      } else {
        await createMutation.mutateAsync(payload);
        router.push(`/${orgId}/inventory/items`);
      }
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="size-3.5" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">
            {isEdit ? "Edit Item" : "New Item"}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Item name"
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                {...form.register("sku")}
                placeholder="Stock keeping unit"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Item description"
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                {...form.register("unit")}
                placeholder="e.g. each, kg, box"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group_id">Item Group</Label>
              <Select
                value={form.watch("group_id") || "none"}
                onValueChange={(v) => form.setValue("group_id", v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(groups ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cost">Cost</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                {...form.register("cost")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selling_price">Selling Price</Label>
              <Input
                id="selling_price"
                type="number"
                step="0.01"
                {...form.register("selling_price")}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                type="number"
                {...form.register("reorder_level")}
                placeholder="Alert when stock falls below"
              />
            </div>
          </div>

          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              <Save className="size-3.5" />
              {isEdit ? "Save" : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
