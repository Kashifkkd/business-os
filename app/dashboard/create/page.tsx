"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industry";
import type { IndustryType } from "@/lib/supabase/types";

export default function CreateTenantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState<IndustryType | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!industry) return;
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data: tenantId, error: rpcError } = await supabase.rpc(
      "create_tenant",
      {
        p_industry: industry,
        p_name: name.trim(),
      }
    );
    setLoading(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    if (tenantId) {
      router.push(`/${tenantId}/home`);
      router.refresh();
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
          <CardDescription>
            Add a new organization. URL will use the organization ID (e.g. /:id/home). Industry is stored and can be changed later.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Cafe"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="industry">Industry</Label>
              <SearchCombobox
                id="industry"
                options={INDUSTRY_OPTIONS}
                value={industry}
                onValueChange={(v) => setIndustry(v as IndustryType)}
                placeholder="Search industry…"
                emptyMessage="No industry found."
                className="w-full"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
