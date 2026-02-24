"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";

export default function HomePage() {
  const { user, isLoading } = useUser();
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="flex gap-4">
          <div className="bg-muted h-10 w-24 animate-pulse rounded-md" />
          <div className="bg-muted h-10 w-24 animate-pulse rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <h1 className="text-3xl font-bold">Business OS</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Multi-tenant SaaS for cafe and real estate. Manage your business in one place.
      </p>
      <div className="flex gap-4">
        {user ? (
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        ) : (
          <>
            <Button asChild variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
