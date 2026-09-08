import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const tones = {
  lime: "border-[color-mix(in_srgb,var(--primary-foreground)_20%,transparent)] bg-primary text-primary-foreground",
  peach:
    "border-[#7c4a2133] bg-[linear-gradient(135deg,#fbeedd,#f3d9b8)] text-[#7c4a21]",
  purple:
    "border-[#4f3f7a33] bg-[linear-gradient(135deg,#efeaf9,#d9cdf1)] text-[#4f3f7a]",
  blue: "border-[#2c4e6b33] bg-[linear-gradient(135deg,#e4eef7,#c3d9ec)] text-[#2c4e6b]",
} as const;

export type IconTileTone = keyof typeof tones;

export function IconTile({
  tone = "lime",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: IconTileTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] border shadow-[inset_0_1px_0_#ffffff70,0_4px_10px_-6px_#2f3c2540] dark:shadow-[inset_0_1px_0_#ffffff25,0_4px_10px_-6px_#00000080]",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
