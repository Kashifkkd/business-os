"use client";

import { Search, X } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function SearchBox({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: SearchBoxProps) {
  const hasValue = value.length > 0;

  return (
    <InputGroup
      className={cn("min-w-0", className)}
    >
      <InputGroupAddon align="inline-start">
        <Search className="size-4 shrink-0 text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="py-1.5"
      />
      {hasValue && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange("")}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
