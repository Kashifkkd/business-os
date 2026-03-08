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
  /** Creator from API (id, name, email, avatar_url). Avatar always uses creator name for initials. */
  creator: Creator | null | undefined;
  /** When set, this is shown as the label instead of creator name (e.g. "You"). Avatar still uses creator. */
  label?: string | null;
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
  label,
  variant = "full",
  size = "default",
  className,
}: CreatedByDisplayProps) {
  if (!creator) {
    return <span className={cn("text-muted-foreground", className)}>—</span>;
  }

  const nameForAvatar = creatorDisplayName(creator);
  const initials = creatorInitials(creator);
  const textToShow = label != null && label !== "" ? label : nameForAvatar;
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
        {textToShow}
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <Avatar size={avatarSize} className={cn("shrink-0", className)} title={textToShow}>
        {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt="" />}
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
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
        <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "truncate text-muted-foreground",
          size === "sm" && "text-xs",
          size === "lg" && "text-base"
        )}
      >
        {textToShow}
      </span>
    </div>
  );
}
