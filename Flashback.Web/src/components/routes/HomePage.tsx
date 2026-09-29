import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

import type { Account } from "../../types/account";
import type { Page } from "../../types/navigation";

type Props = {
  account: Account | null;
  onNavigate: (page: Page) => void;
};

type BuildInfo = {
  installed: boolean;
  build: string;
  changelist: string;
  executablePath: string | null;
};

async function detectBuild(): Promise<BuildInfo | null> {
  try {
    return await invoke<BuildInfo>("detect_local_build");
  } catch {
    return null;
  }
}

async function launchBuild(): Promise<boolean> {
  try {
    await invoke<number>("launch_local_build");
    return true;
  } catch {
    return false;
  }
}

export default function HomePage({
  account,
  onNavigate,
}: Props) {
  const [build, setBuild] =
    useState<BuildInfo | null>(null);

  const [launching, setLaunching] =
    useState(false);

  const level =
    account?.profile?.level ?? 1;

  const credits =
    account?.profile?.flashbackCredits ?? 0;

  const displayName =
    account?.profile?.displayName ??
    account?.discordUsername ??
    account?.username ??
    "Guest";

  useEffect(() => {
    let mounted = true;

    void detectBuild().then((result) => {
      if (mounted) {
        setBuild(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  async function handlePlay() {
    if (!build?.installed) {
      onNavigate("library");
      return;
    }

    setLaunching(true);

    const started =
      await launchBuild();

    setLaunching(false);

    if (!started) {
      onNavigate("library");
    }
  }

  return (
    <main className="home-page">

      {/* HERO */}

      <section className="home-hero">

        <div className="hero-grid" />

        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />

        <div className="hero-copy">

          <span className="hero-kicker">
            PROJECT FLASHBACK / CLASSIC ERA
          </span>

          <h2>
            DROP BACK IN.
            <br />
            <span>PLAY CLASSIC.</span>
          </h2>

          <p>
            A dedicated desktop launcher for
            your classic library, account,
            progression and game builds.
          </p>

          <div className="hero-actions">

            <button
              className="button primary hero-play"
              onClick={() =>
                void handlePlay()
              }
              disabled={launching}
            >
              <span>
                {launching
                  ? "LAUNCHING..."
                  : build?.installed
                    ? "PLAY NOW"
                    : "OPEN LIBRARY"}
              </span>

              <span className="button-arrow">
                →
              </span>
            </button>

            <button
              className="button secondary"
              onClick={() =>
                onNavigate("library")
              }
            >
              LIBRARY
            </button>

          </div>

          <div className="hero-meta">

            <span className="meta-status">

              <span className="status-dot" />

              {build?.installed
                ? "BUILD READY"
                : "BUILD NOT INSTALLED"}

            </span>

            <span>
              12.50
            </span>

            <span>
              CL 13137020
            </span>

          </div>

        </div>

        {/* HERO ART */}

        <div
          className="hero-build-art"
          aria-hidden="true"
        >

          <div className="hero-slice slice-one" />

          <div className="hero-slice slice-two" />

          <div className="hero-slice slice-three" />

          <div className="hero-badge-large">
            12.50
          </div>

          <div className="hero-badge-small">
            CHAPTER 2 · SEASON 2
          </div>

        </div>

      </section>

      {/* DASHBOARD */}

      <section className="dashboard-grid">

        <div className="dashboard-main">

          <div className="section-head">

            <div>

              <span className="section-kicker">
                WELCOME BACK
              </span>

              <h3>
                {displayName}
              </h3>

            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate("settings")
              }
            >
              ACCOUNT →
            </button>

          </div>

          {/* STATS */}

          <div className="profile-stats">

            <StatCard
              label="LEVEL"
              value={String(level)}
              hint="CURRENT LEVEL"
              icon="01"
            />

            <StatCard
              label="CREDITS"
              value={credits.toLocaleString()}
              hint="FLASHBACK CREDITS"
              icon="V"
            />

            <StatCard
              label="WINS"
              value="0"
              hint="SEASON WINS"
              icon="★"
            />

            <StatCard
              label="KILLS"
              value="0"
              hint="TOTAL ELIMS"
              icon="✦"
            />

          </div>

          {/* BUILD CARD */}

          <article className="feature-card">

            <div className="feature-copy">

              <span className="section-kicker">
                CURRENT BUILD
              </span>

              <h3>
                Fortnite 12.50
              </h3>

              <p>
                Your current classic target is
                changelist 13137020. Manage the
                installation from Library.
              </p>

              <button
                className="button compact"
                onClick={() =>
                  onNavigate("library")
                }
              >
                MANAGE BUILD
              </button>

            </div>

            <div className="feature-build">

              <span>
                BUILD
              </span>

              <strong>
                12.50
              </strong>

              <small>
                CL 13137020
              </small>

              <small>
                {build?.installed
                  ? "READY TO LAUNCH"
                  : "AVAILABLE TO INSTALL"}
              </small>

            </div>

          </article>

        </div>

        {/* NEWS */}

        <aside className="dashboard-side">

          <div className="section-head">

            <div>

              <span className="section-kicker">
                LATEST
              </span>

              <h3>
                News
              </h3>

            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate("news")
              }
            >
              ALL →
            </button>

          </div>

          <NewsRow
            badge="01"
            title="Launcher rebuild"
            text="Project Flashback is becoming a complete desktop launcher."
          />

          <NewsRow
            badge="12.50"
            title="Classic build"
            text="The 12.50 build is now the primary launcher target."
          />

          <NewsRow
            badge="DC"
            title="Discord accounts"
            text="Sign in to keep your account and progression synced."
          />

        </aside>

      </section>

    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: string;
}) {
  return (
    <article className="stat-card">

      <div className="stat-card-top">

        <span>
          {label}
        </span>

        <span className="stat-card-icon">
          {icon}
        </span>

      </div>

      <strong>
        {value}
      </strong>

      <small>
        {hint}
      </small>

    </article>
  );
}

function NewsRow({
  badge,
  title,
  text,
}: {
  badge: string;
  title: string;
  text: string;
}) {
  return (
    <article className="news-row">

      <div className="news-badge">
        {badge}
      </div>

      <div>

        <span>
          FLASHBACK
        </span>

        <h4>
          {title}
        </h4>

        <p>
          {text}
        </p>

      </div>

    </article>
  );
}