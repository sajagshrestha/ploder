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

import { InstallPrompt, PwaRegister } from "@/components/pwa";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Landing });

const features = [
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
      <div className="app-welcome">
        <div className="welcome-copy">
          <Link to="/" className="app-brand">
            <span className="brand-mark">
              <Dumbbell />
            </span>
            ploder<span className="brand-dot">.</span>
          </Link>
          <p className="eyebrow">YOUR EVERYDAY TRAINING COMPANION</p>
          <h1>
            Small steps.
            <br />
            Stronger you.
          </h1>
          <p>
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
          className="welcome-asset"
          src="/assets/training-dumbbell.png"
          alt="Dumbbell illustration"
        />
      </div>

      <div className="app-main" style={{ paddingTop: 0 }}>
        <div className="overview-page">
          <section className="workout-hero">
            <div className="hero-copy">
              <span className="hero-tag">
                <span className="live-dot" />
                YOUR NEXT CHAPTER
              </span>
              <h2>Show up.{"\n"}Get stronger.</h2>
              <p>
                A fresh session. A chance to surprise yourself. Your plan, your
                pace.
              </p>
              <Button asChild className="hero-button">
                <Link to="/app">
                  <Play size={17} fill="currentColor" />
                  Start workout
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
            </div>
            <img
              src="/assets/training-dumbbell.png"
              className="hero-dumbbell"
              alt=""
              width={960}
              height={720}
            />
          </section>

          <div className="stats-grid">
            {features.map((feature) => (
              <section className="stat-card" key={feature.title}>
                <div className="stat-label">
                  {feature.title}
                  <span className={`icon-tile ${feature.color}`}>
                    <feature.icon size={17} />
                  </span>
                </div>
                <p style={{ marginTop: 9 }}>{feature.text}</p>
              </section>
            ))}
          </div>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">COACHES & ADMINS</p>
                <h2>Curate the library</h2>
              </div>
              <Link to="/admin" className="icon-link" aria-label="Open admin">
                <ArrowUpRight size={20} />
              </Link>
            </div>
            <div className="recent-session-list">
              <Link to="/admin">
                <span className="session-icon">
                  <ShieldCheck size={20} />
                </span>
                <span className="session-name">
                  <strong>Open the admin panel</strong>
                  <small>Exercises, plans, members, and logged activity</small>
                </span>
                <ArrowRight size={17} />
              </Link>
            </div>
          </section>
        </div>
      </div>

      <footer className="app-footer">
        <span>PLODER / TRAIN WITH INTENTION</span>
      </footer>
      <PwaRegister />
    </div>
  );
}
