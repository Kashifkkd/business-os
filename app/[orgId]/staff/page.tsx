import { getTenantById } from "@/lib/supabase/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function StaffPage({
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
        <CardTitle>Staff Roster</CardTitle>
        <CardDescription>
          Manage staff and shifts. Coming soon.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Add team members and assign roles and schedules.
        </p>
      </CardContent>
    </Card>
  );
}
