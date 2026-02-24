"use client";

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

interface ConfirmLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  leaveLabel?: string;
  stayLabel?: string;
}

/**
 * Reusable dialog shown when the user tries to leave with unsaved changes.
 * Use with useConfirmBeforeLeave.
 */
export function ConfirmLeaveDialog({
  open,
  onOpenChange,
  onConfirmLeave,
  onCancel,
  title = "Leave page?",
  description = "You have unsaved changes. Are you sure you want to leave? Your changes will be lost.",
  leaveLabel = "Leave",
  stayLabel = "Stay",
}: ConfirmLeaveDialogProps) {
  const handleOpenChange = (next: boolean) => {
    if (!next) onCancel();
    onOpenChange(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{stayLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              onConfirmLeave();
            }}
          >
            {leaveLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
