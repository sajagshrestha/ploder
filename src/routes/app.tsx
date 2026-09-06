import { SignInButton, useUser } from "@clerk/tanstack-react-start";
import {
  createFileRoute,
  Link,
  Outlet,
  useMatches,
} from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  CloudOff,
  Dumbbell,
  History,
  House,
  Menu,
  Play,
  Scale,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { AccountMenu } from "@/components/app/account-menu";
import { InstallPrompt, PwaRegister } from "@/components/pwa";
import { ThemeToggle } from "@/components/theme";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { useMySummary } from "@/lib/my-queries";
import { useOnline, useOutboxCount } from "@/lib/online";

export const Route = createFileRoute("/app")({ component: AppLayout });

function SyncStatus() {
  const online = useOnline();
  const pending = useOutboxCount();
  if (online && pending === 0) {
    return null;
  }
  return (
    <span
      className="sync-pill"
      role="status"
      title={online ? `${pending} to sync` : "Offline — saved here"}
    >
      <CloudOff size={14} />
      <span className="desktop-only">
        {online ? `${pending} to sync` : "Offline"}
      </span>
    </span>
  );
}
const tabs = [
  { to: "/app", label: "Overview", icon: House, exact: true },
  { to: "/app/train", label: "Workout", icon: Dumbbell, exact: false },
  {
    to: "/app/splits",
    label: "Plans",
    icon: CalendarDays,
    exact: false,
  },
  { to: "/app/history", label: "History", icon: History, exact: false },
  { to: "/app/progress", label: "Progress", icon: TrendingUp, exact: false },
  { to: "/app/exercises", label: "Library", icon: Zap, exact: false },
] as const;

function AppLayout() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded)
    return (
      <div className="training-app app-loading">
        <div className="brand-mark">
          <Dumbbell />
        </div>
        <p>Loading…</p>
      </div>
    );
  if (!isSignedIn)
    return (
      <div className="training-app app-welcome">
        <div className="welcome-copy">
          <Link to="/" className="app-brand">
            <span className="brand-mark">
              <Dumbbell />
            </span>
            ploder<span className="brand-dot">.</span>
          </Link>
          <h1>
            Small steps.
            <br />
            Stronger you.
          </h1>
          <p>Log sets, follow plan, see progress.</p>
          <SignInButton mode="modal">
            <Button size="lg">
              Get started <ArrowUpRight size={18} />
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
  return <SignedInLayout />;
}

const mobileTabs = [
  { to: "/app", label: "Home", icon: House, exact: true },
  { to: "/app/train", label: "Workout", icon: Dumbbell, exact: false },
  { to: "/app/progress", label: "Progress", icon: TrendingUp, exact: false },
] as const;

function SignedInLayout() {
  const { user } = useUser();
  const [menuValue, setMenuValue] = useOverlayState("menu");
  const menuOpen = menuValue !== null;
  const closeMenu = () => setMenuValue(null);
  const summary = useMySummary();
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/app";
  const current = tabs.find((tab) =>
    tab.exact ? path === "/app" || path === "/app/" : path.startsWith(tab.to),
  );
  const activeWorkout = summary.data?.data.activeWorkout;
  return (
    <div className="training-app app-shell">
      <a href="#app-main" className="skip-link">
        Skip to content
      </a>
      <aside className="app-sidebar">
        <Link to="/app" className="app-brand">
          <span className="brand-mark">
            <Dumbbell size={22} />
          </span>
          ploder<span className="brand-dot">.</span>
        </Link>
        <div className="sidebar-label">TRAINING</div>
        <nav className="desktop-navigation" aria-label="Main navigation">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className="desktop-nav-link"
            >
              <tab.icon size={19} />
              <span>{tab.label}</span>
              {tab.to === "/app/train" && activeWorkout && (
                <span className="live-dot" />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-icon">
              <Zap size={18} />
            </span>
            <h3>One rep at a time.</h3>
            <Link to="/app/progress">
              See progress <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="sidebar-profile">
            <AccountMenu />
            <div>
              <strong>{user?.firstName ?? "Account"}</strong>
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
              <strong>{current?.label ?? "Training"}</strong>
            </span>
          </div>
          <div className="topbar-actions">
            <InstallPrompt />
            <SyncStatus />
            <ThemeToggle />
            <Link
              to="/app/exercises"
              className="mobile-library"
              aria-label="Exercise library"
            >
              <Zap size={18} />
            </Link>
            <span className="mobile-user">
              <AccountMenu />
            </span>
            <Button asChild variant="outline" className="topbar-weighin">
              <Link to="/app/weight">
                <Scale size={15} />
                Weigh in
              </Link>
            </Button>
            {path !== "/app/train" && (
              <Button asChild className="topbar-start">
                <Link to="/app/train">
                  <Play size={15} />
                  {activeWorkout ? "Resume workout" : "Start workout"}
                </Link>
              </Button>
            )}
          </div>
        </header>
        <main id="app-main" className="app-main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>PLODER</span>
        </footer>
      </div>
      <Drawer
        direction="right"
        open={menuOpen}
        onOpenChange={(open) => setMenuValue(open ? "" : null)}
      >
        <nav className="mobile-navigation" aria-label="Mobile navigation">
          {mobileTabs.map((tab) => (
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
            <Link to="/app" className="app-brand" onClick={closeMenu}>
              <span className="brand-mark">
                <Dumbbell size={22} />
              </span>
              ploder<span className="brand-dot">.</span>
            </Link>
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
          </DrawerHeader>
          <div className="drawer-actions">
            <Button asChild onClick={closeMenu}>
              <Link to="/app/train">
                <Play size={15} />
                {activeWorkout ? "Resume workout" : "Start workout"}
              </Link>
            </Button>
            <Button asChild variant="outline" onClick={closeMenu}>
              <Link to="/app/weight">
                <Scale size={15} />
                Weigh in
              </Link>
            </Button>
          </div>
          <div className="sidebar-label drawer-label">TRAINING</div>
          <nav className="desktop-navigation" aria-label="Menu navigation">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                activeOptions={{ exact: tab.exact }}
                className="desktop-nav-link"
                onClick={closeMenu}
              >
                <tab.icon size={19} />
                <span>{tab.label}</span>
                {tab.to === "/app/train" && activeWorkout && (
                  <span className="live-dot" />
                )}
              </Link>
            ))}
          </nav>
          <div className="drawer-footer">
            <ThemeToggle className="desktop-nav-link" />
            <InstallPrompt />
            <div className="sidebar-profile">
              <AccountMenu withName />
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="drawer-close"
                >
                  <X size={23} />
                </button>
              </DrawerClose>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <PwaRegister />
    </div>
  );
}
