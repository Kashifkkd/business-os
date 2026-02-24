"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check } from "lucide-react";
import { OrgSwitchingOverlay } from "@/components/loaders/org-switching-overlay";
import type { TenantWithRole } from "@/lib/supabase/queries";

interface ProfileOrgSwitcherProps {
  currentOrgId: string;
  currentOrgName: string;
  organizations: TenantWithRole[];
}

export function ProfileOrgSwitcher({
  currentOrgId,
  currentOrgName,
  organizations,
}: ProfileOrgSwitcherProps) {
  const router = useRouter();
  const [switchingToOrgName, setSwitchingToOrgName] = useState<string | null>(null);

  if (organizations.length <= 1) {
    return null;
  }

  const handleSelectOrg = (org: TenantWithRole) => {
    if (org.id === currentOrgId) return;
    setSwitchingToOrgName(org.name);
    router.push(`/${org.id}/settings/profile`);
  };

  return (
    <>
      {switchingToOrgName ? (
        <OrgSwitchingOverlay organizationName={switchingToOrgName} />
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            {currentOrgName}
            <ChevronDown className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSelectOrg(org)}
            >
              {org.name}
              {org.id === currentOrgId ? (
                <Check className="ml-auto size-4" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
