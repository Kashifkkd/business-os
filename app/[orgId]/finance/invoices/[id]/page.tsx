"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFinanceInvoice, usePostFinanceInvoice } from "@/hooks/use-finance-invoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

export default function FinanceInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;
  const { data: invoice, isLoading } = useFinanceInvoice(orgId, id);
  const postMutation = usePostFinanceInvoice(orgId);

  if (!orgId || !id) return null;
  if (isLoading) return <div className="container mx-auto max-w-3xl p-4">Loading...</div>;
  if (!invoice) {
    router.replace(`/${orgId}/finance/invoices`);
    return null;
  }

  const lines = (invoice.lines as Array<{ description: string; quantity: number; unit_price: number; line_total: number }>) ?? [];
  const canPost = invoice.status === "draft";

  const handlePost = () => {
    postMutation.mutate(id, {
      onSuccess: () => {},
      onError: (e) => alert(e.message),
    });
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
            <h2 className="text-sm font-semibold">Invoice {invoice.invoice_number as string}</h2>
            <Badge variant="secondary" className="mt-1">{invoice.status as string}</Badge>
          </div>
          {canPost && (
            <Button size="sm" onClick={handlePost} disabled={postMutation.isPending}>
              Post to ledger
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{invoice.invoice_date as string}</span>
            <span className="text-muted-foreground">Due date</span>
            <span>{invoice.due_date as string ?? "—"}</span>
            <span className="text-muted-foreground">Currency</span>
            <span>{invoice.currency as string}</span>
            <span className="text-muted-foreground">Total</span>
            <span>{(invoice.total as number).toLocaleString()}</span>
            <span className="text-muted-foreground">Balance</span>
            <span>{(invoice.balance as number).toLocaleString()}</span>
          </div>
          {invoice.notes ? (
            <p className="text-muted-foreground text-sm">{String(invoice.notes)}</p>
          ) : null}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, i) => (
                  <TableRow key={i}>
                    <TableCell>{line.description}</TableCell>
                    <TableCell className="text-right">{line.quantity}</TableCell>
                    <TableCell className="text-right">{Number(line.unit_price).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{Number(line.line_total).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
