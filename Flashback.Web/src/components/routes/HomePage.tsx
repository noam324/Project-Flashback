import {
  useEffect,
  useState,
} from "react";

import type { Account } from "../../types/account";
import type { Page } from "../../types/navigation";

import { useLauncherStore } from "../../store/launcherStore";

type Props = {
  account: Account | null;
  onNavigate: (page: Page) => void;
};

type BuildInfo = {
  installed: boolean;
  build: string;
  changelist: string;
  versionCompatible?: boolean;
  detectedVersion?: string;
  rootPath?: string | null;
  executablePath: string | null;
  validationMessage?: string;
};

type NewsItem = {
  tag: string;
  title: string;
  description: string;
  mark: string;
};

function isTauriRuntime(): boolean {
  const tauri = (
    window as Window & {
      __TAURI_INTERNALS__?: unknown;
    }
  ).__TAURI_INTERNALS__;

  return Boolean(tauri);
}

async function tauriInvoke<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error(
      "Project Flashback desktop launcher is required for this action."
    );
  }

  const module = await import(
    "@tauri-apps/api/core"
  );

  if (
    !module ||
    typeof module.invoke !== "function"
  ) {
    throw new Error(
      "Tauri invoke is unavailable."
    );
  }

  return module.invoke<T>(
    command,
    args
  );
}

async function detectBuild(): Promise<BuildInfo | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  try {
    return await tauriInvoke<BuildInfo>(
      "detect_local_build"
    );
  } catch {
    return null;
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

  const [launchError, setLaunchError] =
    useState("");

  const [launchInfo, setLaunchInfo] =
    useState("");

  const selectedBuild =
    useLauncherStore(
      (state) => state.selectedBuild
    );

  const setSelectedBuild =
    useLauncherStore(
      (state) => state.setSelectedBuild
    );

  const displayName =
    account?.profile?.displayName ??
    account?.discordUsername ??
    account?.username ??
    "Player";

  const level =
    account?.profile?.level ?? 1;

  useEffect(() => {
    let mounted = true;

    void detectBuild().then((result) => {
      if (!mounted) {
        return;
      }

      setBuild(result);

      if (
        result?.installed &&
        result.executablePath &&
        !selectedBuild
      ) {
        setSelectedBuild({
          build: result.build,
          changelist:
            result.changelist,
          executablePath:
            result.executablePath,
        });
      }
    });

    return () => {
      mounted = false;
    };
  }, [
    selectedBuild,
    setSelectedBuild,
  ]);

  async function handlePlay() {
    setLaunchError("");
    setLaunchInfo("");

    if (!isTauriRuntime()) {
      setLaunchInfo(
        "Open Project Flashback as the desktop launcher to start the selected Build."
      );

      onNavigate("library");
      return;
    }

    setLaunching(true);

    try {
      let executablePath =
        selectedBuild?.executablePath ??
        build?.executablePath ??
        null;

      if (!executablePath) {
        const detected =
          await detectBuild();

        if (
          detected?.installed &&
          detected.executablePath
        ) {
          executablePath =
            detected.executablePath;

          setBuild(detected);

          setSelectedBuild({
            build:
              detected.build,
            changelist:
              detected.changelist,
            executablePath:
              detected.executablePath,
          });
        }
      }

      if (!executablePath) {
        setLaunchInfo(
          "No Build is selected. Choose your Build first."
        );

        onNavigate("library");
        return;
      }

      await tauriInvoke<number>(
        "launch_local_build",
        {
          executablePath,
        }
      );
    } catch (error) {
      setLaunchError(
        error instanceof Error
          ? error.message
          : "Failed to launch the selected Build."
      );
    } finally {
      setLaunching(false);
    }
  }

  const ready =
    Boolean(
      selectedBuild?.executablePath ??
      build?.executablePath
    );

  const news: NewsItem[] = [
    {
      tag: "UPDATE",
      title:
        "Project Flashback launcher rebuild",
      description:
        "The launcher is being rebuilt as a complete desktop experience.",
      mark: "PF",
    },
    {
      tag: "BUILD",
      title:
        "Classic 12.50 support",
      description:
        "Build 12.50 with CL 13137020 is the current classic target.",
      mark: "12.50",
    },
    {
      tag: "ACCOUNT",
      title:
        "Discord authentication",
      description:
        "Your launcher account stays connected to Discord.",
      mark: "DC",
    },
  ];

  return (
    <main className="home-page">
      <div className="home-content">

        <section className="welcome-row">
          <div>
            <span className="page-kicker">
              DASHBOARD
            </span>

            <h1>
              Welcome back,{" "}
              <span>
                {displayName}
              </span>
            </h1>

            <p>
              Your classic launcher is ready.
              Select a Build and drop in.
            </p>
          </div>

          <div className="welcome-level-card">
            <span>
              LEVEL
            </span>

            <strong>
              {level}
            </strong>
          </div>
        </section>

        {launchInfo && (
          <div className="launch-info">
            <strong>
              DESKTOP LAUNCHER
            </strong>

            <span>
              {launchInfo}
            </span>
          </div>
        )}

        {launchError && (
          <div className="launch-error">
            <strong>
              LAUNCH ERROR
            </strong>

            <span>
              {launchError}
            </span>
          </div>
        )}

        <section className="launch-panel">
          <div className="launch-background-grid" />

          <div className="launch-copy">
            <span className="section-kicker">
              CURRENT BUILD
            </span>

            <h2>
              Fortnite 12.50
            </h2>

            <p>
              <span>
                Chapter 2 / Season 2
              </span>

              <span>
                •
              </span>

              <span>
                Changelist 13137020
              </span>
            </p>

            <div className="launch-status">
              <span
                className={
                  ready
                    ? "launch-status-dot ready"
                    : "launch-status-dot"
                }
              />

              <span>
                {ready
                  ? "BUILD READY"
                  : "BUILD NOT INSTALLED"}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="launch-button"
            onClick={() =>
              void handlePlay()
            }
            disabled={launching}
          >
            <span className="launch-button-icon">
              ▶
            </span>

            <span className="launch-button-copy">
              <strong>
                {launching
                  ? "LAUNCHING..."
                  : "PLAY NOW"}
              </strong>

              <small>
                {ready
                  ? "START CLASSIC BUILD"
                  : "OPEN BUILD SELECTOR"}
              </small>
            </span>

            <span className="launch-button-arrow">
              →
            </span>
          </button>
        </section>

        <section className="stats-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                PLAYER OVERVIEW
              </span>

              <h2>
                Your Profile
              </h2>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              icon="◎"
              title="LEVEL"
              value={String(level)}
              subtitle="CURRENT LEVEL"
            />

            <StatCard
              icon="★"
              title="WINS"
              value="0"
              subtitle="SEASON WINS"
            />

            <StatCard
              icon="✦"
              title="ELIMINATIONS"
              value="0"
              subtitle="TOTAL ELIMS"
            />

            <StatCard
              icon="◈"
              title="BUILD"
              value="12.50"
              subtitle="CL 13137020"
            />
          </div>
        </section>

        <section className="dashboard-lower">

          <div className="dashboard-profile-card">
            <div className="profile-card-header">
              <div>
                <span className="section-kicker">
                  ACCOUNT
                </span>

                <h2>
                  Player Profile
                </h2>
              </div>

              <button
                type="button"
                className="subtle-button"
                onClick={() =>
                  onNavigate("settings")
                }
              >
                SETTINGS →
              </button>
            </div>

            <div className="profile-main">
              <div className="profile-avatar-large">
                {account?.discordAvatarUrl ? (
                  <img
                    src={
                      account.discordAvatarUrl
                    }
                    alt=""
                  />
                ) : (
                  displayName
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </div>

              <div className="profile-main-copy">
                <strong>
                  {displayName}
                </strong>

                <span>
                  DISCORD CONNECTED
                </span>

                <small>
                  LEVEL {level}
                </small>
              </div>

              <div className="profile-side-stat">
                <span>
                  WINS
                </span>

                <strong>
                  0
                </strong>
              </div>
            </div>
          </div>

          <div className="dashboard-build-card">
            <div className="profile-card-header">
              <div>
                <span className="section-kicker">
                  ACTIVE TARGET
                </span>

                <h2>
                  Classic Build
                </h2>
              </div>
            </div>

            <div className="build-summary">
              <div className="build-summary-version">
                12.50
              </div>

              <div className="build-summary-copy">
                <strong>
                  Fortnite 12.50
                </strong>

                <span>
                  CL 13137020
                </span>

                <small>
                  {ready
                    ? "READY TO LAUNCH"
                    : "NO BUILD SELECTED"}
                </small>
              </div>
            </div>

            <button
              type="button"
              className="subtle-button wide"
              onClick={() =>
                onNavigate("library")
              }
            >
              MANAGE BUILD →
            </button>
          </div>

        </section>

        <section className="news-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                UPDATES
              </span>

              <h2>
                Latest News
              </h2>
            </div>

            <button
              type="button"
              className="subtle-button"
              onClick={() =>
                onNavigate("news")
              }
            >
              VIEW ALL →
            </button>
          </div>

          <div className="news-list">
            {news.map((item) => (
              <article
                className="news-card"
                key={item.title}
              >
                <div className="news-thumbnail">
                  <span>
                    {item.mark}
                  </span>
                </div>

                <div className="news-content">
                  <span className="news-tag">
                    {item.tag}
                  </span>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.description}
                  </p>
                </div>

                <span className="news-arrow">
                  →
                </span>
              </article>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}

function StatCard({
  icon,
  title,
  value,
  subtitle,
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-card-header">
        <span className="stat-card-title">
          {title}
        </span>

        <span className="stat-card-icon">
          {icon}
        </span>
      </div>

      <strong className="stat-card-value">
        {value}
      </strong>

      <span className="stat-card-subtitle">
        {subtitle}
      </span>
    </article>
  );
}