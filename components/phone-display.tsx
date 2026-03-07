"use client";

import { useState, useCallback } from "react";
import { Copy, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PhoneDisplayProps = {
  phone: string | null | undefined;
  className?: string;
};

const COPIED_MS = 1500;

export function PhoneDisplay({ phone, className }: PhoneDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!phone?.trim()) return;
      void navigator.clipboard.writeText(phone.trim()).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_MS);
      });
    },
    [phone]
  );

  if (!phone?.trim()) {
    return <span className={cn("text-muted-foreground text-xs", className)}>—</span>;
  }

  const tel = phone.trim().replace(/\s/g, "");
  const href = `tel:${tel}`;
  return (
    <div className={cn("flex items-center gap-1 min-w-0", className)}>
      <a
        href={href}
        className="truncate text-xs text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        {phone.trim()}
      </a>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopy}
        aria-label="Copy number"
      >
        {copied ? <CopyCheck className="size-3 text-green-600" /> : <Copy className="size-3" />}
      </Button>
    </div>
  );
}
