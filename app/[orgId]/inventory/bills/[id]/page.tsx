"use client";

import { useParams, useRouter } from "next/navigation";
import { useInventoryBill } from "@/hooks/use-inventory-bills";
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
import { useUpdateInventoryBill } from "@/hooks/use-inventory-bills";
import { Skeleton } from "@/components/ui/skeleton";

const schema = z.object({
  bill_number: z.string().optional(),
  bill_date: z.string().min(1, "Date required"),
  due_date: z.string().optional(),
  currency: z.string().optional(),
  amount: z.coerce.number().min(0, "Amount required"),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditBillPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: bill, isLoading, isError } = useInventoryBill(orgId, id);
  const updateMutation = useUpdateInventoryBill(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: bill
      ? {
          bill_number: bill.bill_number ?? "",
          bill_date: bill.bill_date,
          due_date: bill.due_date ?? "",
          currency: bill.currency ?? "",
          amount: bill.amount,
          status: bill.status,
          notes: bill.notes ?? "",
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
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

  if (!orgId || !id) return null;
  if (isLoading || !bill) return <Skeleton className="h-96 w-full" />;
  if (isError) {
    router.replace(`/${orgId}/inventory/bills`);
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
          <h2 className="text-sm font-semibold">Edit Bill</h2>
          <p className="text-muted-foreground text-xs">Vendor: {bill.vendor_name ?? "—"}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bill_number">Bill number</Label>
                <Input id="bill_number" {...form.register("bill_number")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bill_date">Bill date *</Label>
                <Input id="bill_date" type="date" {...form.register("bill_date")} />
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
