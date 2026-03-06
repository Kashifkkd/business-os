import Link from "next/link";
import { Button } from "@/components/ui/button";

type LeadDetailNotFoundProps = {
  orgId: string;
};

export function LeadDetailNotFound({ orgId }: LeadDetailNotFoundProps) {
  return (
    <div className="flex h-full w-full flex-col p-6">
      <p className="text-destructive text-sm">Lead not found.</p>
      <Button variant="link" asChild className="mt-2 p-0">
        <Link href={`/${orgId}/leads`}>Back to leads</Link>
      </Button>
    </div>
  );
}
