"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

/** Creator shape for display; compatible with API-returned created_by objects. */
export type Creator = {
  id: string;
  name: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

type CreatedByDisplayProps = {
  /** Creator from API (id, name, email, avatar_url). */
  creator: Creator | null | undefined;
  /**
   * - full: avatar + name (default)
   * - compact: initial only (avatar circle, no name)
   * - nameOnly: name text only, no avatar
   */
  variant?: "full" | "compact" | "nameOnly";
  size?: "sm" | "default" | "lg";
  className?: string;
};

function creatorInitials(creator: Creator): string {
  if (creator.name?.trim()) return getInitials(creator.name, null);
  if (creator.email?.trim()) return creator.email.trim().slice(0, 2).toUpperCase();
  return "—";
}

function creatorDisplayName(creator: Creator): string {
  return creator.name?.trim() || creator.email?.trim() || "—";
}

export function CreatedByDisplay({
  creator,
  variant = "full",
  size = "default",
  className,
}: CreatedByDisplayProps) {
  if (!creator) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const displayName = creatorDisplayName(creator);
  const initials = creatorInitials(creator);
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  if (variant === "nameOnly") {
    return (
      <span
        className={cn(
          "truncate",
          size === "sm" && "text-xs",
          size === "lg" && "text-base",
          className
        )}
      >
        {displayName}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <Avatar size={avatarSize} className={cn("shrink-0", className)} title={displayName}>
        {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt="" />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        size === "sm" && "gap-1.5",
        className
      )}
    >
      <Avatar size={avatarSize} className="shrink-0">
        {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt="" />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "truncate text-muted-foreground",
          size === "sm" && "text-xs",
          size === "lg" && "text-base"
        )}
      >
        {displayName}
      </span>
    </div>
  );
}
