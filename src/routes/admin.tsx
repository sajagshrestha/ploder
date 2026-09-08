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
import { Eyebrow } from "@/components/ui/eyebrow";
import { useOverlayState } from "@/hooks/use-overlay-state";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type Me = { id: number; name: string; email: string; role: "user" | "admin" };

const BRAND_LINK =
  "inline-flex items-center gap-[11px] text-[29px] font-extrabold tracking-[-1.8px]";
const BRAND_MARK =
  "inline-flex h-[39px] w-[39px] -rotate-7 items-center justify-center rounded-[13px] bg-primary text-primary-foreground";
const BRAND_DOT = "ml-[-10px] text-chart-1";
const NAV_LINK =
  "flex min-h-[46px] items-center gap-[13px] rounded-[11px] px-[14px] py-[13px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground data-[status=active]:after:content-[''] data-[status=active]:after:ml-auto data-[status=active]:after:size-[5px] data-[status=active]:after:rounded-full data-[status=active]:after:bg-chart-1 max-tablet:gap-[9px] max-tablet:px-[10px] max-tablet:text-[11px]";
const MOBILE_TAB =
  "flex min-h-14 items-center justify-center rounded-[14px] text-muted-foreground transition active:scale-[0.94] data-[status=active]:bg-accent data-[status=active]:text-accent-foreground [&_svg]:[stroke-width:2.1]";

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
      <div className="training-app flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className={BRAND_MARK}>
          <Dumbbell />
        </div>
        <p className="text-xs text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="training-app flex min-h-dvh items-center gap-[30px] overflow-hidden p-[8vw] max-mobile:flex-col max-mobile:items-start max-mobile:px-[26px] max-mobile:py-[35px]">
        <div className="max-w-[550px] flex-1">
          <Link
            to="/"
            className={`${BRAND_LINK} mb-[65px] max-mobile:mb-[55px]`}
          >
            <span className={BRAND_MARK}>
              <Dumbbell />
            </span>
            ploder<span className={BRAND_DOT}>.</span>
          </Link>
          <Eyebrow>COACH & ADMIN SPACE</Eyebrow>
          <h1 className="text-[clamp(40px,5vw,76px)] leading-[1.1] font-bold tracking-[-3px] max-mobile:text-[48px]">
            Shape the
            <br />
            training library.
          </h1>
          <p className="my-[25px] max-w-[390px] leading-[1.8] text-muted-foreground">
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
          className="welcome-asset w-[45%] animate-float max-mobile:mt-[-20px] max-mobile:w-[80%] max-mobile:self-center"
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
  const [menuValue, setMenuValue] = useOverlayState("menu", {
    param: "menu",
  });
  const menuOpen = menuValue !== null;
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
      <div className="training-app flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className={BRAND_MARK}>
          <Dumbbell />
        </div>
        <p className="text-xs text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (me.isError || me.data?.data.role !== "admin") {
    return (
      <div className="training-app flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className="max-w-[550px] flex-1" style={{ textAlign: "center" }}>
          <Eyebrow>FORBIDDEN</Eyebrow>
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
    <div className="training-app min-h-dvh">
      <a
        href="#app-main"
        className="fixed top-[-100px] left-5 z-[100] rounded-lg bg-primary px-5 py-3 text-primary-foreground focus:top-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col border-r border-border bg-card px-[22px] pt-[32px] pb-5 max-desktop:w-[200px] max-desktop:px-[15px] max-tablet:w-[180px] max-mobile:hidden">
        <Link to="/admin" className={BRAND_LINK}>
          <span className={BRAND_MARK}>
            <Dumbbell size={22} />
          </span>
          ploder<span className={BRAND_DOT}>.</span>
        </Link>
        <div className="mx-[13px] mt-[49px] mb-4 text-[9px] font-bold tracking-[1.5px] text-muted-foreground max-tablet:text-[8px]">
          ADMINISTRATION
        </div>
        <nav className="grid gap-[7px]" aria-label="Admin navigation">
          {navItems.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className={NAV_LINK}
            >
              <tab.icon size={19} />
              <span>{tab.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-12">
          <div className="rounded-[15px] border border-border bg-background px-[15px] py-[18px]">
            <span className="mb-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-accent-foreground">
              <ShieldCheck size={18} />
            </span>
            <h3 className="text-xs font-bold">Coach with intention.</h3>
            <p className="mt-2 mb-4 text-[11px] leading-[1.8] text-muted-foreground">
              Curate exercises and plans your members will love to follow.
            </p>
            <Link
              to="/app"
              className="flex items-center gap-[9px] text-[11px] font-bold"
            >
              Open the tracker <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mt-[23px] flex items-center gap-[11px] border-t border-border px-[3px] pt-5">
            <UserButton />
            <div>
              <strong className="block text-xs">{displayName}</strong>
              <span className="mt-[3px] block text-[10px] text-muted-foreground">
                {displayEmail || "Admin account"}
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className="ml-[232px] min-w-0 max-desktop:ml-[200px] max-tablet:ml-[180px] max-mobile:ml-0">
        <header className="flex h-20 items-center justify-between gap-3 border-b border-border bg-background px-[38px] max-desktop:px-[25px] max-mobile:hidden">
          <div className="flex min-w-0 items-center gap-3 max-mobile:gap-[10px]">
            <span className="hidden text-chart-1 max-mobile:inline-flex">
              <Dumbbell size={22} />
            </span>
            <span className="flex min-w-0 flex-col leading-[1.25]">
              <span className="text-[9px] font-extrabold tracking-[1.6px] text-muted-foreground uppercase max-mobile:hidden">
                Administration
              </span>
              <strong className="text-[20px] font-extrabold tracking-[-0.6px] whitespace-nowrap text-foreground">
                {current?.label ?? "Dashboard"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 max-mobile:gap-[3px]">
            <InstallPrompt />
            <ThemeToggle />
            <span className="hidden max-mobile:inline-flex">
              <UserButton />
            </span>
            <Button
              asChild
              className="ml-3 h-[37px] rounded-[9px] px-4 text-xs max-mobile:hidden"
            >
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
        <nav
          className="fixed inset-x-0 bottom-0 z-20 hidden grid-cols-4 gap-1 border-t border-border bg-card px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_-16px_rgb(0_0_0/0.25)] [transform:translateZ(0)] max-mobile:grid"
          aria-label="Mobile admin navigation"
        >
          {adminMobileTabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              aria-label={tab.label}
              className={MOBILE_TAB}
            >
              <tab.icon size={23} />
            </Link>
          ))}
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className={`${MOBILE_TAB} cursor-pointer border-0 bg-transparent p-0`}
            >
              <Menu size={23} />
            </button>
          </DrawerTrigger>
        </nav>
        <DrawerContent
          side="right"
          className="w-[86vw]! max-w-[320px] gap-0! px-[20px]! pt-[22px]! pb-[calc(20px+env(safe-area-inset-bottom))]!"
        >
          <DrawerHeader className="mb-[18px] items-start gap-0! p-0!">
            <Link
              to="/admin"
              className="inline-flex items-center gap-[11px] text-[24px] font-extrabold tracking-[-1.8px]"
            >
              <span className="inline-flex h-[34px] w-[34px] -rotate-7 items-center justify-center rounded-[13px] bg-primary text-primary-foreground">
                <Dumbbell size={22} />
              </span>
              ploder<span className={BRAND_DOT}>.</span>
            </Link>
            <DrawerTitle className="sr-only">Menu</DrawerTitle>
          </DrawerHeader>
          <div className="mb-[6px] grid gap-2">
            <Button asChild>
              <Link to="/app">
                <Zap size={15} />
                Open tracker
              </Link>
            </Button>
          </div>
          <div className="mx-[13px]! mt-[18px]! mb-3! text-[9px] font-bold tracking-[1.5px] text-muted-foreground max-tablet:text-[8px]">
            ADMINISTRATION
          </div>
          <nav className="grid gap-[5px]" aria-label="Menu navigation">
            {navItems.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                activeOptions={{ exact: tab.exact }}
                className={NAV_LINK}
              >
                <tab.icon size={19} />
                <span>{tab.label}</span>
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-[14px] pt-6">
            <ThemeToggle className="flex min-h-[46px]! w-full items-center justify-start gap-[13px]! rounded-[11px] px-[14px] py-[13px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground max-tablet:px-[10px] max-tablet:text-[11px] [&_svg]:size-[19px]!" />
            <InstallPrompt />
            <div className="mt-[23px] flex items-center justify-between gap-[11px] border-t border-border px-[3px] pt-5">
              <UserButton />
              <div>
                <strong className="block text-xs">{displayName}</strong>
                <span className="mt-[3px] block text-[10px] text-muted-foreground">
                  {displayEmail || "Admin account"}
                </span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      <PwaRegister />
    </div>
  );
}
