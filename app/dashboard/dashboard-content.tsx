"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useOrganization } from "@/hooks/use-organization";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardContent() {
  const { organizations: orgs, isLoading, error } = useOrganization(undefined);

  return (
    <div className="container mx-auto max-w-4xl space-y-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button asChild>
          <Link href="/dashboard/create">
            <Plus className="size-4" />
            Create organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your organizations</CardTitle>
          <CardDescription>
            Select an organization to manage, or create a new one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-3/4 rounded-lg" />
            </div>
          ) : error ? (
            <p className="text-destructive text-sm">{error.message}</p>
          ) : !orgs?.length ? (
            <p className="text-muted-foreground text-sm">
              You don’t have any organizations yet. Create one to get started.
            </p>
          ) : (
            <ul className="space-y-2">
              {orgs.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${t.id}/home`}
                    className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-muted-foreground text-sm">{t.role}</p>
                    </div>
                    <span className="text-muted-foreground text-sm font-mono">
                      /{t.id}/home
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
