"use client";

import { useParams, useRouter } from "next/navigation";
import { useVendor } from "@/hooks/use-vendors";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateVendor } from "@/hooks/use-vendors";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: vendor, isLoading, isError } = useVendor(orgId, id);
  const updateMutation = useUpdateVendor(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: vendor
      ? {
          name: vendor.name,
          email: vendor.email ?? "",
          phone: vendor.phone ?? "",
          address_line_1: vendor.address_line_1 ?? "",
          payment_terms: vendor.payment_terms ?? "",
          notes: vendor.notes ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      name: values.name,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      address_line_1: values.address_line_1?.trim() || null,
      payment_terms: values.payment_terms?.trim() || null,
      notes: values.notes?.trim() || null,
    });
    router.push(`/${orgId}/inventory/vendors`);
  });

  if (!orgId || !id) return null;
  if (isLoading || !vendor) return <Skeleton className="h-64 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/vendors`);
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
          <h2 className="text-sm font-semibold">Edit Vendor</h2>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...form.register("email")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...form.register("phone")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address_line_1">Address</Label>
              <Input id="address_line_1" {...form.register("address_line_1")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_terms">Payment Terms</Label>
              <Input id="payment_terms" {...form.register("payment_terms")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} rows={2} />
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
