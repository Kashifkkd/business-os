"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  /** Short title (e.g. "No menu items") */
  title: string;
  /** Optional longer description */
  description?: string;
  /** Optional icon (default: Inbox) */
  icon?: React.ComponentType<{ className?: string }>;
  /** Optional action (e.g. Create button) */
  action?: React.ReactNode;
  /** Optional class for the container */
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-3">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-3 text-sm font-medium">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[280px] text-muted-foreground text-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
