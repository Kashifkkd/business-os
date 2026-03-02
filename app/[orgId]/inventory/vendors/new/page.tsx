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
import { useCreateVendor } from "@/hooks/use-vendors";

const schema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address_line_1: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewVendorPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateVendor(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", address_line_1: "", payment_terms: "", notes: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      name: values.name,
      email: values.email?.trim() || null,
      phone: values.phone?.trim() || null,
      address_line_1: values.address_line_1?.trim() || null,
      payment_terms: values.payment_terms?.trim() || null,
      notes: values.notes?.trim() || null,
    });
    router.push(`/${orgId}/inventory/vendors`);
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
          <h2 className="text-sm font-semibold">New Vendor</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} placeholder="Vendor name" />
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
              <Input id="payment_terms" {...form.register("payment_terms")} placeholder="e.g. Net 30" />
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
  );
}
