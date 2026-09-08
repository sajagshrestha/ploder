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

const BRAND_LINK =
  "inline-flex items-center gap-[11px] text-[29px] font-extrabold tracking-[-1.8px]";
const BRAND_MARK =
  "inline-flex h-[39px] w-[39px] -rotate-7 items-center justify-center rounded-[13px] bg-primary text-primary-foreground";
const BRAND_DOT = "ml-[-10px] text-chart-1";
const NAV_LINK =
  "flex min-h-[46px] items-center gap-[13px] rounded-[11px] px-[14px] py-[13px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground data-[status=active]:after:content-[''] data-[status=active]:after:ml-auto data-[status=active]:after:size-[5px] data-[status=active]:after:rounded-full data-[status=active]:after:bg-chart-1 max-tablet:gap-[9px] max-tablet:px-[10px] max-tablet:text-[11px]";
const LIVE_DOT =
  "inline-block size-[6px] shrink-0 rounded-full bg-chart-1 shadow-[0_0_0_4px_color-mix(in_srgb,var(--chart-1)_20%,transparent)]";
const MOBILE_TAB =
  "flex min-h-14 items-center justify-center rounded-[14px] text-muted-foreground transition active:scale-[0.94] data-[status=active]:bg-accent data-[status=active]:text-accent-foreground [&_svg]:[stroke-width:2.1]";

function SyncStatus() {
  const online = useOnline();
  const pending = useOutboxCount();
  if (online && pending === 0) {
    return null;
  }
  return (
    <span
      className="inline-flex items-center gap-[6px] rounded-full border border-border bg-accent px-3 py-2 text-[11px] font-bold whitespace-nowrap text-accent-foreground max-mobile:p-2"
      role="status"
      title={online ? `${pending} to sync` : "Offline — saved here"}
    >
      <CloudOff size={14} />
      <span className="max-mobile:hidden">
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
      <div className="training-app flex min-h-dvh flex-col items-center justify-center gap-5">
        <div className={BRAND_MARK}>
          <Dumbbell />
        </div>
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  if (!isSignedIn)
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
          <h1 className="text-[clamp(40px,5vw,76px)] leading-[1.1] font-bold tracking-[-3px] max-mobile:text-[48px]">
            Small steps.
            <br />
            Stronger you.
          </h1>
          <p className="my-[25px] max-w-[390px] leading-[1.8] text-muted-foreground">
            Log sets, follow plan, see progress.
          </p>
          <SignInButton mode="modal">
            <Button size="lg">
              Get started <ArrowUpRight size={18} />
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
  return <SignedInLayout />;
}

const mobileTabs = [
  { to: "/app", label: "Home", icon: House, exact: true },
  { to: "/app/train", label: "Workout", icon: Dumbbell, exact: false },
  { to: "/app/progress", label: "Progress", icon: TrendingUp, exact: false },
] as const;

function SignedInLayout() {
  const { user } = useUser();
  const [menuValue, setMenuValue] = useOverlayState("menu", {
    param: "menu",
  });
  const menuOpen = menuValue !== null;
  const summary = useMySummary();
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/app";
  const current = tabs.find((tab) =>
    tab.exact ? path === "/app" || path === "/app/" : path.startsWith(tab.to),
  );
  const activeWorkout = summary.data?.data.activeWorkout;
  return (
    <div className="training-app min-h-dvh">
      <a
        href="#app-main"
        className="fixed top-[-100px] left-5 z-[100] rounded-lg bg-primary px-5 py-3 text-primary-foreground focus:top-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col border-r border-border bg-card px-[22px] pt-[32px] pb-5 max-desktop:w-[200px] max-desktop:px-[15px] max-tablet:w-[180px] max-mobile:hidden">
        <Link to="/app" className={BRAND_LINK}>
          <span className={BRAND_MARK}>
            <Dumbbell size={22} />
          </span>
          ploder<span className={BRAND_DOT}>.</span>
        </Link>
        <div className="mx-[13px] mt-[49px] mb-4 text-[9px] font-bold tracking-[1.5px] text-muted-foreground max-tablet:text-[8px]">
          TRAINING
        </div>
        <nav className="grid gap-[7px]" aria-label="Main navigation">
          {tabs.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              activeOptions={{ exact: tab.exact }}
              className={NAV_LINK}
            >
              <tab.icon size={19} />
              <span>{tab.label}</span>
              {tab.to === "/app/train" && activeWorkout && (
                <span className={`${LIVE_DOT} ml-auto`} />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-12">
          <div className="rounded-[15px] border border-border bg-background px-[15px] py-[18px]">
            <span className="mb-[15px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Zap size={18} />
            </span>
            <h3 className="text-xs font-bold">One rep at a time.</h3>
            <Link
              to="/app/progress"
              className="flex items-center gap-[9px] text-[11px] font-bold"
            >
              See progress <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mt-[23px] flex items-center gap-[11px] border-t border-border px-[3px] pt-5">
            <AccountMenu />
            <div>
              <strong className="block text-xs">
                {user?.firstName ?? "Account"}
              </strong>
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
              <strong className="text-[20px] font-extrabold tracking-[-0.6px] whitespace-nowrap text-foreground">
                {current?.label ?? "Training"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 max-mobile:gap-[3px]">
            <InstallPrompt />
            <SyncStatus />
            <ThemeToggle />
            <Link
              to="/app/exercises"
              className="hidden max-mobile:inline-flex max-mobile:size-9 max-mobile:items-center max-mobile:justify-center max-mobile:rounded-[9px]"
              aria-label="Exercise library"
            >
              <Zap size={18} />
            </Link>
            <span className="hidden max-mobile:inline-flex">
              <AccountMenu />
            </span>
            <Button
              asChild
              variant="outline"
              className="ml-1 h-[37px] rounded-[9px] px-[14px] text-xs max-mobile:hidden"
            >
              <Link to="/app/weight">
                <Scale size={15} />
                Weigh in
              </Link>
            </Button>
            {path !== "/app/train" && (
              <Button
                asChild
                className="ml-3 h-[37px] rounded-[9px] px-4 text-xs max-mobile:hidden"
              >
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
        <nav
          className="fixed inset-x-0 bottom-0 z-20 hidden grid-cols-4 gap-1 border-t border-border bg-card px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[0_-8px_20px_-16px_rgb(0_0_0/0.25)] [transform:translateZ(0)] max-mobile:grid"
          aria-label="Mobile navigation"
        >
          {mobileTabs.map((tab) => (
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
              to="/app"
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
              <Link to="/app/train">
                <Play size={15} />
                {activeWorkout ? "Resume workout" : "Start workout"}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/app/weight">
                <Scale size={15} />
                Weigh in
              </Link>
            </Button>
          </div>
          <div className="mx-[13px]! mt-[18px]! mb-3! text-[9px] font-bold tracking-[1.5px] text-muted-foreground max-tablet:text-[8px]">
            TRAINING
          </div>
          <nav className="grid gap-[5px]" aria-label="Menu navigation">
            {tabs.map((tab) => (
              <Link
                key={tab.to}
                to={tab.to}
                activeOptions={{ exact: tab.exact }}
                className={NAV_LINK}
              >
                <tab.icon size={19} />
                <span>{tab.label}</span>
                {tab.to === "/app/train" && activeWorkout && (
                  <span className={`${LIVE_DOT} ml-auto`} />
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto grid gap-[14px] pt-6">
            <ThemeToggle className="flex min-h-[46px]! w-full items-center justify-start gap-[13px]! rounded-[11px] px-[14px] py-[13px] text-[13px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground max-tablet:px-[10px] max-tablet:text-[11px] [&_svg]:size-[19px]!" />
            <InstallPrompt />
            <div className="mt-[23px] flex items-center justify-between gap-[11px] border-t border-border px-[3px] pt-5">
              <AccountMenu withName />
              <DrawerClose asChild>
                <button
                  type="button"
                  aria-label="Close menu"
                  className="flex min-h-14 min-w-14 cursor-pointer items-center justify-center rounded-[14px] border-0 bg-transparent p-0 text-muted-foreground transition active:scale-[0.94]"
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
