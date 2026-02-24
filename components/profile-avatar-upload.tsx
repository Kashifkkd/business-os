"use client";

import { Camera, Eye, Trash2 } from "lucide-react";
import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ProfileAvatarUploadProps {
  /** Current avatar URL or blob URL for preview. */
  avatarSrc: string | null;
  /** Display name shown beside the avatar. */
  displayName: string;
  /** Fallback initials when no image (e.g. "JD"). */
  initials: string;
  /** Called when the avatar area is clicked (e.g. to open file picker). */
  onAvatarClick: () => void;
  /** Called when "view image" is clicked; only relevant when avatarSrc is set. */
  onViewImage?: () => void;
  /** Called when "remove image" is clicked; only relevant when avatarSrc is set. */
  onRemove?: () => void;
  /** Show loading state on the avatar trigger. */
  uploading?: boolean;
  /** Disable remove button (e.g. while request is in progress). */
  removing?: boolean;
  /** Tighter layout, less spacing. */
  compact?: boolean;
  /** Optional class name for the root. */
  className?: string;
  /** Avatar size. */
  avatarSize?: "default" | "lg";
}

const sizeClasses = {
  default: "size-16",
  lg: "size-24",
};

export function ProfileAvatarUpload({
  avatarSrc,
  displayName,
  initials,
  onAvatarClick,
  onViewImage,
  onRemove,
  uploading = false,
  removing = false,
  compact = false,
  className,
  avatarSize = "default",
}: ProfileAvatarUploadProps) {
  const sizeClass = sizeClasses[avatarSize];
  const hasImage = !!avatarSrc;

  return (
    <div
      className={cn(
        "flex flex-col items-start sm:flex-row sm:items-center",
        compact ? "gap-3 sm:gap-4" : "gap-4 sm:gap-6",
        className
      )}
    >
      <button
        type="button"
        onClick={onAvatarClick}
        disabled={uploading}
        className="group relative cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label={uploading ? "Uploading…" : "Change avatar"}
      >
        <Avatar className={cn("shrink-0", sizeClass)}>
          <AvatarImage src={avatarSrc ?? undefined} alt={displayName} />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="size-6 text-white" />
        </div>
      </button>

      <div className={cn("flex flex-col", compact ? "gap-1 sm:gap-1.5" : "gap-2 sm:gap-3")}>
        <div className="flex items-center gap-2">
          {hasImage && onViewImage && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onViewImage}
              aria-label="Open image in new tab"
            >
              <Eye className="size-4" />
            </Button>
          )}
          {hasImage && onRemove && (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onRemove}
              disabled={removing}
              aria-label="Remove profile image"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">Max 5MB. (JPEG, PNG, WebP)</p>
        <p className="text-muted-foreground text-xs">Click avatar to change photo</p>
      </div>
    </div>
  );
}

