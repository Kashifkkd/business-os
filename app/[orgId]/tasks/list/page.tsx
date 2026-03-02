"use client";

import { useParams, useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  useSpaces,
  useSpaceLists,
  useTasks,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { useOrganization } from "@/hooks/use-organization";
import { useUser } from "@/hooks/use-user";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TasksTable } from "../tasks-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, User } from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

export default function TasksListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const orgId = params?.orgId as string;
  const base = `/${orgId}`;
  const spaceId = searchParams.get("space_id") ?? "";
  const listId = searchParams.get("list_id") ?? "";
  const searchFromUrl = searchParams.get("search") ?? "";
  const assigneeIdFromUrl = searchParams.get("assignee_id") ?? "";
  const sortByFromUrl = searchParams.get("sortBy")?.trim() || "updated_at";
  const orderFromUrl = (searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc";
  const pageFromUrl = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);

  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: string; title: string } | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);

  const { user } = useUser();
  const { orgMembers } = useOrganization(orgId, { enabled: !!orgId });
  const { data: spaces, isLoading: spacesLoading } = useSpaces(orgId);
  const { data: lists } = useSpaceLists(orgId, spaceId || undefined);
  const { data: tasksResult, isLoading: tasksLoading } = useTasks(
    orgId,
    {
      space_id: spaceId,
      list_id: listId || undefined,
      assignee_id: assigneeIdFromUrl || undefined,
      search: debouncedSearch || undefined,
      page: pageFromUrl,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: sortByFromUrl,
      order: orderFromUrl,
      enrich: "assignees,labels",
    },
    { enabled: !!spaceId }
  );
  const deleteTask = useDeleteTask(orgId);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  const setParams = useCallback(
    (updates: {
      space_id?: string;
      list_id?: string;
      search?: string;
      page?: number;
      assignee_id?: string;
      sortBy?: string;
      order?: "asc" | "desc";
    }) => {
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
      if (updates.assignee_id !== undefined) {
        if (updates.assignee_id) next.set("assignee_id", updates.assignee_id);
        else next.delete("assignee_id");
        next.set("page", "1");
      }
      if (updates.sortBy !== undefined) {
        if (updates.sortBy && updates.sortBy !== "updated_at") next.set("sortBy", updates.sortBy);
        else next.delete("sortBy");
      }
      if (updates.order !== undefined) {
        if (updates.order === "asc") next.set("order", "asc");
        else next.delete("order");
      }
      router.push(`${base}/tasks/list?${next.toString()}`);
    },
    [base, router, searchParams]
  );

  const setParamsRef = useRef(setParams);
  useEffect(() => {
    setParamsRef.current = setParams;
  }, [setParams]);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed === searchFromUrl.trim()) return;
    setParamsRef.current({ search: trimmed, page: 1 });
  }, [debouncedSearch, searchFromUrl]);

  const effectiveSpaceId = spaceId || spaces?.[0]?.id;
  if (effectiveSpaceId && !spaceId) {
    setParams({ space_id: effectiveSpaceId });
    return null;
  }

  const handleDeleteClick = (task: { id: string; title: string }) => {
    setTaskToDelete(task);
    setBulkDeleteIds([]);
    setDeleteConfirmOpen(true);
  };

  const handleBulkDelete = (ids: string[]) => {
    setTaskToDelete(null);
    setBulkDeleteIds(ids);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (bulkDeleteIds.length > 0) {
      bulkDeleteIds.forEach((id) => deleteTask.mutate(id));
      setBulkDeleteIds([]);
    } else if (taskToDelete) {
      deleteTask.mutate(taskToDelete.id);
      setTaskToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const membersForTable = (orgMembers ?? []).map((m) => ({
    user_id: m.user_id,
    first_name: m.first_name,
    last_name: m.last_name,
    avatar_url: null,
  }));

  const searchParamsForTable: Record<string, string> = {
    space_id: spaceId,
    ...(listId && { list_id: listId }),
    ...(searchFromUrl && { search: searchFromUrl }),
    ...(assigneeIdFromUrl && { assignee_id: assigneeIdFromUrl }),
    ...(sortByFromUrl !== "updated_at" && { sortBy: sortByFromUrl }),
    ...(orderFromUrl === "asc" && { order: "asc" }),
  };

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
          {user?.id && (
            <Button
              variant={assigneeIdFromUrl === user.id ? "secondary" : "outline"}
              size="sm"
              onClick={() =>
                setParams({
                  assignee_id: assigneeIdFromUrl === user.id ? "" : user.id,
                  page: 1,
                })
              }
            >
              <User className="mr-2 size-4" />
              My tasks
            </Button>
          )}
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
        searchParams={searchParamsForTable}
        members={membersForTable}
        sortBy={sortByFromUrl}
        order={orderFromUrl}
        onSortChange={(sortBy, order) => setParams({ sortBy, order, page: 1 })}
        onDelete={(task) => handleDeleteClick({ id: task.id, title: task.title })}
        onBulkDelete={(ids) => handleBulkDelete(ids)}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkDeleteIds.length > 0
                ? `Delete ${bulkDeleteIds.length} task${bulkDeleteIds.length !== 1 ? "s" : ""}?`
                : "Delete task"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkDeleteIds.length > 0
                ? "This action cannot be undone. The selected tasks will be permanently deleted."
                : `This action cannot be undone. This will permanently delete "${taskToDelete?.title}".`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
