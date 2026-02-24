"use client";

import { useParams } from "next/navigation";
import { useOrganization } from "@/hooks/use-organization";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SettingsPageSkeleton } from "../settings-page-skeleton";
function memberDisplayName(m: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}) {
  const name = [m.first_name, m.last_name].filter(Boolean).join(" ");
  return name || m.email || "—";
}

export default function MembersSettingsPage() {
  const params = useParams();
  const orgId = params?.orgId as string | undefined;
  const {
    organization: org,
    orgMembers: members = [],
    isLoadingOrganization: orgLoading,
    isLoadingOrgMembers: membersLoading,
    error: orgError,
  } = useOrganization(orgId);
  const isLoading = orgLoading || membersLoading;
  const error = orgError;

  if (isLoading) return <SettingsPageSkeleton variant="table" />;
  if (error) {
    return (
      <div className="space-y-6">
        <p className="text-destructive text-sm">{error.message}</p>
      </div>
    );
  }
  if (!org) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">Organization not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-muted-foreground text-sm">
          People who have access to this organization.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
          <CardDescription>
            View members and their roles. Invite and manage access from here (invite flow coming soon).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground text-center">
                    No members found.
                  </TableCell>
                </TableRow>
              ) : (
                members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {memberDisplayName(m)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {m.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
