import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerHeader,    
  DrawerTitle,        
  DrawerDescription,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile" 

type Option = {
  value: string;
  label: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange: (search: string) => void; 
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  showOther?: boolean;
  isLoading?: boolean; 
};

function SelectContent({
  options,
  value,
  onValueChange,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  showOther,
  isLoading,
  onClose, // Function to close the parent (Popover or Drawer)
}: Omit<SearchableSelectProps, 'className' | 'placeholder'> & { onClose: () => void }) {
  return (
    <Command filter={() => 1}>
      <CommandInput 
        placeholder={searchPlaceholder} 
        onValueChange={onSearchChange} 
        className="truncate"
      />
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
      {/* ✅ FIX: Add padding to the group for mobile drawer spacing */ }
      <CommandGroup className="max-h-64 overflow-auto p-2">
        {options.map((option) => (
          <CommandItem
            key={option.value}
            value={option.label}
            onSelect={() => {
              onValueChange(option.value);
              onClose(); // Close on select
            }}
            className="min-w-0" 
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === option.value ? "opacity-100" : "opacity-0"
              )}
            />
            <span className="flex-1 whitespace-normal break-words">
              {option.label}
            </span>
          </CommandItem>
        ))}
        {showOther && (
          <CommandItem
            value="Other"
            onSelect={() => {
              onValueChange("other");
              onClose(); // Close on select
            }}
          >
            <Check
              className={cn(
                "mr-2 h-4 w-4",
                value === "other" ? "opacity-100" : "opacity-0"
              )}
            />
            Other
          </CommandItem>
        )}
      </CommandGroup>
    </Command>
  )
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  showOther = true,
  isLoading = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const selectedOption = value === "other" 
    ? { value: "other", label: "Other" }
    : options.find((option) => option.value === value);

  const TriggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className={cn("w-full justify-between min-w-0", className)}
    >
      <span className="truncate">
        {selectedOption ? selectedOption.label : placeholder}
      </span>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent>
          {/* ✅ Render the reusable content */}
          <DrawerHeader className="text-left">
            <DrawerTitle>{placeholder}</DrawerTitle>
            <DrawerDescription>{searchPlaceholder}</Additional>
          </DrawerHeader>
          <div className="p-4 pt-0">
            <SelectContent
              options={options}
              value={value}
              onValueChange={onValueChange}
              onSearchChange={onSearchChange}
              searchPlaceholder={searchPlaceholder}
              emptyMessage={emptyMessage}
              showOther={showOther}
              isLoading={isLoading}
              onClose={() => setOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // ✅ RENDER POPOVER ON DESKTOP
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {TriggerButton}
      </PopoverTrigger>
      <PopoverContent 
        // ✅ FIX: Use responsive width for desktop.
        // This makes the popover match the trigger button's width.
        className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0" 
        align="start"
        sideOffset={5}
        collisionPadding={10}
      >
        {/* ✅ Render the reusable content */}
        <SelectContent
          options={options}
          value={value}
          onValueChange={onValueChange}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          showOther={showOther}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
