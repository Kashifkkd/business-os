import Link from "next/link";
import { notFound } from "next/navigation";
import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone } from "lucide-react";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant || tenant.industry !== "cafe") notFound();

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Promotions</CardTitle>
          <CardDescription>
            Create and schedule promotions for your cafe. Promotions are run as Marketing campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use the Marketing module to create campaigns, target segments, and schedule offers.
            Promotions (e.g. happy hour, seasonal discounts) are managed there.
          </p>
          <Button asChild>
            <Link href={`/${tenant.id}/marketing/campaigns`}>
              <Megaphone className="mr-2 size-4" />
              Open Marketing campaigns
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
