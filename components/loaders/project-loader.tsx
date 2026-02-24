"use client";

interface ProjectLoaderProps {
  /** Main message, e.g. "Loading your workspace" or "Switching to Acme Inc." */
  message?: string;
  /** Optional subtext */
  subtext?: string;
  /** If true, show the BUSINESSOS logo block; if false, only spinner + message */
  showLogo?: boolean;
  /** Optional className for the outer container */
  className?: string;
}

export function ProjectLoader({
  message = "Loading your workspace",
  subtext,
  showLogo = true,
  className = "",
}: ProjectLoaderProps) {
  return (
    <div
      className={`flex min-h-[12rem] w-full flex-col items-center justify-center gap-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {showLogo && (
        <div
          className="flex size-12 items-center justify-center rounded-lg bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground shadow-sm"
          aria-hidden
        >
          B
        </div>
      )}
      <div className="flex flex-col items-center gap-3">
        <div className="relative flex size-10 items-center justify-center">
          <div
            className="absolute size-10 animate-spin rounded-full border-2 border-sidebar-border border-t-sidebar-primary"
            aria-hidden
          />
        </div>
        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  );
}
