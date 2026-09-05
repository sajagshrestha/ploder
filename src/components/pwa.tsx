import { Download, Share } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker is a progressive enhancement; ignore failures.
      });
    }
  }, []);
  return null;
}

export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferred(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as unknown as { standalone: boolean }).standalone === true);
    if (standalone) {
      setInstalled(true);
    } else {
      // iOS Safari never fires beforeinstallprompt — guide those users to
      // Share → Add to Home Screen instead.
      const ua = navigator.userAgent;
      const iPhoneFamily = /iphone|ipad|ipod/i.test(ua);
      const iPadDesktopMode =
        navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      setIsIos(iPhoneFamily || iPadDesktopMode);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return null;
  }

  if (deferred) {
    return (
      <Button
        className={className}
        size="sm"
        variant="outline"
        onClick={async () => {
          await deferred.prompt();
          const { outcome } = await deferred.userChoice;
          if (outcome === "accepted") {
            setDeferred(null);
          }
        }}
      >
        <Download className="size-4" />
        Install app
      </Button>
    );
  }

  if (!isIos) {
    return null;
  }

  return (
    <>
      <Button
        className={className}
        size="sm"
        variant="outline"
        onClick={() => setShowIosHelp(true)}
      >
        <Download className="size-4" />
        Install app
      </Button>
      <Dialog open={showIosHelp} onOpenChange={setShowIosHelp}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Install Ploder</DialogTitle>
            <DialogDescription>
              Add Ploder to your home screen for a fullscreen app experience.
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                1
              </span>
              <span>
                Tap the <Share className="inline size-4 align-text-bottom" />{" "}
                Share button in Safari's toolbar.
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                2
              </span>
              <span>Scroll down and tap "Add to Home Screen".</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                3
              </span>
              <span>Tap "Add" in the top-right corner.</span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
