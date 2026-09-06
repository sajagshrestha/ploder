import { SignInButton, UserButton, useUser } from "@clerk/tanstack-react-start";
import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  House,
  LayoutDashboard,
  Menu,
  Scale,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { InstallPrompt, PwaRegister } from "@/components/pwa";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type Me = { id: number; name: string; email: string; role: "user" | "admin" };

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/exercises", label: "Exercises", icon: Dumbbell, exact: false },
  { to: "/admin/splits", label: "Plans", icon: CalendarDays, exact: false },
  { to: "/admin/users", label: "Users", icon: Users, exact: false },
  {
    to: "/admin/workouts",
    label: "Workouts",
    icon: ClipboardList,
    exact: false,
  },
  {
    to: "/admin/body-weights",
    label: "Body Weight",
    icon: Scale,
    exact: false,
  },
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

  if (!isLoaded) {
    return (
      <div className="training-app app-loading">
        <div className="brand-mark">
          <Dumbbell />
        </div>
        <p>Checking admin access…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="training-app app-welcome">
        <div className="welcome-copy">
          <Link to="/" className="app-brand">
            <span className="brand-mark">
              <Dumbbell />
            </span>
            ploder<span className="brand-dot">.</span>
          </Link>
          <p className="eyebrow">COACH & ADMIN SPACE</p>
          <h1>
            Shape the
            <br />
            training library.
          </h1>
          <p>
            Sign in with an admin account to manage exercises, plans, members,
            and logged workouts.
          </p>
          <SignInButton mode="modal">
            <Button size="lg">
              Sign in <ArrowUpRight size={18} />
            </Button>
          </SignInButton>
        </div>
        <img
          className="welcome-asset"
          src="/assets/training-dumbbell.png"
          alt="Dumbbell illustration"
        />
        <PwaRegister />
      </div>
    );
  }

  return <SignedInAdminLayout />;
}

const adminMobileTabs = [
  { to: "/admin", label: "Home", icon: House, exact: true },
  {
    to: "/admin/exercises",
    label: "Exercises",
    icon: Dumbbell,
    exact: false,
  },
  {
    to: "/admin/workouts",
    label: "Workouts",
    icon: ClipboardList,
    exact: false,
  },
] as const;

function SignedInAdminLayout() {
  const { user } = useUser();
  const [menuValue, setMenuValue] = useOverlayState("menu");
  const menuOpen = menuValue !== null;
  const closeMenu = () => setMenuValue(null);
  const me = useMe(true);
  const matches = useMatches();
  const currentPath = matches.at(-1)?.pathname ?? "/admin";
  const current = navItems.find((item) =>
    item.exact ? currentPath === "/admin" : currentPath.startsWith(item.to),
  );
  const displayName =
    me.data?.data.name ?? user?.firstName ?? user?.fullName ?? "Admin";
  const displayEmail =
    me.data?.data.email ?? user?.primaryEmailAddress?.emailAddress ?? "";

  if (me.isPending) {
    return (
      <div className="training-app app-loading">
        <div className="brand-mark">
          <Dumbbell />
        </div>
        <p>Checking admin access…</p>
      </div>
    );
  }

  if (me.isError || me.data?.data.role !== "admin") {
    return (
      <div className="training-app app-loading">
        <div className="welcome-copy" style={{ textAlign: "center" }}>
          <p className="eyebrow">FORBIDDEN</p>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 52px)" }}>
            No admin access.
          </h1>
          <p>
            {me.isError
              ? "Sign in with an admin account to continue."
              : "Your account does not have admin permissions. Add your email to ADMIN_EMAILS to gain access."}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <Button asChild>
              <Link to="/app">Open the tracker</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back home</Link>
            </Button>
          </div>
        </div>
        <PwaRegister />
      </div>
    );
  }

  return (
    <div className="training-app app-shell">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>
      <aside className="app-sidebar">
        <Link to="/admin" className="app-brand">
          <span className="brand-mark">
            <Dumbbell size={22} />
          </span>
          ploder<span className="brand-dot">.</span>
        </Link>
        <div className="sidebar-label">ADMINISTRATION</div>
        <nav className="desktop-navigation" aria-label="Admin navigation">
          {navItems.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="desktop-nav-link"
            >
              <tab.icon size={19} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">
              <ShieldCheck size={18} />
            </span>
            <h3>Coach with intention.</h3>
            <p>Curate exercises and plans your members will love to follow.</p>
            <Link to="/app">
              Open the tracker <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="sidebar-profile">
            <UserButton />
            <div>
              <strong>{displayName}</strong>
              <span>{displayEmail || "Admin account"}</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="topbar-breadcrumb">
            <span className="mobile-brand">
              <Dumbbell size={22} />
            </span>
            <span className="topbar-titles">
              <span className="desktop-only topbar-context">
                Administration
              </span>
              <strong>{current?.label ?? "Dashboard"}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <InstallPrompt />
            <ThemeToggle />
            <span className="mobile-user">
              <UserButton />
            </span>
            <Button asChild className="topbar-start">
              <Link to="/app">
                <Zap size={15} />
                Open tracker
              </Link>
            </Button>
          </div>
        </header>
        <main id="app-main" className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>PLODER / COACH WITH INTENTION</span>
        </footer>
      </div>
      <Drawer
        direction="right"
        open={menuOpen}
        onOpenChange={(open) => setMenuValue(open ? "" : null)}
      >
        <nav className="mobile-navigation" aria-label="Mobile admin navigation">
          {adminMobileTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              aria-label={tab.label}
            >
              <tab.icon size={23} />
            </Link>
          ))}
          <DrawerTrigger asChild>
            <button type="button" aria-label="Open menu">
              <Menu size={23} />
            </button>
          </DrawerTrigger>
        </nav>
        <DrawerContent side="right" className="mobile-drawer">
          <DrawerHeader className="drawer-brand">
            <Link to="/admin" className="app-brand" onClick={closeMenu}>
              <span className="brand-mark">
                <Dumbbell size={22} />
              </span>
              ploder<span className="brand-dot">.</span>
            </Link>
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
          </DrawerHeader>
          <div className="drawer-actions">
            <Button asChild onClick={closeMenu}>
              <Link to="/app">
                <Zap size={15} />
                Open tracker
              </Link>
            </Button>
          </div>
          <div className="sidebar-label drawer-label">ADMINISTRATION</div>
          <nav className="desktop-navigation" aria-label="Menu navigation">
            {navItems.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                activeOptions={{ exact: tab.exact }}
                className="desktop-nav-link"
                onClick={closeMenu}
              >
                <tab.icon size={19} />
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
          <div className="drawer-footer">
            <ThemeToggle className="desktop-nav-link" />
            <InstallPrompt />
            <div className="sidebar-profile">
              <UserButton />
              <div>
                <strong>{displayName}</strong>
                <span>{displayEmail || "Admin account"}</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <PwaRegister />
    </div>
  );
}
