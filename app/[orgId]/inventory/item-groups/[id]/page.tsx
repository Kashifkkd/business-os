"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryItemGroup } from "@/hooks/use-inventory-item-groups";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateInventoryItemGroup } from "@/hooks/use-inventory-item-groups";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  sort_order: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditItemGroupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: group, isLoading, isError } = useInventoryItemGroup(orgId, id);
  const updateMutation = useUpdateInventoryItemGroup(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: group
      ? {
          name: group.name,
          description: group.description ?? "",
          sort_order: String(group.sort_order),
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      name: values.name,
      description: values.description?.trim() || null,
      sort_order: values.sort_order ? parseInt(values.sort_order, 10) : 0,
    });
    router.push(`/${orgId}/inventory/item-groups`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !group) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/item-groups`);
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
          <h2 className="text-sm font-semibold">Edit Item Group</h2>
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
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input id="sort_order" type="number" {...form.register("sort_order")} />
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
