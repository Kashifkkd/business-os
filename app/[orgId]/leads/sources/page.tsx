"use client";

import { useState } from "react";
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
import { useLeadSources, useUpdateLeadSources } from "@/hooks/use-leads";
import { useOrganization } from "@/hooks/use-organization";
import { queryKeys } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { SourceChip } from "@/components/source-chip";
import { CreatedByDisplay } from "@/components/created-by-display";
import { DateDisplay } from "@/components/date-display";
import {
  DEFAULT_SOURCE_COLOR,
  normalizeSourceColor,
  SOURCE_COLOR_PALETTE,
} from "@/lib/lead-sources";
import type { LeadSourceItem } from "@/lib/lead-sources";
import { Tag, Plus, Trash2, GripVertical, MoreVertical } from "lucide-react";

function SortableSourceRow({
  source,
  index,
  onRemove,
  isPending,
  locale,
  timeFormat,
}: {
  source: LeadSourceItem;
  index: number;
  onRemove: (index: number) => void;
  isPending: boolean;
  locale?: string;
  timeFormat?: "12h" | "24h";
}) {
  const id = source.id ?? source.name;
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
        <SourceChip source={source.name} color={source.color} />
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        <DateDisplay
          value={source.created_at}
          variant="datetimeWithAgo"
          layout="column"
          timeAgoWithinDays={7}
          locale={locale}
          timeFormat={timeFormat}
        />
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        <CreatedByDisplay creator={source.created_by} variant="full" size="sm" />
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

export default function LeadSourcesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [dialogInput, setDialogInput] = useState("");
  const [dialogColor, setDialogColor] = useState(DEFAULT_SOURCE_COLOR);

  const queryClient = useQueryClient();
  const { organization } = useOrganization(orgId);
  const { data, isLoading } = useLeadSources(orgId);
  const updateSources = useUpdateLeadSources(orgId);
  const locale = organization?.locale ?? undefined;
  const timeFormat = organization?.time_format ?? undefined;

  const sources = data?.sources ?? [];
  const key = queryKeys.leadSources(orgId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sources.findIndex((s) => (s.id ?? s.name) === active.id);
    const newIndex = sources.findIndex((s) => (s.id ?? s.name) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(sources, oldIndex, newIndex);
    const previous = [...sources];
    queryClient.setQueryData(key, { sources: reordered });
    updateSources.mutate(reordered, {
      onError: () => queryClient.setQueryData(key, { sources: previous }),
    });
  };

  const handleAdd = (sourceName: string, color: string) => {
    const trimmed = sourceName.trim();
    if (!trimmed || updateSources.isPending) return;
    if (sources.some((s) => s.name === trimmed)) return;
    updateSources.mutate(
      [...sources, { name: trimmed, color: normalizeSourceColor(color) }],
      {
        onSuccess: () => {
          setDialogInput("");
          setDialogColor(DEFAULT_SOURCE_COLOR);
          setAddDialogOpen(false);
        },
      }
    );
  };

  const handleAddFromDialog = () => {
    handleAdd(dialogInput, dialogColor);
  };

  const openAddDialog = () => {
    setDialogInput("");
    setDialogColor(DEFAULT_SOURCE_COLOR);
    setAddDialogOpen(true);
  };

  const handleRemove = (index: number) => {
    if (updateSources.isPending) return;
    const next = sources.filter((_, i) => i !== index);
    updateSources.mutate(next);
  };

  if (!orgId) return null;

  const from = sources.length === 0 ? 0 : 1;
  const to = sources.length;
  const total = sources.length;

  return (
    <div className="container mx-auto p-4">
      <div className="">
        <h1 className="text-lg font-semibold">Lead sources</h1>
        <p className="text-muted-foreground text-sm">
          Manage the list of lead source options. Drag to reorder.
        </p>
      </div>

      {updateSources.isError && (
        <p className="mb-2 text-sm text-destructive">{updateSources.error?.message}</p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ShowingRange
            from={from}
            to={to}
            total={total}
            itemLabel="sources"
            emptyLabel="No sources"
          />
          <Button
            type="button"
            size="sm"
            onClick={openAddDialog}
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add lead source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="dialog-source-name">Source name</Label>
                <Input
                  id="dialog-source-name"
                  value={dialogInput}
                  onChange={(e) => setDialogInput(e.target.value)}
                  placeholder="e.g. Website, Referral, Manual"
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddFromDialog())
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Source color">
                  {SOURCE_COLOR_PALETTE.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      title={label}
                      aria-label={`${label} color`}
                      aria-pressed={normalizeSourceColor(dialogColor) === normalizeSourceColor(value)}
                      className="h-8 w-8 shrink-0 rounded-full border-2 transition-[transform,border-color] hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{
                        backgroundColor: value,
                        borderColor:
                          normalizeSourceColor(dialogColor) === normalizeSourceColor(value)
                            ? "hsl(var(--foreground))"
                            : "transparent",
                        boxShadow:
                          normalizeSourceColor(dialogColor) === normalizeSourceColor(value)
                            ? "0 0 0 1px hsl(var(--background))"
                            : undefined,
                      }}
                      onClick={() => setDialogColor(value)}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Label htmlFor="dialog-source-custom-color" className="text-muted-foreground text-xs shrink-0">
                    Custom
                  </Label>
                  <input
                    id="dialog-source-custom-color"
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/.test(dialogColor) ? dialogColor : DEFAULT_SOURCE_COLOR}
                    onChange={(e) => setDialogColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-input bg-transparent p-0 focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    aria-label="Pick custom color"
                  />
                  <Input
                    type="text"
                    placeholder="#000000"
                    value={dialogColor}
                    onChange={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) {
                        setDialogColor(DEFAULT_SOURCE_COLOR);
                        return;
                      }
                      const hex = (raw.startsWith("#") ? raw.slice(1) : raw).slice(0, 6);
                      if (/^[0-9A-Fa-f]*$/.test(hex)) {
                        setDialogColor(hex ? `#${hex}` : DEFAULT_SOURCE_COLOR);
                      }
                    }}
                    className="font-mono w-24 h-8 text-xs"
                    aria-label="Custom hex color"
                  />
                </div>
                <div className="space-y-1.5 pt-2 border-t border-border">
                  <Label className="text-muted-foreground text-xs">Preview</Label>
                  <SourceChip
                    source={dialogInput.trim() || "Source name"}
                    color={normalizeSourceColor(dialogColor)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleAddFromDialog}
                disabled={!dialogInput.trim() || updateSources.isPending}
              >
                {updateSources.isPending ? "Adding…" : "Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <TableLoadingSkeleton rowCount={5} columnCount={5} compact />
        ) : sources.length === 0 ? (
          <EmptyState
            title="No sources yet"
            description="Add source options like Website, Referral, or Manual using the Add button above."
            icon={Tag}
          />
        ) : (
          <div className="relative flex min-h-[260px] max-h-[520px] flex-1 flex-col overflow-y-auto rounded-md border">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                  <TableRow>
                    <TableHead className="w-10 px-3 text-xs" aria-label="Drag handle" />
                    <TableHead className="px-3 text-xs">Source</TableHead>
                    <TableHead className="w-[120px] px-3 text-xs">Created at</TableHead>
                    <TableHead className="w-[120px] px-3 text-xs">Created by</TableHead>
                    <TableHead className="w-[80px] px-3 text-right text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={sources.map((s) => s.id ?? s.name)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sources.map((source, index) => (
                      <SortableSourceRow
                        key={source.id ?? source.name}
                        source={source}
                        index={index}
                        onRemove={handleRemove}
                        isPending={updateSources.isPending}
                        locale={locale}
                        timeFormat={timeFormat}
                      />
                    ))}
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
