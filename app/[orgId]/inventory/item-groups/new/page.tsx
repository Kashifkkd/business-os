"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInventoryItemGroup } from "@/hooks/use-inventory-item-groups";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  description: z.string().optional(),
  sort_order: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewItemGroupPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateInventoryItemGroup(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", sort_order: "0" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      name: values.name,
      description: values.description?.trim() || null,
      sort_order: values.sort_order ? parseInt(values.sort_order, 10) : 0,
    });
    router.push(`/${orgId}/inventory/item-groups`);
  });

  if (!orgId) return null;

  return (
    <div className="container mx-auto max-w-xl p-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="size-3.5" />
        Back
      </Button>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">New Item Group</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="Group name" />
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
  );
}
