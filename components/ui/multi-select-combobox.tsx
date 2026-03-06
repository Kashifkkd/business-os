"use client";

import { useState } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface MultiSelectComboboxOption {
  value: string;
  label: string;
}

interface MultiSelectComboboxProps {
  options: MultiSelectComboboxOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Optional: render custom create option (e.g. "Create tag 'X'"). When selected, onCreateOption is called with the search input. */
  onCreateOption?: (input: string) => Promise<string | null>;
  /** Label for create option, e.g. "Create tag" */
  createOptionLabel?: (input: string) => string;
  align?: "start" | "end" | "center";
}

export function MultiSelectCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Search…",
  emptyMessage = "No results found.",
  disabled = false,
  id,
  className,
  onCreateOption,
  createOptionLabel = (input) => `Create "${input}"`,
  align = "start",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean) as string[];
  const displayText =
    value.length === 0
      ? placeholder
      : value.length === 1 && selectedLabels[0]
        ? selectedLabels[0]
        : `${value.length} selected`;

  const filteredOptions = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase().trim())
      )
    : options;
  const hasExactMatch = search.trim()
    ? options.some(
        (o) => o.label.toLowerCase() === search.toLowerCase().trim()
      )
    : false;
  const showCreateOption =
    !!onCreateOption &&
    search.trim().length > 0 &&
    !hasExactMatch &&
    !isCreating;

  const toggleValue = (optValue: string) => {
    const next = value.includes(optValue)
      ? value.filter((v) => v !== optValue)
      : [...value, optValue];
    onValueChange(next);
  };

  const handleCreateOption = async () => {
    const input = search.trim();
    if (!input || !onCreateOption) return;
    setIsCreating(true);
    try {
      const newId = await onCreateOption(input);
      if (newId) {
        onValueChange([...value, newId]);
        setSearch("");
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
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
          <span className="min-w-0 truncate">{displayText}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          className="bg-popover text-popover-foreground data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/10 w-(--radix-popover-trigger-width) rounded-lg border shadow-md ring-1 p-0 z-50 min-w-[var(--radix-popover-trigger-width)] origin-(--radix-popover-content-transform-origin)"
        >
          <Command
            className="rounded-lg border-0 shadow-none"
            shouldFilter={false}
          >
            <CommandInput
              placeholder={placeholder}
              className="h-9"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {filteredOptions.length === 0 && !showCreateOption ? (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              ) : null}
              <CommandGroup>
                {filteredOptions.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => toggleValue(option.value)}
                      className="pe-8 [&>svg:last-of-type]:!hidden"
                    >
                      <Checkbox
                        checked={isSelected}
                        className="pointer-events-none mr-2"
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {option.label}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ms-auto size-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  );
                })}
                {showCreateOption ? (
                  <CommandItem
                    value={`__create__${search}`}
                    onSelect={handleCreateOption}
                    disabled={isCreating}
                    className={cn(
                      "pe-8",
                      filteredOptions.length > 0 && "border-t border-border"
                    )}
                  >
                    <span className="text-primary">
                      + {createOptionLabel(search)}
                    </span>
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
