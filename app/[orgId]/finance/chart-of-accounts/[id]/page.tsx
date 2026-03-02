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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFinanceAccount, useUpdateFinanceAccount } from "@/hooks/use-finance-accounts";

const schema = z.object({
  code: z.string().min(1, "Code is required").trim(),
  name: z.string().min(1, "Name is required").trim(),
  type: z.enum(["asset", "liability", "equity", "income", "expense"]),
  subtype: z.string().optional(),
  is_active: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
] as const;

export default function EditAccountPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: account, isLoading } = useFinanceAccount(orgId, id);
  const updateMutation = useUpdateFinanceAccount(orgId, id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: account
      ? {
          code: account.code,
          name: account.name,
          type: account.type as FormValues["type"],
          subtype: account.subtype ?? "",
          is_active: account.is_active,
        }
      : undefined,
    defaultValues: { code: "", name: "", type: "asset", subtype: "", is_active: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    await updateMutation.mutateAsync({
      code: values.code,
      name: values.name,
      type: values.type,
      subtype: values.subtype?.trim() || null,
      is_active: values.is_active,
    });
    router.push(`/${orgId}/finance/chart-of-accounts`);
  });

  if (!orgId || !id) return null;
  if (isLoading) return <div className="container mx-auto max-w-xl p-4">Loading...</div>;
  if (!account) {
    router.replace(`/${orgId}/finance/chart-of-accounts`);
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
          <h2 className="text-sm font-semibold">Edit account</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input id="code" {...form.register("code")} />
              {form.formState.errors.code && (
                <p className="text-destructive text-xs">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as FormValues["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtype">Subtype</Label>
              <Input id="subtype" {...form.register("subtype")} />
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
