"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
const schema = z.object({
  invoice_number: z.string().min(1, "Invoice number is required").trim(),
  invoice_date: z.string().min(1).trim(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      invoice_number: `INV-${Date.now().toString(36).toUpperCase()}`,
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const res = await fetch(`/api/orgs/${orgId}/finance/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        due_date: values.due_date || null,
        notes: values.notes?.trim() || null,
        lines: [{ description: "Line item", quantity: 1, unit_price: 0 }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? "Failed to create invoice");
    }
    const data = await res.json();
    router.push(`/${orgId}/finance/invoices/${data.id}`);
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
          <h2 className="text-sm font-semibold">New invoice</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoice_number">Invoice number *</Label>
              <Input id="invoice_number" {...form.register("invoice_number")} />
              {form.formState.errors.invoice_number && (
                <p className="text-destructive text-xs">{form.formState.errors.invoice_number.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoice_date">Invoice date *</Label>
              <Input id="invoice_date" type="date" {...form.register("invoice_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...form.register("due_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...form.register("notes")} rows={2} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
