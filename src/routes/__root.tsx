import { ClerkProvider } from "@clerk/tanstack-react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Ploder",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        <ClerkProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-right" />
          </QueryClientProvider>
        </ClerkProvider>
        <Scripts />
      </body>
    </html>
  );
}
