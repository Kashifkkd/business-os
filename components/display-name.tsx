"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { nameToAvatarBg } from "@/lib/avatar-color";
import { cn } from "@/lib/utils";

type DisplayNameProps = {
  /** Display name used for avatar (initials and background color). Keep real name so avatar shows correct initials. */
  name: string | null | undefined;
  /** Optional profile image URL. When set, avatar shows image; otherwise initials with name-based bg. */
  avatarUrl?: string | null;
  /** When set, this is shown as the label instead of name (e.g. "You" when current user is the creator). Avatar still uses name. */
  label?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
};

/**
 * Shows avatar (profile pic or initials with name-based background color) and display name.
 * Use for users, leads, or any entity where you want consistent avatar color from name.
 * Pass label="You" to show "You" as text while keeping real name for avatar initials.
 */
export function DisplayName({
  name,
  avatarUrl,
  label,
  size = "default",
  className,
}: DisplayNameProps) {
  const nameForAvatar = (name ?? "").trim() || "—";
  const initials = getInitials(nameForAvatar);
  const avatarSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";
  const textToShow = label != null && label !== "" ? label : nameForAvatar;

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
            size === "sm" && "text-[10px]",
            size === "lg" && "text-base"
          )}
          style={{ backgroundColor: nameToAvatarBg(nameForAvatar) }}
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
        {textToShow}
      </span>
    </div>
  );
}
