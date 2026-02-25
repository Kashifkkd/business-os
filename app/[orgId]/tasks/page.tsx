"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSpaces, useCreateSpace } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { ListTodo, Plus, FolderKanban } from "lucide-react";

export default function TasksPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";

  const [newSpaceName, setNewSpaceName] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const createSpace = useCreateSpace(orgId);

  const setSpace = (id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (id) next.set("space_id", id);
    else next.delete("space_id");
    router.push(`${base}/tasks?${next.toString()}`);
  };

  const handleCreateSpace = async () => {
    const name = newSpaceName.trim();
    if (!name) return;
    try {
      const space = await createSpace.mutateAsync({ name });
      setNewSpaceName("");
      setCreateOpen(false);
      setSpace(space.id);
    } catch {
      // error toast could go here
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

  const hasSpaces = spaces && spaces.length > 0;
  const selectedSpace = hasSpaces && spaceId ? spaces.find((s) => s.id === spaceId) : spaces?.[0];
  const effectiveSpaceId = spaceId || selectedSpace?.id;

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

  if (!effectiveSpaceId) {
    setSpace(spaces![0].id);
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Select
            value={effectiveSpaceId}
            onValueChange={(v) => setSpace(v)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {spaces!.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/tasks/list?space_id=${effectiveSpaceId}`}>
              <ListTodo className="mr-2 size-4" />
              List
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${base}/tasks/board?space_id=${effectiveSpaceId}`}>
              Board
            </Link>
          </Button>
        </div>
        <Button asChild>
          <Link href={`${base}/tasks/new?space_id=${effectiveSpaceId}`}>
            <Plus className="mr-2 size-4" />
            New task
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Select a view above or go to <Link href={`${base}/tasks/list?space_id=${effectiveSpaceId}`} className="underline">List</Link> or{" "}
        <Link href={`${base}/tasks/board?space_id=${effectiveSpaceId}`} className="underline">Board</Link>.
      </p>
    </div>
  );
}
