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
import { useLeadSources, useUpdateLeadSources } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { SourceChip } from "@/components/source-chip";
import { SOURCE_COLOR_PALETTE, DEFAULT_SOURCE_COLOR } from "@/lib/lead-sources";
import type { LeadSourceItem } from "@/lib/lead-sources";
import { Tag, Plus, Trash2, GripVertical } from "lucide-react";
import { format } from "date-fns";

function SortableSourceRow({
  source,
  index,
  onColorChange,
  onRemove,
  isPending,
}: {
  source: LeadSourceItem;
  index: number;
  onColorChange: (index: number, color: string) => void;
  onRemove: (index: number) => void;
  isPending: boolean;
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
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "opacity-50 bg-muted/50" : ""}>
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
      <TableCell>
        <Select
          value={source.color}
          onValueChange={(v) => onColorChange(index, v)}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SOURCE_COLOR_PALETTE.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ backgroundColor: opt.value }}
                  />
                  {opt.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {source.created_at
          ? format(new Date(source.created_at), "MMM d, yyyy")
          : "—"}
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {source.created_by_name ?? "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}
          disabled={isPending}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default function LeadSourcesPage() {
  const params = useParams();
  const orgId = params?.orgId as string;
  const [newSource, setNewSource] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_SOURCE_COLOR);

  const { data, isLoading } = useLeadSources(orgId);
  const updateSources = useUpdateLeadSources(orgId);

  const sources = data?.sources ?? [];

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
    updateSources.mutate(reordered);
  };

  const handleAdd = () => {
    const trimmed = newSource.trim();
    if (!trimmed || updateSources.isPending) return;
    if (sources.some((s) => s.name === trimmed)) {
      setNewSource("");
      return;
    }
    updateSources.mutate(
      [...sources, { name: trimmed, color: newColor }],
      { onSuccess: () => (setNewSource(""), setNewColor(DEFAULT_SOURCE_COLOR)) }
    );
  };

  const handleRemove = (index: number) => {
    if (updateSources.isPending) return;
    const next = sources.filter((_, i) => i !== index);
    updateSources.mutate(next);
  };

  const handleColorChange = (index: number, color: string) => {
    if (updateSources.isPending) return;
    const next = sources.map((s, i) => (i === index ? { ...s, color } : s));
    updateSources.mutate(next);
  };

  if (!orgId) return null;

  return (
    <div className="container mx-auto w-full max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">Lead sources</h1>
          <p className="text-muted-foreground text-sm">
            Manage the list of lead source options and colors. Drag to reorder.
          </p>
        </div>
        <div className="flex flex-1 max-w-md flex-wrap items-end gap-2 sm:flex-initial">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1 min-w-0">
              <Label htmlFor="new-source" className="sr-only">
                Add source
              </Label>
              <Input
                id="new-source"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="e.g. Website, Referral"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
              />
            </div>
            <Select value={newColor} onValueChange={setNewColor}>
              <SelectTrigger className="h-9 w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_COLOR_PALETTE.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full border border-border"
                        style={{ backgroundColor: opt.value }}
                      />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={!newSource.trim() || updateSources.isPending}
          >
            <Plus className="size-4" />
            Add
          </Button>
        </div>
      </div>

      {updateSources.isError && (
        <p className="mb-2 text-sm text-destructive">{updateSources.error?.message}</p>
      )}

      {isLoading ? (
        <TableLoadingSkeleton rowCount={5} columnCount={6} />
      ) : sources.length === 0 ? (
        <EmptyState
          title="No sources yet"
          description="Add source options like Website, Referral, or Manual."
          icon={Tag}
        />
      ) : (
        <div className="rounded-md border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" aria-label="Drag handle" />
                  <TableHead className="w-full">Source</TableHead>
                  <TableHead className="w-[180px]">Color</TableHead>
                  <TableHead className="w-[120px]">Created</TableHead>
                  <TableHead className="w-[120px]">Created by</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
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
                      onColorChange={handleColorChange}
                      onRemove={handleRemove}
                      isPending={updateSources.isPending}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}
    </div>
  );
}
