"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useSpaceLists,
  useSpaceStatuses,
  useTasks,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TasksTable } from "../tasks-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function TasksListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";
  const listId = searchParams.get("list_id") ?? "";
  const searchFromUrl = searchParams.get("search") ?? "";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);

  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const { data: lists } = useSpaceLists(orgId, spaceId || undefined);
  const { data: statuses } = useSpaceStatuses(orgId, spaceId || undefined);
  const { data: tasksResult, isLoading: tasksLoading } = useTasks(
    orgId,
    {
      space_id: spaceId,
      list_id: listId || undefined,
      search: debouncedSearch || undefined,
      page: pageFromUrl,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: "updated_at",
      order: "desc",
    },
    { enabled: !!spaceId }
  );
  const deleteTask = useDeleteTask(orgId);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: { space_id?: string; list_id?: string; search?: string; page?: number }) => {
      const next = new URLSearchParams(searchParams.toString());
      if (updates.space_id !== undefined) {
        if (updates.space_id) next.set("space_id", updates.space_id);
        else next.delete("space_id");
        next.delete("list_id");
      }
      if (updates.list_id !== undefined) {
        if (updates.list_id) next.set("list_id", updates.list_id);
        else next.delete("list_id");
      }
      if (updates.search !== undefined) {
        if (updates.search) next.set("search", updates.search);
        else next.delete("search");
        next.set("page", "1");
      }
      if (updates.page !== undefined) {
        if (updates.page > 1) next.set("page", String(updates.page));
        else next.delete("page");
      }
      router.push(`${base}/tasks/list?${next.toString()}`);
    },
    [base, router, searchParams]
  );

  const effectiveSpaceId = spaceId || spaces?.[0]?.id;
  if (effectiveSpaceId && !spaceId) {
    setParams({ space_id: effectiveSpaceId });
    return null;
  }

  if (spacesLoading || !spaces?.length) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={spaceId} onValueChange={(v) => setParams({ space_id: v })}>
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
          <Select
            value={listId || "__all__"}
            onValueChange={(v) => setParams({ list_id: v === "__all__" ? "" : v })}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="List" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All lists</SelectItem>
              {(lists ?? []).map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchBox
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Search tasks..."
            className="min-w-[180px]"
          />
        </div>
        <Button asChild>
          <Link href={`${base}/tasks/new?space_id=${spaceId}`}>
            <Plus className="mr-2 size-4" />
            New task
          </Link>
        </Button>
      </div>

      <TasksTable
        orgId={orgId}
        basePath={base}
        spaceId={spaceId}
        data={tasksResult ?? { items: [], total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE }}
        isLoading={tasksLoading}
        page={pageFromUrl}
        pageSize={DEFAULT_PAGE_SIZE}
        onPageChange={(p) => setParams({ page: p })}
        onDelete={(task) => {
          if (confirm("Delete this task?")) {
            deleteTask.mutate(task.id);
          }
        }}
      />
    </div>
  );
}
