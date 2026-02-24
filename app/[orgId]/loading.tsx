import { ProjectLoader } from "@/components/loaders/project-loader";

/** Shown while the [orgId] layout (and OrgLayoutClient) is loading. */
export default function OrgLayoutLoading() {
  return (
    <div className="flex h-svh w-full items-center justify-center bg-background">
      <ProjectLoader
        message="Loading your workspace"
        subtext="Fetching organization and profile…"
        showLogo
      />
    </div>
  );
}
