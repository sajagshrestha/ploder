import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function InlineNote({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-7 text-xs text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
