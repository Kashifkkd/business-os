"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CheckIcon, ChevronsUpDownIcon, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SearchComboboxOption {
  value: string;
  label: string;
}

interface SearchComboboxProps {
  options: SearchComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  showClear?: boolean;
  /** Align dropdown (e.g. "start" | "end"). Default "start". */
  align?: "start" | "end" | "center";
  /** When provided and search has no results but user typed something, show "Add {search} company" and call this on click (no dialog). */
  onAddNew?: (searchValue: string) => void;
  /** Label for the add-new action. Receives the current search string. Default: `Add "{searchValue}" company` */
  addNewLabel?: (searchValue: string) => string;
}

/**
 * Reusable combobox with built-in search. Use instead of Select when
 * users may need to search/filter options (e.g. long lists).
 */
export function SearchCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Search…",
  emptyMessage = "No results found.",
  disabled = false,
  id,
  className,
  showClear = false,
  align = "start",
  onAddNew,
  addNewLabel = (searchValue) => `Add "${searchValue}" company`,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedLabel = value ? options.find((o) => o.value === value)?.label : null;
  const trimmedSearch = search.trim();

  const handleOpenChange = (next: boolean) => {
    if (!next) setSearch("");
    setOpen(next);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", className)}
          aria-label={placeholder}
        >
          {selectedLabel ?? placeholder}
          <span className="flex shrink-0 items-center gap-0.5">
            {showClear && value ? (
              <button
                type="button"
                tabIndex={-1}
                className="rounded p-0.5 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onValueChange("");
                }}
                aria-label="Clear"
              >
                ×
              </button>
            ) : null}
            <ChevronsUpDownIcon className="opacity-50 size-4" />
          </span>
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          className="bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 w-(--radix-popover-trigger-width) rounded-lg border shadow-md ring-1 p-0 z-50 min-w-[var(--radix-popover-trigger-width)] origin-(--radix-popover-content-transform-origin)"
        >
          <Command className="rounded-lg border-0 shadow-none">
            <CommandInput
              placeholder={placeholder}
              className="h-9"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {trimmedSearch && onAddNew ? (
                  <button
                    type="button"
                    className="flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-muted hover:text-foreground"
                    onClick={() => {
                      onAddNew(trimmedSearch);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Plus className="size-4 shrink-0" />
                    {addNewLabel(trimmedSearch)}
                  </button>
                ) : (
                  emptyMessage
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onValueChange(option.value === value ? "" : option.value);
                      setOpen(false);
                    }}
                    className="pe-8 [&>svg:last-of-type]:!hidden"
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    <CheckIcon
                      className={cn(
                        "ms-auto size-4 shrink-0",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
