import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

type Option = {
  value: string;
  label: string;
};

type SearchableMultiSelectProps = {
  options: Option[];
  values: string[]; // Changed from value: string
  onValuesChange: (values: string[]) => void; // Changed from onValueChange
  onSearchChange: (search: string) => void; 
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  isLoading?: boolean; 
};

export function SearchableMultiSelect({
  options,
  values,
  onValuesChange,
  onSearchChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  isLoading = false,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Helper to find the label for a given value
  const getLabel = (value: string) => options.find(o => o.value === value)?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-w-0 h-auto", className)}
        >
          <div className="flex flex-wrap items-center gap-1">
            {values.length === 0 ? (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            ) : (
              // Display selected items as badges
              values.map((value) => (
                <Badge
                  variant="secondary"
                  key={value}
                  className="rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening popover
                    onValuesChange(values.filter((v) => v !== value));
                  }}
                >
                  {getLabel(value)}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" 
        align="start"
        sideOffset={5}
        collisionPadding={10}
      >
        <Command filter={() => 1}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            onValueChange={onSearchChange} 
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                emptyMessage
              )}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => {
                const isSelected = values.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      if (isSelected) {
                        onValuesChange(values.filter((v) => v !== option.value));
                      } else {
                        onValuesChange([...values, option.value]);
                      }
                      // Do not close popover, allow multi-select
                    }}
                    className="min-w-0"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 whitespace-normal break-words">
                      {option.label}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
