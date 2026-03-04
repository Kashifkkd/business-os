"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateInventoryBill } from "@/hooks/use-inventory-bills";
import { useVendors } from "@/hooks/use-vendors";

const schema = z.object({
  vendor_id: z.string().min(1, "Vendor required"),
  bill_number: z.string().optional(),
  bill_date: z.string().min(1, "Date required"),
  due_date: z.string().optional(),
  currency: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount required"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewBillPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const createMutation = useCreateInventoryBill(orgId);
  const { data: vendors } = useVendors(orgId);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendor_id: "",
      bill_number: "",
      bill_date: new Date().toISOString().slice(0, 10),
      due_date: "",
      currency: "",
      amount: 0,
      status: "open",
      notes: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await createMutation.mutateAsync({
      vendor_id: values.vendor_id,
      bill_number: values.bill_number || null,
      bill_date: values.bill_date,
      due_date: values.due_date || null,
      currency: values.currency || null,
      amount: values.amount,
      status: values.status || "open",
      notes: values.notes || null,
    });
    router.push(`/${orgId}/inventory/bills`);
  });

  if (!orgId) return null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-auto">
      <ScrollArea className="flex-1">
        <div className="mx-auto w-full max-w-6xl space-y-4 px-2 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-row items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/${orgId}/inventory/bills`} className="gap-1.5">
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
              <h1 className="text-md font-semibold tracking-tight text-foreground">
                New vendor bill
              </h1>
            </div>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-sm font-semibold text-foreground">Bill details</h2>
            </CardHeader>
            <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Vendor *</Label>
              <Select
                value={form.watch("vendor_id")}
                onValueChange={(v) => form.setValue("vendor_id", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {(vendors ?? []).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vendor_id && (
                <p className="text-destructive text-xs">{form.formState.errors.vendor_id.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_number">Bill number</Label>
                <Input id="bill_number" {...form.register("bill_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill_date">Bill date *</Label>
                <Input id="bill_date" type="date" {...form.register("bill_date")} />
                {form.formState.errors.bill_date && (
                  <p className="text-destructive text-xs">{form.formState.errors.bill_date.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" type="date" {...form.register("due_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input id="amount" type="number" step="0.01" {...form.register("amount")} />
                {form.formState.errors.amount && (
                  <p className="text-destructive text-xs">{form.formState.errors.amount.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
      </ScrollArea>
    </div>
  );
}
