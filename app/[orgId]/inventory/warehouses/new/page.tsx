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
import { useCreateWarehouse } from "@/hooks/use-warehouses";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  code: z.string().optional(),
  is_default: z.boolean().optional(),
  address_line_1: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewWarehousePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateWarehouse(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", is_default: false, address_line_1: "", city: "", country: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      name: values.name,
      code: values.code?.trim() || null,
      is_default: values.is_default ?? false,
      address_line_1: values.address_line_1?.trim() || null,
      city: values.city?.trim() || null,
      country: values.country?.trim() || null,
    });
    router.push(`/${orgId}/inventory/warehouses`);
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
          <h2 className="text-sm font-semibold">New Warehouse</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="Warehouse name" />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...form.register("code")} placeholder="e.g. WH-01" />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                {...form.register("is_default")}
                className="rounded"
              />
              <Label htmlFor="is_default">Default warehouse</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address</Label>
              <Input id="address_line_1" {...form.register("address_line_1")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" {...form.register("city")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" {...form.register("country")} />
              </div>
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
