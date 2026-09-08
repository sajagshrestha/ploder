import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Dumbbell,
  Play,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from "lucide-react";

import { IconTile, type IconTileTone } from "@/components/app/icon-tile";
import { Panel, PanelHeading } from "@/components/app/panel";
import { InstallPrompt, PwaRegister } from "@/components/pwa";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";

export const Route = createFileRoute("/")({ component: Landing });

const features: {
  icon: typeof Play;
  title: string;
  text: string;
  color: IconTileTone;
}[] = [
  {
    icon: Play,
    title: "Start training in seconds",
    text: "Pick a day from your split or go freestyle — exercises preload automatically.",
    color: "lime",
  },
  {
    icon: Dumbbell,
    title: "Log every set",
    text: "Weight, reps, and warmups with big touch-friendly inputs built for the gym floor.",
    color: "peach",
  },
  {
    icon: CalendarDays,
    title: "Follow coach splits",
    text: "Clone professionally built templates into your own training week.",
    color: "purple",
  },
  {
    icon: TrendingUp,
    title: "Watch progress",
    text: "Body-weight trends, weekly volume, and full workout history.",
    color: "blue",
  },
  {
    icon: Smartphone,
    title: "Installs like an app",
    text: "Add Ploder to your home screen for a fullscreen, offline-ready experience.",
    color: "lime",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    text: "Your workouts and weigh-ins are visible only to you.",
    color: "peach",
  },
];

function Landing() {
  return (
    <div className="training-app">
      <div className="flex min-h-dvh items-center gap-[30px] overflow-hidden p-[8vw] max-mobile:flex-col max-mobile:items-start max-mobile:px-[26px] max-mobile:py-[35px]">
        <div className="max-w-[550px] flex-1">
          <Link
            to="/"
            className="mb-[65px] inline-flex items-center gap-[11px] text-[29px] font-extrabold tracking-[-1.8px] max-mobile:mb-[55px]"
          >
            <span className="inline-flex h-[39px] w-[39px] -rotate-7 items-center justify-center rounded-[13px] bg-primary text-primary-foreground">
              <Dumbbell />
            </span>
            ploder<span className="ml-[-10px] text-chart-1">.</span>
          </Link>
          <Eyebrow>YOUR EVERYDAY TRAINING COMPANION</Eyebrow>
          <h1 className="text-[clamp(40px,5vw,76px)] leading-[1.1] font-bold tracking-[-3px] max-mobile:text-[48px]">
            Small steps.
            <br />
            Stronger you.
          </h1>
          <p className="my-[25px] max-w-[390px] leading-[1.8] text-muted-foreground">
            Find your rhythm. Log every set, follow your plan, and see your
            consistency turn into progress — no spreadsheets.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button asChild size="lg">
              <Link to="/app">
                Open the tracker <ArrowUpRight size={18} />
              </Link>
            </Button>
            <InstallPrompt />
          </div>
        </div>
        <img
          className="welcome-asset w-[45%] animate-float max-mobile:mt-[-20px] max-mobile:w-[80%] max-mobile:self-center"
          src="/assets/training-dumbbell.png"
          alt="Dumbbell illustration"
        />
      </div>

      <div className="app-main" style={{ paddingTop: 0 }}>
        <div className="grid gap-6 max-mobile:gap-[18px]">
          <section className="workout-hero">
            <div className="relative z-[2] max-w-[62%] p-[30px] max-desktop:max-w-[70%] max-desktop:p-[25px] max-tablet:max-w-[58%] max-mobile:max-w-[70%] max-mobile:px-[22px] max-mobile:py-[26px] wide:p-9">
              <span className="inline-flex items-center gap-[7px] rounded-full bg-[#2f3c25] px-3 py-[7px] text-[8px] font-extrabold tracking-[1.3px] text-[#eef4e2] max-mobile:text-[7px]">
                <span className="inline-block size-[6px] shrink-0 rounded-full bg-chart-1 shadow-[0_0_0_4px_color-mix(in_srgb,var(--chart-1)_20%,transparent)]" />
                YOUR NEXT CHAPTER
              </span>
              <h2 className="mt-5 mb-3 text-[clamp(30px,3vw,46px)] leading-[1.05] font-extrabold tracking-[-2px] whitespace-pre-line [text-wrap:balance] max-tablet:text-[38px] max-mobile:mt-[21px] max-mobile:text-[33px] max-mobile:tracking-[-1.25px] wide:text-[44px]">
                Show up.{"\n"}Get stronger.
              </h2>
              <p className="mb-[22px] max-w-[250px] text-xs leading-[1.7] font-semibold text-[#4a5741] max-mobile:max-w-[185px] max-mobile:text-[11px]">
                A fresh session. A chance to surprise yourself. Your plan, your
                pace.
              </p>
              <Button
                asChild
                className="min-h-12 rounded-xl border-0! bg-[#2f3c25]! px-[18px] text-xs font-extrabold tracking-[0.02em] text-[#f4f8ed]! shadow-[0_12px_22px_-12px_#2f3c25aa] hover:bg-[#435534]! hover:-translate-y-px max-mobile:text-[11px]"
              >
                <Link to="/app">
                  <Play size={17} fill="currentColor" />
                  Start workout
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
            </div>
            <img
              src="/assets/training-dumbbell.png"
              className="hero-dumbbell pointer-events-none absolute top-[3%] right-[-10%] w-[64%] max-w-none -rotate-12 animate-float max-desktop:right-[-20%] max-tablet:top-[-4%] max-tablet:right-[-3%] max-tablet:w-[55%] max-mobile:top-[17%] max-mobile:right-[-6%] max-mobile:w-[58%] max-mobile:opacity-95"
              alt=""
              width={960}
              height={720}
            />
          </section>

          <div className="grid grid-cols-4 gap-[17px] has-[>:nth-child(2):last-child]:grid-cols-2 has-[>:nth-child(3):last-child]:grid-cols-3 max-desktop:gap-3 max-tablet:grid-cols-2 max-mobile:gap-[11px]">
            {features.map((feature) => (
              <section
                className="rounded-[15px] border border-border bg-card p-[19px] max-desktop:p-[15px] max-mobile:p-4"
                key={feature.title}
              >
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground max-desktop:text-[9px] max-mobile:text-[10px]">
                  {feature.title}
                  <IconTile tone={feature.color}>
                    <feature.icon size={17} />
                  </IconTile>
                </div>
                <p
                  className="text-[10px] leading-[1.6] text-muted-foreground max-mobile:leading-[1.5]"
                  style={{ marginTop: 9 }}
                >
                  {feature.text}
                </p>
              </section>
            ))}
          </div>

          <Panel>
            <PanelHeading>
              <div>
                <Eyebrow className="mb-[7px] text-[8px] tracking-[1.25px]">
                  COACHES & ADMINS
                </Eyebrow>
                <h2 className="text-[15px] font-bold tracking-[-0.35px]">
                  Curate the library
                </h2>
              </div>
              <Link to="/admin" className="icon-link" aria-label="Open admin">
                <ArrowUpRight size={20} />
              </Link>
            </PanelHeading>
            <div>
              <Link
                to="/admin"
                className="flex items-center gap-[14px] border-b border-border py-[15px] transition-colors last:border-b-0 last:pb-0 hover:bg-background"
              >
                <span className="grid size-[39px] shrink-0 place-items-center rounded-[11px] bg-muted text-muted-foreground max-mobile:size-[34px]">
                  <ShieldCheck size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[13px] font-semibold max-mobile:text-xs">
                    Open the admin panel
                  </strong>
                  <small className="mt-[5px] block text-[11px] text-muted-foreground">
                    Exercises, plans, members, and logged activity
                  </small>
                </span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </Panel>
        </div>
      </div>

      <footer className="app-footer">
        <span>PLODER / TRAIN WITH INTENTION</span>
      </footer>
      <PwaRegister />
    </div>
  );
}
