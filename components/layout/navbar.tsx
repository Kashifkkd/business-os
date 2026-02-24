"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import { cn } from "@/lib/utils";
import { OrgSwitchingOverlay } from "@/components/loaders/org-switching-overlay";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Search,
  Bell,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { TenantWithRole } from "@/lib/supabase/queries";
import { useUser } from "@/hooks/use-user";
import { useOrganizations } from "@/hooks/use-organizations";

type NavbarProps = {
  onSearchClick: () => void;
};

export function Navbar({ onSearchClick }: NavbarProps) {
  const { tenant } = useTenant();
  const { user } = useUser();
  const { data: organizationsData } = useOrganizations();
  const organizations = organizationsData ?? [];
  const router = useRouter();
  const [switchingToOrgName, setSwitchingToOrgName] = useState<string | null>(null);

  if (!tenant) return null;

  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  const handleOrgChange = (
    selected: { id: string; name: string } | null,
  ) => {
    if (selected && selected.id !== tenant.id) {
      setSwitchingToOrgName(selected.name);
      router.push(`/${selected.id}/home`);
    }
  };

  return (
    <>
      {switchingToOrgName ? (
        <OrgSwitchingOverlay organizationName={switchingToOrgName} />
      ) : null}
      <header className="flex p-2 w-full shrink-0 items-center gap-4 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
        {/* Left: logo */}
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-sidebar-foreground hover:text-sidebar-foreground/90"
          >
            <span
              className="flex size-6 items-center justify-center rounded bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground"
              aria-hidden
            >
              B
            </span>
            <span className="hidden text-sm sm:inline">BUSINESSOS</span>
          </Link>
        </div>

        {/* Center: search */}
        <div className="flex flex-1 items-center justify-center">
          <Button
            variant="outline"
            className={cn(
              "border-sidebar-border bg-sidebar text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground max-w-md w-full justify-start gap-2 font-normal"
            )}
            onClick={onSearchClick}
          >
            <Search className="size-4 shrink-0" />
            <span className="hidden truncate sm:inline-flex">
              Search resources, commands, or settings...
            </span>
            <Kbd className="ml-auto hidden shrink-0 sm:inline-flex">⌘K</Kbd>
          </Button>
        </div>

        {/* Right: theme, notifications, org combobox, user */}
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </Button>

          <Combobox
            items={organizations}
            value={tenant}
            onValueChange={handleOrgChange}
            isItemEqualToValue={(a, b) => a?.id === b?.id}
            itemToStringLabel={(t) => (t as { name: string }).name}
          >
            <ComboboxInput
              placeholder="Select organization"
              className="border-sidebar-border bg-sidebar text-sidebar-foreground placeholder:text-sidebar-foreground/60 w-full min-w-[10rem] max-w-[12rem]"
            />
            <ComboboxContent align="end" className="min-w-[var(--anchor-width)]">
              <ComboboxEmpty>No organizations</ComboboxEmpty>
              <ComboboxList>
                {(t: TenantWithRole) => (
                  <ComboboxItem key={t.id} value={t}>
                    {t.name}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                aria-label="User menu"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col truncate">
                  <span className="text-sm font-medium">Account</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "Signed in"}
                  </span>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${tenant.id}/profile`} className="flex cursor-pointer items-center gap-2">
                  <User className="size-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/${tenant.id}/settings`} className="flex cursor-pointer items-center gap-2">
                  <Settings className="size-4" />
                  Organization settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  await createClient().auth.signOut();
                  router.refresh();
                  router.push("/login");
                }}
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  );
}
