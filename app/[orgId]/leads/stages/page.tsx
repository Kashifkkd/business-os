"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQueryClient } from "@tanstack/react-query";
import { useLeadStages, useUpdateLeadStages } from "@/hooks/use-leads";
import { useOrganization } from "@/hooks/use-organization";
import { useUser } from "@/hooks/use-user";
import { queryKeys } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/table-loading-skeleton";
import { ShowingRange } from "@/components/showing-range";
import { SearchBox } from "@/components/search-box";
import { DateDisplay } from "@/components/date-display";
import { DisplayName } from "@/components/display-name";
import {
  DEFAULT_STAGE_COLOR,
  normalizeStageColor,
} from "@/lib/lead-stages";
import { SOURCE_COLOR_PALETTE } from "@/lib/lead-sources";
import type { LeadStageItem } from "@/lib/lead-stages";
import { ListTree, Plus, Trash2, GripVertical, MoreVertical, RefreshCw, Loader2 } from "lucide-react";

function StageColorSwatch({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-4 w-4 shrink-0 rounded border border-border"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function SortableStageRow({
  stage,
  index,
  onRemove,
  isPending,
  locale,
  timeFormat,
  currentUserId,
}: {
  stage: LeadStageItem;
  index: number;
  onRemove: (index: number) => void;
  isPending: boolean;
  locale?: string;
  timeFormat?: "12h" | "24h";
  currentUserId: string | null;
}) {
  const id = stage.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={`[&_td]:py-1.5 [&_td]:px-3 [&_td]:text-xs ${isDragging ? "opacity-50 bg-muted/50" : ""}`}
    >
      <TableCell className="w-10 p-0">
        <button
          type="button"
          className="flex cursor-grab touch-none items-center justify-center rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-4" />
        </button>
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <StageColorSwatch color={stage.color ?? DEFAULT_STAGE_COLOR} />
          <span>{stage.name}</span>
          {stage.is_default && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              Default
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs w-[120px]">
        <DateDisplay
          value={stage.created_at}
          variant="datetimeWithAgo"
          layout="column"
          timeAgoWithinDays={7}
          locale={locale}
          timeFormat={timeFormat}
        />
      </TableCell>
      <TableCell className="text-muted-foreground w-[120px]">
        <DisplayName
          name={stage.created_by_name?.trim() || "—"}
          avatarUrl={stage.created_by_avatar_url ?? undefined}
          label={
            currentUserId && stage.created_by === currentUserId
              ? "You"
              : !stage.created_by_name?.trim()
                ? "You"
                : undefined
          }
          size="sm"
        />
      </TableCell>
      <TableCell className="w-[80px] text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 data-[state=open]:bg-muted"
              disabled={isPending}
              aria-label="Actions"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onRemove(index)}
              disabled={isPending}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function LeadStagesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogName, setDialogName] = useState("");
  const [dialogColor, setDialogColor] = useState(DEFAULT_STAGE_COLOR);
  const [dialogIsDefault, setDialogIsDefault] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useUser();
  const { organization } = useOrganization(orgId);
  const { data, isLoading, refetch, isRefetching } = useLeadStages(orgId);
  const currentUserId = user?.id ?? null;
  const updateStages = useUpdateLeadStages(orgId);
  const locale = organization?.locale ?? undefined;
  const timeFormat = organization?.time_format ?? undefined;

  const stages = data?.stages ?? [];
  const key = queryKeys.leadStages(orgId);

  const filteredStages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return stages;
    return stages.filter((s) => s.name.toLowerCase().includes(q));
  }, [stages, search]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      sort_order: i,
    }));
    const previous = [...stages];
    queryClient.setQueryData(key, { stages: reordered });
    updateStages.mutate(reordered, {
      onError: () => queryClient.setQueryData(key, { stages: previous }),
    });
  };

  const handleAdd = (name: string, color: string, isDefault: boolean) => {
    const trimmed = name.trim();
    if (!trimmed || updateStages.isPending) return;
    if (stages.some((s) => s.name === trimmed)) return;
    const newStage: LeadStageItem = {
      id: "", // New stage; server assigns id on insert
      name: trimmed,
      color: normalizeStageColor(color),
      sort_order: stages.length,
      is_default: isDefault,
    };
    let next = [...stages.map((s) => ({ ...s })), newStage];
    if (isDefault) {
      next = next.map((s) => ({ ...s, is_default: s.name === trimmed }));
    }
    updateStages.mutate(next, {
      onSuccess: () => {
        setDialogName("");
        setDialogColor(DEFAULT_STAGE_COLOR);
        setDialogIsDefault(false);
        setAddDialogOpen(false);
      },
    });
  };

  const handleAddFromDialog = () => {
    handleAdd(dialogName, dialogColor, dialogIsDefault);
  };

  const openAddDialog = () => {
    setDialogName("");
    setDialogColor(DEFAULT_STAGE_COLOR);
    setDialogIsDefault(false);
    setAddDialogOpen(true);
  };

  const handleRemove = (index: number) => {
    if (updateStages.isPending) return;
    const next = stages.filter((_, i) => i !== index);
    updateStages.mutate(next);
  };

  if (!orgId) return null;

  const from = filteredStages.length === 0 ? 0 : 1;
  const to = filteredStages.length;
  const total = filteredStages.length;

  return (
    <div className="container mx-auto p-4">
      <div>
        <h1 className="text-lg font-semibold">Lead stages</h1>
        <p className="text-muted-foreground text-sm">
          Manage pipeline stages. Drag to reorder. New leads use the default stage.
        </p>
      </div>

      {updateStages.isError && (
        <p className="mb-2 text-sm text-destructive">{updateStages.error?.message}</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ShowingRange
            from={from}
            to={to}
            total={total}
            itemLabel="stages"
            emptyLabel="No stages"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              aria-label="Refresh"
            >
              {isRefetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            </Button>
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search stages..."
              className="w-44"
            />
            <Button type="button" size="sm" onClick={openAddDialog}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="dialog-stage-name">Stage name</Label>
                <Input
                  id="dialog-stage-name"
                  value={dialogName}
                  onChange={(e) => setDialogName(e.target.value)}
                  placeholder="e.g. New, Qualified, Won"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddFromDialog())
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Stage color">
                  {SOURCE_COLOR_PALETTE.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      aria-label={`${label} color`}
                      aria-pressed={normalizeStageColor(dialogColor) === normalizeStageColor(value)}
                      className="h-8 w-8 shrink-0 rounded-full border-2 transition-[transform,border-color] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{
                        backgroundColor: value,
                        borderColor:
                          normalizeStageColor(dialogColor) === normalizeStageColor(value)
                            ? "hsl(var(--foreground))"
                            : "transparent",
                      }}
                      onClick={() => setDialogColor(value)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Label htmlFor="dialog-stage-custom-color" className="text-muted-foreground text-xs shrink-0">
                    Custom
                  </Label>
                  <input
                    id="dialog-stage-custom-color"
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(dialogColor) ? dialogColor : DEFAULT_STAGE_COLOR}
                    onChange={(e) => setDialogColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0"
                    aria-label="Pick custom color"
                  />
                  <Input
                    type="text"
                    placeholder="#000000"
                    value={dialogColor}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        setDialogColor(DEFAULT_STAGE_COLOR);
                        return;
                      }
                      const hex = (raw.startsWith("#") ? raw.slice(1) : raw).slice(0, 6);
                      if (/^[0-9A-Fa-f]*$/.test(hex)) {
                        setDialogColor(hex ? `#${hex}` : DEFAULT_STAGE_COLOR);
                      }
                    }}
                    className="font-mono w-24 h-8 text-xs"
                    aria-label="Custom hex color"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="dialog-stage-default"
                  checked={dialogIsDefault}
                  onCheckedChange={(c) => setDialogIsDefault(c === true)}
                />
                <Label htmlFor="dialog-stage-default" className="text-sm font-normal cursor-pointer">
                  Set as default stage for new leads
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddFromDialog}
                disabled={!dialogName.trim() || updateStages.isPending}
              >
                {updateStages.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading || isRefetching ? (
          <TableLoadingSkeleton rowCount={5} columnCount={5} compact />
        ) : stages.length === 0 ? (
          <EmptyState
            title="No stages yet"
            description="Add pipeline stages like New, Qualified, Won using the Add button above."
            icon={ListTree}
          />
        ) : filteredStages.length === 0 ? (
          <EmptyState
            title="No matching stages"
            description="Try a different search term."
            icon={ListTree}
          />
        ) : (
          <div className="relative flex min-h-[260px] max-h-[520px] flex-1 flex-col overflow-y-auto rounded-md border">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-10 px-3 text-xs" aria-label="Drag handle" />
                    <TableHead className="px-3 text-xs">Stage</TableHead>
                    <TableHead className="w-[120px] px-3 text-xs">Created at</TableHead>
                    <TableHead className="w-[120px] px-3 text-xs">Created by</TableHead>
                    <TableHead className="w-[80px] px-3 text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredStages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredStages.map((stage) => {
                      const globalIndex = stages.findIndex((s) => s.id === stage.id);
                      return (
                        <SortableStageRow
                          key={stage.id}
                          stage={stage}
                          index={globalIndex}
                          onRemove={handleRemove}
                          isPending={updateStages.isPending}
                          locale={locale}
                          timeFormat={timeFormat}
                          currentUserId={currentUserId}
                        />
                      );
                    })}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          </div>
        )}
      </div>
    </div>
  );
}
