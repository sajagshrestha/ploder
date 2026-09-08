"use client";

import { Drawer as DrawerPrimitive } from "vaul";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger(props: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal(props: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose(props: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return <DrawerPrimitive.Overlay data-slot="drawer-overlay" className={cn("fixed inset-0 z-50 bg-black/55", className)} {...props} />;
}

function DrawerContent({ className, children, side = "bottom", ...props }: React.ComponentProps<typeof DrawerPrimitive.Content> & { side?: "bottom" | "right" }) {
  return <DrawerPortal><DrawerOverlay /><DrawerPrimitive.Content data-slot="drawer-content" className={cn("fixed z-50 flex flex-col bg-card text-card-foreground outline-none", side === "bottom" && "inset-x-0 bottom-0 mt-24 min-h-[40dvh] max-h-[92dvh] rounded-t-[22px] border", side === "right" && "inset-y-0 right-0 h-full w-[86vw] max-w-[320px] border-l", className)} {...props}>{side === "bottom" && <div data-slot="drawer-handle" aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/35" />}{children}</DrawerPrimitive.Content></DrawerPortal>;
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("grid gap-1.5 p-4 text-center", className)} {...props} />;
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return <DrawerPrimitive.Title data-slot="drawer-title" className={cn("font-semibold text-foreground", className)} {...props} />;
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return <DrawerPrimitive.Description data-slot="drawer-description" className={cn("text-sm text-muted-foreground", className)} {...props} />;
}

export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerPortal, DrawerTitle, DrawerTrigger };
