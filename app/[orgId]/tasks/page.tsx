"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSpaces } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, FolderKanban } from "lucide-react";
import { useState } from "react";
import { useCreateSpace } from "@/hooks/use-tasks";

export default function TasksPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;

  const [newSpaceName, setNewSpaceName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const createSpace = useCreateSpace(orgId);

  const hasSpaces = spaces && spaces.length > 0;
  const firstSpaceId = spaces?.[0]?.id;

  useEffect(() => {
    if (hasSpaces && firstSpaceId) {
      router.replace(`${base}/tasks/list?space_id=${firstSpaceId}`);
    }
  }, [base, firstSpaceId, hasSpaces, router]);

  const handleCreateSpace = async () => {
    const name = newSpaceName.trim();
    if (!name) return;
    try {
      const space = await createSpace.mutateAsync({ name });
      setNewSpaceName("");
      setCreateOpen(false);
      router.replace(`${base}/tasks/list?space_id=${space.id}`);
    } catch {
      // Error feedback can be added with toast
    }
  };

  if (spacesLoading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasSpaces) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-6 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <FolderKanban className="size-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">No projects yet</h2>
            <p className="max-w-sm text-muted-foreground">
              Create a project (space) to start adding tasks and organizing work.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create project
          </Button>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="space-name">Name</Label>
                <Input
                  id="space-name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="e.g. Marketing"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim() || createSpace.isPending}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
