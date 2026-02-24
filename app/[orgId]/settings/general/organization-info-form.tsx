"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchCombobox } from "@/components/ui/search-combobox";
import { INDUSTRY_OPTIONS } from "@/lib/constants/industry";
import { useOrganization } from "@/hooks/use-organization";
import type { IndustryType } from "@/lib/supabase/types";

interface OrganizationInfoFormProps {
  orgId: string;
  initialName: string;
  initialIndustry: IndustryType;
}

export function OrganizationInfoForm({
  orgId,
  initialName,
  initialIndustry,
}: OrganizationInfoFormProps) {
  const { updateOrg } = useOrganization(orgId);
  const [name, setName] = useState(initialName);
  const [industry, setIndustry] = useState<IndustryType>(initialIndustry);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await updateOrg.mutateAsync({ name, industry });
      setMessage({ type: "success", text: "Organization details saved." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save." });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Organization Info</CardTitle>
          <CardDescription>
            Basic details for this organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-industry">Industry</Label>
            <SearchCombobox
              id="org-industry"
              options={INDUSTRY_OPTIONS}
              value={industry}
              onValueChange={(v) => setIndustry(v as IndustryType)}
              placeholder="Search industry…"
              emptyMessage="No industry found."
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label>Organization ID</Label>
            <p className="font-mono text-muted-foreground text-xs">{orgId}</p>
          </div>
          {message && (
            <p
              className={
                message.type === "success"
                  ? "text-muted-foreground text-sm"
                  : "text-destructive text-sm"
              }
            >
              {message.text}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={updateOrg.isPending}>
            {updateOrg.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
