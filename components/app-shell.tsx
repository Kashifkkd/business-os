"use client";

import { useRouter } from "next/navigation";
import { useTenant } from "@/hooks/use-tenant";
import {
  CommandDialog,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { LayoutDashboard, Settings, Utensils, ShoppingBag, Home, UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { ModuleLayout } from "@/components/layout/module-layout";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { tenant } = useTenant();
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);

  const toggleCommand = useCallback(() => setCommandOpen((o) => !o), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!tenant) return null;

  const base = `/${tenant.id}`;
  const homeHref = `/${tenant.id}/home`;

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden">
      <Navbar onSearchClick={toggleCommand} />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <ModuleLayout>{children}</ModuleLayout>
        </main>
      </div>

      <CommandDialog
        open={commandOpen}
        onOpenChange={setCommandOpen}
        title="Search"
        description="Search resources, commands, or settings."
      >
        <Command className="rounded-lg border-0 shadow-none">
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem onSelect={() => router.push(homeHref)}>
                <LayoutDashboard className="mr-2 size-4" />
                Overview
              </CommandItem>
              {tenant.industry === "cafe" && (
                <>
                  <CommandItem onSelect={() => router.push(`${base}/menu/items`)}>
                    <Utensils className="mr-2 size-4" />
                    Menu Items
                  </CommandItem>
                  <CommandItem onSelect={() => router.push(`${base}/menu/categories`)}>
                    <Utensils className="mr-2 size-4" />
                    Categories
                  </CommandItem>
                  <CommandItem onSelect={() => router.push(`${base}/menu/discounts`)}>
                    <Utensils className="mr-2 size-4" />
                    Discounts
                  </CommandItem>
                  <CommandItem onSelect={() => router.push(`${base}/menu/insights`)}>
                    <Utensils className="mr-2 size-4" />
                    Cafe Insights
                  </CommandItem>
                  <CommandItem onSelect={() => router.push(`${base}/orders`)}>
                    <ShoppingBag className="mr-2 size-4" />
                    Order History
                  </CommandItem>
                </>
              )}
              {tenant.industry !== "cafe" && (
                <CommandItem onSelect={() => router.push(`${base}/properties`)}>
                  <Home className="mr-2 size-4" />
                  Properties
                </CommandItem>
              )}
              <CommandItem onSelect={() => router.push(`${base}/settings/profile`)}>
                <UserCircle className="mr-2 size-4" />
                Profile
              </CommandItem>
              <CommandItem onSelect={() => router.push(`${base}/settings`)}>
                <Settings className="mr-2 size-4" />
                Settings
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="General">
              <CommandItem onSelect={() => router.push("/dashboard")}>
                <LayoutDashboard className="mr-2 size-4" />
                Dashboard
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}
