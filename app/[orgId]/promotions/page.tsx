import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") notFound();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Promotions</CardTitle>
        <CardDescription>
          Manage promotions and offers. Coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Create and schedule promotions for your cafe.
        </p>
      </CardContent>
    </Card>
  );
}
