"use client";

import { createContext, useContext, type ComponentProps } from "react";
import {
  Dialog as DesktopDialog,
  DialogClose as DesktopClose,
  DialogContent as DesktopContent,
  DialogDescription as DesktopDescription,
  DialogFooter as DesktopFooter,
  DialogHeader as DesktopHeader,
  DialogTitle as DesktopTitle,
  DialogTrigger as DesktopTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const MobileDialogContext = createContext(false);
const useMobileDialog = () => useContext(MobileDialogContext);

export function Dialog(props: ComponentProps<typeof DesktopDialog>) {
  const mobile = useIsMobile();
  return <MobileDialogContext.Provider value={mobile}>{mobile ? <Drawer {...props} /> : <DesktopDialog {...props} />}</MobileDialogContext.Provider>;
}

export function DialogTrigger(props: ComponentProps<typeof DesktopTrigger>) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerTrigger {...props} /> : <DesktopTrigger {...props} />;
}

export function DialogClose(props: ComponentProps<typeof DesktopClose>) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerClose {...props} /> : <DesktopClose {...props} />;
}

export function DialogContent(props: ComponentProps<typeof DesktopContent>) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerContent {...props} /> : <DesktopContent {...props} />;
}

export function DialogHeader(props: ComponentProps<"div">) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerHeader {...props} /> : <DesktopHeader {...props} />;
}

export function DialogFooter(props: ComponentProps<"div">) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerFooter {...props} /> : <DesktopFooter {...props} />;
}

export function DialogTitle(props: ComponentProps<typeof DesktopTitle>) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerTitle {...props} /> : <DesktopTitle {...props} />;
}

export function DialogDescription(props: ComponentProps<typeof DesktopDescription>) {
  const mobile = useMobileDialog();
  return mobile ? <DrawerDescription {...props} /> : <DesktopDescription {...props} />;
}
