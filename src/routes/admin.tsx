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

import { Button } from "@/components/ui/button";
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

function AdminLayout() {
  const { isLoaded, isSignedIn } = useUser();
  const me = useMe(Boolean(isLoaded && isSignedIn));
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "/admin";

  if (!isLoaded || me.isPending) {
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

  const activeLabel =
    navItems.find((item) => currentPath.startsWith(item.to))?.label ??
    "Dashboard";

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Dumbbell className="size-4" />
          </div>
          <div>
            <p className="text-sm leading-tight font-bold">Ploder</p>
            <p className="text-xs text-muted-foreground">Admin panel</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => {
            const active = currentPath.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {me.data.data.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {me.data.data.email}
              </p>
            </div>
            <UserButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
          <span className="font-bold md:hidden">Ploder Admin</span>
          <span className="hidden text-sm font-semibold md:inline">
            {activeLabel}
          </span>
          <nav className="ml-auto flex items-center gap-1 overflow-x-auto md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-accent text-accent-foreground" }}
                className="rounded-md p-2 text-muted-foreground hover:bg-accent"
              >
                <item.icon className="size-4" />
              </Link>
            ))}
            <UserButton />
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
