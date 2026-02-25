"use client";

import { useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSpaces } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table2 } from "lucide-react";

export default function TasksTablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";

  const { data: spaces } = useSpaces(orgId);
  const effectiveSpaceId = spaces?.[0]?.id;

  useEffect(() => {
    if (effectiveSpaceId && !spaceId) {
      const next = new URLSearchParams(searchParams.toString());
      next.set("space_id", effectiveSpaceId);
      router.replace(`${base}/tasks/table?${next.toString()}`);
    }
  }, [base, effectiveSpaceId, spaceId, router, searchParams]);

  const setSpace = (id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set("space_id", id);
    else next.delete("space_id");
    router.push(`${base}/tasks/table?${next.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        {spaces && spaces.length > 0 && (
          <Select value={(spaceId || effectiveSpaceId) ?? ""} onValueChange={setSpace}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-16 text-center">
        <div className="rounded-full bg-muted p-4">
          <Table2 className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Table view</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Spreadsheet-style view with custom columns. Coming soon.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`${base}/tasks/list?space_id=${spaceId || ""}`}>
            View as list
          </Link>
        </Button>
      </div>
    </div>
  );
}
