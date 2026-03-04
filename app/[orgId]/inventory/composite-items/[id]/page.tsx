"use client";

import { useParams, useRouter } from "next/navigation";
import { useCompositeItem } from "@/hooks/use-composite-items";
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
import { useUpdateCompositeItem } from "@/hooks/use-composite-items";
import { useInventoryItemsPaginated } from "@/hooks/use-inventory-items";
import { Skeleton } from "@/components/ui/skeleton";

const compSchema = z.object({
  item_id: z.string().min(1, "Item required"),
  quantity: z.coerce.number().min(0.001, "Qty required"),
});

const schema = z.object({
  name: z.string().min(1, "Name required").trim(),
  description: z.string().optional(),
  components: z.array(compSchema).min(1, "Add at least one component"),
});

type FormValues = z.infer<typeof schema>;

export default function EditCompositeItemPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: composite, isLoading, isError } = useCompositeItem(orgId, id);
  const updateMutation = useUpdateCompositeItem(orgId, id);
  const { data: itemsData } = useInventoryItemsPaginated(orgId, { page: 1, pageSize: 200 }, { enabled: !!orgId });

  const compItems = (composite as { components?: { item_id: string; quantity: number }[] })?.components;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: composite
      ? {
          name: composite.name,
          description: composite.description ?? "",
          components:
            compItems && compItems.length > 0
              ? compItems.map((c) => ({ item_id: c.item_id, quantity: c.quantity }))
              : [{ item_id: "", quantity: 1 }],
        }
      : undefined,
  });

  const components = form.watch("components") ?? [];
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
    await updateMutation.mutateAsync({
      name: values.name,
      description: values.description || null,
      components: values.components
        .filter((c) => c.item_id && c.quantity > 0)
        .map((c) => ({ item_id: c.item_id, quantity: c.quantity })),
    });
    router.push(`/${orgId}/inventory/composite-items`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !composite) return <Skeleton className="h-96 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/composite-items`);
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
          <h2 className="text-sm font-semibold">Edit Composite Item</h2>
          <p className="text-muted-foreground text-xs">
            Parent: {(composite as { item_name?: string }).item_name ?? "—"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} />
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
                            {i.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    type="number"
                    step="0.001"
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
