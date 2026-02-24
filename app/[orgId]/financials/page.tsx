import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function FinancialsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const tenant = await getTenantById(orgId);
  if (!tenant) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financials</CardTitle>
        <CardDescription>
          Revenue, expenses, and reports. Coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          View financial summaries and export reports.
        </p>
      </CardContent>
    </Card>
  );
}
