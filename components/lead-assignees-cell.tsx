"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getInitials } from "@/lib/get-initials";
import { nameToAvatarBg } from "@/lib/avatar-color";
import { cn } from "@/lib/utils";

const MAX_VISIBLE = 2;
const AVATAR_SIZE = "size-6";

type Assignee = { user_id: string; name: string | null; email: string | null };

/** Real name/email for avatar (initials and color). */
function getRealName(a: Assignee): string {
  return (a.name?.trim() || a.email?.trim() || a.user_id) || "—";
}

/** Label for tooltip and list: "You" when current user, else real name. */
function getDisplayLabel(a: Assignee, currentUserId: string | null): string {
  if (currentUserId && a.user_id === currentUserId) return "You";
  return getRealName(a);
}

export function LeadAssigneesCell({
  assignees,
  currentUserId = null,
  className,
}: {
  assignees: Assignee[];
  /** When set, assignees with this user_id are shown as "You". */
  currentUserId?: string | null;
  className?: string;
}) {
  if (!assignees?.length) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const visible = assignees.slice(0, MAX_VISIBLE);
  const overflow = assignees.slice(MAX_VISIBLE);
  const overflowCount = overflow.length;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((a) => {
        const realName = getRealName(a);
        const displayLabel = getDisplayLabel(a, currentUserId);
        const initials = getInitials(realName, a.email);
        return (
          <Tooltip key={a.user_id}>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-default">
                <Avatar className={cn("ring-2 ring-background", AVATAR_SIZE)}>
                  <AvatarFallback
                    className="text-[9px] text-white"
                    style={{ backgroundColor: nameToAvatarBg(realName) }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">{displayLabel}</TooltipContent>
          </Tooltip>
        );
      })}
      {overflowCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background font-medium text-[10px] cursor-default",
                AVATAR_SIZE
              )}
            >
              +{overflowCount}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] p-2">
            <div className="flex flex-col gap-1.5">
              {overflow.map((a) => {
                const realName = getRealName(a);
                const displayLabel = getDisplayLabel(a, currentUserId);
                const initials = getInitials(realName, a.email);
                return (
                  <div
                    key={a.user_id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <Avatar className="size-5 shrink-0 ring-1 ring-background">
                      <AvatarFallback
                        className="text-[7px] text-white"
                        style={{ backgroundColor: nameToAvatarBg(realName) }}
                      >
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{displayLabel}</span>
                  </div>
                );
              })}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
