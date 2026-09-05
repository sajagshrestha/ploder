import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import { initLocalFirst, queryClient } from "@/lib/query-client";
import { THEME_INIT_SCRIPT } from "@/lib/theme-preferences";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "Ploder — Workout Tracker",
      },
      {
        name: "description",
        content:
          "Track workouts, follow training splits, and log progress. Installs on your phone.",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#ffffff",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#09090b",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Ploder",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "192x192",
        href: "/icons/icon-192.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "512x512",
        href: "/icons/icon-512.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/icons/apple-touch-icon.png",
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  // Restore the persisted cache before first paint so repeat visits feel
  // instant; the splash only flashes on cold starts.
  const [localReady, setLocalReady] = useState(
    () => typeof window === "undefined",
  );
  useEffect(() => {
    let cancelled = false;
    void initLocalFirst().finally(() => {
      if (!cancelled) {
        setLocalReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!localReady) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
        </head>
        <body className="font-sans antialiased">
          <div className="training-app app-loading">
            <div className="brand-mark" />
            <p>Getting your training space ready…</p>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: static inline theme script to prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ClerkProvider>
          <ThemeProvider>
            <QueryClientProvider client={queryClient}>
              {children}
              <Toaster position="top-right" />
            </QueryClientProvider>
          </ThemeProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
