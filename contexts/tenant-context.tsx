"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { IndustryType, TenantRole } from "@/lib/supabase/types";

export interface TenantContextValue {
  tenant: {
    id: string;
    name: string;
    industry: IndustryType;
    role?: TenantRole;
  } | null;
  setTenant: (tenant: TenantContextValue["tenant"]) => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  tenant: initialTenant,
  children,
}: {
  tenant: TenantContextValue["tenant"];
  children: ReactNode;
}) {
  const [tenant, setTenantState] = React.useState(initialTenant);

  const setTenant = useCallback((t: TenantContextValue["tenant"]) => {
    setTenantState(t);
  }, []);

  const value = useMemo<TenantContextValue>(
    () => ({ tenant, setTenant }),
    [tenant, setTenant]
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (ctx === null) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
