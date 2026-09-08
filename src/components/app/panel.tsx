import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-[17px] border border-border bg-card p-6 max-mobile:rounded-[15px] max-mobile:p-[19px]",
        className,
      )}
      {...props}
    />
  );
}

export function PanelHeading({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mb-[18px] flex items-center justify-between gap-[14px]",
        className,
      )}
      {...props}
    />
  );
}
