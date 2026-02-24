import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function TableLayoutPage({
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
        <CardTitle>Table Layout</CardTitle>
        <CardDescription>
          Configure tables and seating. Coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Define table layout for your venue.
        </p>
      </CardContent>
    </Card>
  );
}
