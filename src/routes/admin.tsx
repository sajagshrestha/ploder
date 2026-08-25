import { SignInButton, UserButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  CalendarDays,
  ClipboardList,
  Dumbbell,
  LayoutDashboard,
  Scale,
  Users,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type Me = { id: number; name: string; email: string; role: "user" | "admin" };

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/admin/splits", label: "Splits", icon: CalendarDays },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/workouts", label: "Workouts", icon: ClipboardList },
  { to: "/admin/body-weights", label: "Body Weight", icon: Scale },
] as const;

function useMe(enabled: boolean) {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<{ data: Me }>("/api/me"),
    retry: false,
    enabled,
  });
}

function AppSidebar({ user }: { user: Me }) {
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "/admin";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/admin">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Dumbbell className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Ploder</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Admin panel
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const active =
                  item.to === "/admin"
                    ? currentPath === "/admin"
                    : currentPath.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.label}
                    >
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <UserButton />
              <div
                className={cn(
                  "grid flex-1 leading-tight",
                  "group-data-[collapsible=icon]:hidden",
                )}
              >
                <span className="truncate text-sm font-medium">
                  {user.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function AdminLayout() {
  const { isLoaded, isSignedIn } = useUser();
  const me = useMe(Boolean(isLoaded && isSignedIn));
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "/admin";
  const activeLabel =
    navItems.find((item) =>
      item.to === "/admin"
        ? currentPath === "/admin"
        : currentPath.startsWith(item.to),
    )?.label ?? "Dashboard";

  if (!isLoaded || (isSignedIn && me.isPending)) {
    return (
      <div className="grid min-h-screen place-items-center">
        <p className="animate-pulse text-sm text-muted-foreground">
          Checking access…
        </p>
      </div>
    );
  }

  if (!isSignedIn || me.isError) {
    return (
      <div className="grid min-h-screen place-items-center p-8">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Admin access</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with an admin account to continue.
          </p>
          <SignInButton mode="modal">
            <Button>Sign in</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  if (me.data?.data.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center p-8">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-bold">Forbidden</h1>
          <p className="text-sm text-muted-foreground">
            Your account does not have admin permissions. Add your email to
            ADMIN_EMAILS to gain access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={me.data.data} />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mr-2 !h-4" orientation="vertical" />
          <span className="text-sm font-semibold">{activeLabel}</span>
          <div className="ml-auto flex items-center gap-1 md:hidden">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
