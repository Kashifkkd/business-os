"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { TenantWithRole } from "@/lib/supabase/queries";

export interface AppUser {
  id: string;
  email?: string;
}

export interface AppContextValue {
  user: AppUser | null;
  organizations: TenantWithRole[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  user,
  organizations,
  children,
}: {
  user: AppUser | null;
  organizations: TenantWithRole[];
  children: ReactNode;
}) {
  const value = useMemo<AppContextValue>(
    () => ({ user, organizations }),
    [user, organizations]
  );

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (ctx === null) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return ctx;
}

export function useAppContextOptional(): AppContextValue | null {
  return useContext(AppContext);
}
