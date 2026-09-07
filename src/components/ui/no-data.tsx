import { Inbox, type LucideIcon } from "lucide-react";
import { type ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

type NoDataProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
};

/** Shared empty state. Pass an existing button or link as the next action. */
export function NoData({
  title,
  description,
  icon: Icon = Inbox,
  children,
  compact = false,
  className,
}: NoDataProps) {
  const titleId = useId();
  return (
    <section
      data-slot="no-data"
      aria-labelledby={titleId}
      className={cn(
        "col-span-full flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed bg-card px-6 py-10 text-center sm:py-12",
        compact && "gap-4 border-0 bg-transparent px-4 py-6 sm:py-6",
        className,
      )}
    >
      <div aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl border bg-muted text-muted-foreground">
        <Icon className="size-6" strokeWidth={1.75} />
      </div>
      <div className="max-w-sm space-y-2">
        <h3 id={titleId} className="text-lg font-semibold tracking-tight text-foreground">{title}</h3>
        {description && <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex w-full max-w-sm flex-wrap justify-center gap-2 [&>a]:min-h-11 [&>button]:min-h-11">{children}</div>}
    </section>
  );
}
