import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "mb-[9px] text-[9px] font-bold tracking-[1.6px] text-muted-foreground uppercase max-mobile:text-[8px]",
        className,
      )}
      {...props}
    />
  );
}
