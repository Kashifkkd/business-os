import { cn } from "@/lib/utils";
import React from "react";

export function GridSmallBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-1 items-center justify-center bg-white dark:bg-black">
      {/* Grid layer – stays behind content */}
      <div
        className={cn(
          "absolute inset-0 z-0",
          "[background-size:20px_20px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]",
        )}
      />
      {/* Fade overlay – behind content */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black"
        aria-hidden
      />
      {/* Form/card sits above grid and fade */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-6 p-4">
        {children}
      </div>
    </div>
  );
}
