"use client";

import { ProjectLoader } from "./project-loader";

interface OrgSwitchingOverlayProps {
  /** Organization name we're switching to */
  organizationName: string;
}

/** Full-screen overlay shown when the user is switching to another organization. */
export function OrgSwitchingOverlay({ organizationName }: OrgSwitchingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      aria-live="polite"
      aria-label={`Switching to ${organizationName}`}
    >
      <ProjectLoader
        message={`Switching to ${organizationName}`}
        subtext="Taking you to your workspace…"
        showLogo
      />
    </div>
  );
}
