"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

type ProjectTaskEditorHeaderProps = {
  listHref: string;
  title?: string;
  onSave?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  /** View mode: show Edit and Delete instead of Cancel and Save */
  editHref?: string;
  onDelete?: () => void;
};

export function ProjectTaskEditorHeader({
  listHref,
  title = "New Task",
  onSave,
  isSubmitting = false,
  submitLabel = "Save",
  editHref,
  onDelete,
}: ProjectTaskEditorHeaderProps) {
  const isViewMode = !!editHref;

  return (
    <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="sm" className="size-8 shrink-0 rounded-md p-0" asChild>
          <Link href={listHref} aria-label="Back">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <span className="font-semibold text-md">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {isViewMode ? (
          <>
            <Button variant="outline" size="sm" className="h-8 rounded-md" asChild>
              <Link href={editHref}>
                <Pencil className="mr-2 size-3.5" />
                Edit
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-md text-destructive hover:bg-destructive/10"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 size-3.5" />
                Delete
              </Button>
            )}
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" className="h-8 rounded-md" asChild disabled={isSubmitting}>
              <Link href={listHref}>Cancel</Link>
            </Button>
            {onSave && (
              <Button
                size="sm"
                className="h-8 rounded-md"
                onClick={onSave}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving…" : submitLabel}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
