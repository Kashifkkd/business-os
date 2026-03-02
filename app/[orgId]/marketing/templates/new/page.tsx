"use client";

import { useParams, useSearchParams } from "next/navigation";
import { TemplateForm } from "../template-form";
import type { MarketingTemplate } from "@/lib/supabase/types";

export default function NewTemplatePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orgId = params?.orgId as string;
  const channelParam = searchParams.get("channel") ?? "email";
  const channel = ["email", "sms", "whatsapp", "social"].includes(channelParam)
    ? channelParam
    : "email";

  if (!orgId) return null;

  const initialTemplate: MarketingTemplate = {
    id: "",
    tenant_id: orgId,
    name: "",
    description: null,
    channel: channel as MarketingTemplate["channel"],
    subject: null,
    body: "",
    variables: [],
    is_active: true,
    created_at: "",
    updated_at: "",
  };

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <TemplateForm orgId={orgId} initialTemplate={initialTemplate} />
    </div>
  );
}
