import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") notFound();
  return (
    <div className="container mx-auto max-w-5xl p-4">
      <Card>
      <CardHeader>
        <CardTitle>Orders</CardTitle>
        <CardDescription>
          View and manage orders. Workflow coming next.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Track order status and totals. The orders table is ready in the database.
        </p>
      </CardContent>
    </Card>
    </div>
  );
}
