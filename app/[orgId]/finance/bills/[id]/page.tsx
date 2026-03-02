"use client";

import { useParams, useRouter } from "next/navigation";
import { useFinanceBill, usePostFinanceBill } from "@/hooks/use-finance-bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function FinanceBillDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: bill, isLoading } = useFinanceBill(orgId, id);
  const postMutation = usePostFinanceBill(orgId);

  if (!orgId || !id) return null;
  if (isLoading) return <div className="container mx-auto max-w-3xl p-4">Loading...</div>;
  if (!bill) {
    router.replace(`/${orgId}/finance/bills`);
    return null;
  }

  const canPost = (bill.status as string) === "open";

  const handlePost = () => {
    postMutation.mutate(id, { onError: (e) => alert(e.message) });
  };

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Button type="button" variant="ghost" size="sm" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="size-3.5" />
        Back
      </Button>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Bill {(bill.bill_number as string) ?? id.slice(0, 8)}</h2>
            <Badge variant="secondary" className="mt-1">{bill.status as string}</Badge>
          </div>
          {canPost && (
            <Button size="sm" onClick={handlePost} disabled={postMutation.isPending}>
              Post to ledger
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Vendor</span>
            <span>{bill.vendor_name as string ?? "—"}</span>
            <span className="text-muted-foreground">Date</span>
            <span>{bill.bill_date as string}</span>
            <span className="text-muted-foreground">Due date</span>
            <span>{(bill.due_date as string) ?? "—"}</span>
            <span className="text-muted-foreground">Amount</span>
            <span>{(bill.amount as number).toLocaleString()} {bill.currency as string}</span>
          </div>
          {(bill.lines as unknown[])?.length > 0 && (
            <div className="text-muted-foreground text-sm">
              {(bill.lines as unknown[]).length} line(s)
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
