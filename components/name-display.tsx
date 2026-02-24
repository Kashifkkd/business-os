"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

type NameDisplayProps = {
  /** Display name (e.g. item name, user name) */
  name: string;
  /** Optional image URL for avatar */
  avatarUrl?: string | null;
  /** Optional fallback when no image (e.g. initials "JD"). If not set, first letter of name is used. */
  avatarFallback?: string | null;
  /** Optional icon to show instead of or beside avatar (e.g. Lucide icon) */
  icon?: React.ReactNode;
  /** Size: sm (compact for table), default, lg */
  size?: "sm" | "default" | "lg";
  /** Optional secondary line (e.g. subtitle) */
  secondary?: React.ReactNode;
  /** When true, show icon only (no avatar); icon is shown in place of avatar */
  iconOnly?: boolean;
  className?: string;
};

export function NameDisplay({
  name,
  avatarUrl,
  avatarFallback,
  icon,
  size = "default",
  secondary,
  iconOnly,
  className,
}: NameDisplayProps) {
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";
  const showAvatar = !iconOnly && (avatarUrl || avatarFallback !== undefined || !icon);

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        size === "sm" && "gap-1.5",
        className
      )}
    >
      {showAvatar ? (
        <Avatar size={avatarSize} className="shrink-0">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-xs">
            {getInitials(name, avatarFallback)}
          </AvatarFallback>
        </Avatar>
      ) : icon ? (
        <span
          className={cn(
            "flex shrink-0 items-center justify-center text-muted-foreground",
            size === "sm" && "[&_svg]:size-3.5",
            size === "lg" && "[&_svg]:size-5"
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <span
          className={cn(
            "truncate font-medium",
            size === "sm" && "text-xs",
            size === "lg" && "text-base"
          )}
        >
          {name}
        </span>
        {secondary != null && (
          <div className="truncate text-muted-foreground text-xs">
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}
