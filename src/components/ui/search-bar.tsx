"use client";

import { Search, X } from "lucide-react";
import { useRef, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchBarProps = Omit<
  ComponentProps<typeof Input>,
  "onChange" | "type" | "value"
> & {
  value: string;
  onValueChange: (value: string) => void;
  containerClassName?: string;
};

function SearchBar({
  value,
  onValueChange,
  className,
  containerClassName,
  "aria-label": ariaLabel = "Search",
  placeholder = "Search…",
  disabled,
  ...props
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      data-slot="search-bar"
      className={cn("relative w-full", containerClassName)}
    >
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          "pr-11 pl-12 [&::-webkit-search-cancel-button]:hidden",
          className,
        )}
        onChange={(event) => onValueChange(event.target.value)}
        {...props}
      />
      {value.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={`Clear ${ariaLabel.toLowerCase()}`}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            onValueChange("");
            inputRef.current?.focus();
          }}
        >
          <X aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export { SearchBar };
export type { SearchBarProps };
