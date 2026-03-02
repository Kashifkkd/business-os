"use client";

import { useParams, useRouter } from "next/navigation";
import { useMarketingTemplate } from "@/hooks/use-marketing";
import { TemplateForm } from "../template-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const id = params?.id as string;

  const { data: template, isLoading, isError } = useMarketingTemplate(orgId, id);

  if (!orgId || !id) return null;

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !template) {
    router.replace(`/${orgId}/marketing/templates`);
    return null;
  }

  return (
    <div className="h-full w-full min-h-0 flex flex-col">
      <TemplateForm orgId={orgId} initialTemplate={template} key={template.id} />
    </div>
  );
}
