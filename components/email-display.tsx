"use client";

import { useState, useCallback } from "react";
import { Copy, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmailDisplayProps = {
  email: string | null | undefined;
  className?: string;
};

const COPIED_MS = 1500;

export function EmailDisplay({ email, className }: EmailDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!email?.trim()) return;
      void navigator.clipboard.writeText(email.trim()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_MS);
      });
    },
    [email]
  );

  if (!email?.trim()) {
    return <span className={cn("text-muted-foreground text-xs", className)}>—</span>;
  }

  const href = `mailto:${email.trim()}`;
  return (
    <div className={cn("flex items-center gap-1 min-w-0", className)}>
      <a
        href={href}
        className="truncate text-xs text-blue-500 hover:underline hover:text-blue-600"
        onClick={(e) => e.stopPropagation()}
      >
        {email.trim()}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label="Copy email"
      >
        {copied ? <CopyCheck className="size-3 text-green-600" /> : <Copy className="size-3" />}
      </Button>
    </div>
  );
}
