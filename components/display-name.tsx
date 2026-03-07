"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { nameToAvatarBg } from "@/lib/avatar-color";
import { cn } from "@/lib/utils";

type DisplayNameProps = {
  /** Display name (e.g. "Jane Doe" or from first_name + last_name). */
  name: string | null | undefined;
  /** Optional profile image URL. When set, avatar shows image; otherwise initials with name-based bg. */
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

/**
 * Shows avatar (profile pic or initials with name-based background color) and display name.
 * Use for users, leads, or any entity where you want consistent avatar color from name.
 */
export function DisplayName({
  name,
  avatarUrl,
  size = "default",
  className,
}: DisplayNameProps) {
  const displayName = (name ?? "").trim() || "—";
  const initials = getInitials(displayName);
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  return (
    <div
      className={cn(
        "flex items-center gap-2 min-w-0",
        size === "sm" && "gap-1.5",
        className
      )}
    >
      <Avatar size={avatarSize} className="shrink-0">
        {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
        <AvatarFallback
          className={cn(
            "text-white font-medium",
            size === "sm" && "text-xs",
            size === "lg" && "text-base"
          )}
          style={{ backgroundColor: nameToAvatarBg(name) }}
        >
          {initials}
        </AvatarFallback>
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
