import type { createClient } from "@/lib/supabase/server";

export const ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LOGIN: "login",
} as const;

export const ENTITY_TYPES = {
  LEAD: "lead",
  LEAD_SOURCE: "lead_source",
  MENU_ITEM: "menu_item",
  EMPLOYEE: "employee",
  DEPARTMENT: "department",
  DESIGNATION: "designation",
} as const;

export type ActivityLogAction = (typeof ACTIONS)[keyof typeof ACTIONS];
export type ActivityLogEntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export type CreateActivityLogPayload = {
  tenantId: string;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function createActivityLog(
  client: SupabaseClient,
  payload: CreateActivityLogPayload
): Promise<void> {
  const { tenantId, userId, action, resourceType, resourceId, description, metadata = {} } = payload;
  await client.from("activity_logs").insert({
    tenant_id: tenantId,
    user_id: userId ?? null,
    action,
    entity_type: resourceType,
    entity_id: resourceId ?? null,
    description,
    metadata,
  });
}
