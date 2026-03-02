"use client";

import { useParams, useRouter } from "next/navigation";
import { useFinanceBankAccount } from "@/hooks/use-finance-bank-accounts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function FinanceBankAccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: account, isLoading } = useFinanceBankAccount(orgId, id);

  if (!orgId || !id) return null;
  if (isLoading) return <div className="container mx-auto max-w-2xl p-4">Loading...</div>;
  if (!account) {
    router.replace(`/${orgId}/finance/banking`);
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
          <h2 className="text-sm font-semibold">{account.name as string}</h2>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Institution</span>
          <span>{(account.institution as string) ?? "—"}</span>
          <span className="text-muted-foreground">Account number</span>
          <span>{(account.account_number_masked as string) ?? "—"}</span>
          <span className="text-muted-foreground">Currency</span>
          <span>{account.currency as string}</span>
          <span className="text-muted-foreground">Opening balance</span>
          <span>{(account.opening_balance as number).toLocaleString()}</span>
        </CardContent>
      </Card>
    </div>
  );
}
