"use client";

import { createContext, useContext, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import * as Desktop from "@/components/ui/alert-dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const MobileAlertContext = createContext(false);
const useMobileAlert = () => useContext(MobileAlertContext);

export function AlertDialog(props: ComponentProps<typeof Desktop.AlertDialog>) {
  const mobile = useIsMobile();
  return <MobileAlertContext.Provider value={mobile}>{mobile ? <Drawer {...props} /> : <Desktop.AlertDialog {...props} />}</MobileAlertContext.Provider>;
}
export function AlertDialogTrigger(props: ComponentProps<typeof Desktop.AlertDialogTrigger>) {
  return useMobileAlert() ? <DrawerTrigger {...props} /> : <Desktop.AlertDialogTrigger {...props} />;
}
export function AlertDialogContent({ size = "default", ...props }: ComponentProps<typeof Desktop.AlertDialogContent>) {
  return useMobileAlert() ? <DrawerContent {...props} /> : <Desktop.AlertDialogContent size={size} {...props} />;
}
export function AlertDialogHeader(props: ComponentProps<"div">) {
  return useMobileAlert() ? <DrawerHeader {...props} /> : <Desktop.AlertDialogHeader {...props} />;
}
export function AlertDialogFooter(props: ComponentProps<"div">) {
  return useMobileAlert() ? <DrawerFooter {...props} /> : <Desktop.AlertDialogFooter {...props} />;
}
export function AlertDialogTitle(props: ComponentProps<typeof Desktop.AlertDialogTitle>) {
  return useMobileAlert() ? <DrawerTitle {...props} /> : <Desktop.AlertDialogTitle {...props} />;
}
export function AlertDialogDescription(props: ComponentProps<typeof Desktop.AlertDialogDescription>) {
  return useMobileAlert() ? <DrawerDescription {...props} /> : <Desktop.AlertDialogDescription {...props} />;
}
export function AlertDialogMedia({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="alert-dialog-media" className={cn("mx-auto mb-2 inline-flex size-14 items-center justify-center rounded-[14px] border bg-accent text-accent-foreground sm:mx-0", className)} {...props} />;
}
export function AlertDialogAction({ variant = "default", size = "default", ...props }: ComponentProps<typeof Desktop.AlertDialogAction>) {
  if (!useMobileAlert()) return <Desktop.AlertDialogAction variant={variant} size={size} {...props} />;
  return <DrawerClose asChild><Button variant={variant} size={size} {...props} /></DrawerClose>;
}
export function AlertDialogCancel({ variant = "outline", size = "default", ...props }: ComponentProps<typeof Desktop.AlertDialogCancel>) {
  if (!useMobileAlert()) return <Desktop.AlertDialogCancel variant={variant} size={size} {...props} />;
  return <DrawerClose asChild><Button variant={variant} size={size} {...props} /></DrawerClose>;
}
