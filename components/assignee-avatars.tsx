"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/get-initials";
import { cn } from "@/lib/utils";

type MemberInfo = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url?: string | null;
};

type AssigneeAvatarsProps = {
  assigneeIds: string[];
  members: MemberInfo[];
  max?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
};

function getDisplayName(m: MemberInfo): string {
  if (m.first_name || m.last_name) {
    return [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  }
  return "?";
}

export function AssigneeAvatars({
  assigneeIds,
  members,
  max = 3,
  size = "sm",
  className,
}: AssigneeAvatarsProps) {
  if (!assigneeIds?.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const memberMap = new Map(members.map((m) => [m.user_id, m]));
  const displayed = assigneeIds.slice(0, max).map((id) => memberMap.get(id)).filter(Boolean) as MemberInfo[];
  const overflow = assigneeIds.length - max;

  const avatarSize = size === "sm" ? "size-6" : size === "lg" ? "size-8" : "size-7";

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {displayed.map((m) => (
        <Avatar
          key={m.user_id}
          className={cn("ring-2 ring-background", avatarSize)}
          title={getDisplayName(m)}
        >
          {m.avatar_url && <AvatarImage src={m.avatar_url} alt="" />}
          <AvatarFallback className="text-[10px]">
            {getInitials(getDisplayName(m), null)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background font-medium",
            avatarSize,
            "text-[10px]"
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
