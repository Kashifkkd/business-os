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
import { useCreateCompositeItem } from "@/hooks/use-composite-items";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";

const compSchema = z.object({
  item_id: z.string().min(1, "Item required"),
  quantity: z.coerce.number().min(0.001, "Qty required"),
});

const schema = z.object({
  inventory_item_id: z.string().min(1, "Parent item required"),
  name: z.string().min(1, "Name required").trim(),
  description: z.string().optional(),
  components: z.array(compSchema).min(1, "Add at least one component"),
});

type FormValues = z.infer<typeof schema>;

export default function NewCompositeItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateCompositeItem(orgId);
  const { data: itemsData } = useInventoryItemsPaginated(orgId, { page: 1, pageSize: 200 }, { enabled: !!orgId });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      inventory_item_id: "",
      name: "",
      description: "",
      components: [{ item_id: "", quantity: 1 }],
    },
  });

  const components = form.watch("components");
  const items = itemsData?.items ?? [];

  const addComponent = () => {
    form.setValue("components", [...components, { item_id: "", quantity: 1 }]);
  };
  const removeComponent = (idx: number) => {
    if (components.length <= 1) return;
    form.setValue(
      "components",
      components.filter((_, i) => i !== idx)
    );
  };

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      inventory_item_id: values.inventory_item_id,
      name: values.name,
      description: values.description || null,
      components: values.components
        .filter((c) => c.item_id && c.quantity > 0)
        .map((c) => ({ item_id: c.item_id, quantity: c.quantity })),
    });
    router.push(`/${orgId}/inventory/composite-items`);
  });

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${orgId}/inventory/composite-items`} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-md font-semibold tracking-tight text-foreground">
                New composite item
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">Composite item details</h2>
            </CardHeader>
            <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Parent inventory item *</Label>
              <Select
                value={form.watch("inventory_item_id")}
                onValueChange={(v) => form.setValue("inventory_item_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select item (kit/bundle)" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} {i.sku ? `(${i.sku})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.inventory_item_id && (
                <p className="text-destructive text-xs">{form.formState.errors.inventory_item_id.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="e.g. Starter Kit" />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register("description")} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Components *</Label>
                <Button type="button" variant="outline" size="sm" onClick={addComponent}>
                  <Plus className="size-3" />
                  Add
                </Button>
              </div>
              {components.map((_, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1 min-w-0">
                    <Select
                      value={form.watch(`components.${idx}.item_id`)}
                      onValueChange={(v) => form.setValue(`components.${idx}.item_id`, v)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {items.map((i) => (
                          <SelectItem key={i.id} value={i.id}>
                            {i.name} ×
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
                    {...form.register(`components.${idx}.quantity`)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeComponent(idx)}
                    disabled={components.length <= 1}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              {form.formState.errors.components?.root && (
                <p className="text-destructive text-xs">{form.formState.errors.components.root.message}</p>
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
