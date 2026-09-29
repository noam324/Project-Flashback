import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

type Settings = {
  launchOnStartup: boolean;
  closeToTray: boolean;
  animations: boolean;
  compactMode: boolean;
};

const STORAGE_KEY = "project-flashback-settings";

const defaultSettings: Settings = {
  launchOnStartup: false,
  closeToTray: false,
  animations: true,
  compactMode: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return defaultSettings;
    }

    return {
      ...defaultSettings,
      ...(JSON.parse(raw) as Partial<Settings>),
    };
  } catch {
    return defaultSettings;
  }
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(loadSettings);

  const [buildPath, setBuildPath] =
    useState("Auto-detected");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  }, [settings]);

  async function chooseBuildLocation() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title:
          "Select your Project Flashback build folder",
      });

      if (typeof selected !== "string") {
        return;
      }

      const result =
        await invoke<{
          rootPath?: string | null;
          executablePath?: string | null;
          build: string;
          changelist: string;
        }>(
          "validate_build_directory",
          {
            path: selected,
          }
        );

      setBuildPath(
        result.rootPath ?? selected
      );

      setMessage(
        `Build ${result.build} selected successfully.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Invalid build folder."
      );
    }
  }

  function toggle(
    key: keyof Settings
  ) {
    setSettings((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  function resetSettings() {
    setSettings(defaultSettings);
    setBuildPath("Auto-detected");
    setMessage("Settings restored to defaults.");
  }

  return (
    <main className="route-page settings-page">

      <div className="settings-heading">
        <div>
          <span className="section-kicker">
            CONFIGURATION
          </span>

          <h2>
            Settings
          </h2>

          <p>
            Configure how Project Flashback
            behaves on your PC.
          </p>
        </div>

        <button
          className="button ghost"
          onClick={resetSettings}
        >
          RESET
        </button>
      </div>

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}

      <section className="settings-grid">

        <article className="settings-card">

          <div className="settings-card-head">
            <div>
              <span className="section-kicker">
                GENERAL
              </span>

              <h3>
                Launcher
              </h3>
            </div>

            <span className="settings-card-number">
              01
            </span>
          </div>

          <SettingRow
            title="Launch with Windows"
            description="Start Project Flashback when Windows starts."
            enabled={settings.launchOnStartup}
            onClick={() =>
              toggle("launchOnStartup")
            }
          />

          <SettingRow
            title="Close to tray"
            description="Keep the launcher running when its window is closed."
            enabled={settings.closeToTray}
            onClick={() =>
              toggle("closeToTray")
            }
          />

          <SettingRow
            title="Animations"
            description="Enable launcher transitions and visual effects."
            enabled={settings.animations}
            onClick={() =>
              toggle("animations")
            }
          />

          <SettingRow
            title="Compact mode"
            description="Use tighter spacing throughout the launcher."
            enabled={settings.compactMode}
            onClick={() =>
              toggle("compactMode")
            }
          />

        </article>

        <article className="settings-card">

          <div className="settings-card-head">
            <div>
              <span className="section-kicker">
                GAME
              </span>

              <h3>
                Build Location
              </h3>
            </div>

            <span className="settings-card-number">
              02
            </span>
          </div>

          <div className="settings-path">

            <span>
              CURRENT TARGET
            </span>

            <strong>
              {buildPath}
            </strong>

          </div>

          <button
            className="button primary full"
            onClick={() =>
              void chooseBuildLocation()
            }
          >
            CHANGE BUILD LOCATION
          </button>

          <p className="settings-note">
            Flashback validates the selected folder
            before using it as a launch target.
          </p>

        </article>

        <article className="settings-card">

          <div className="settings-card-head">
            <div>
              <span className="section-kicker">
                ACCOUNT
              </span>

              <h3>
                Discord
              </h3>
            </div>

            <span className="settings-card-number">
              03
            </span>
          </div>

          <div className="account-setting">

            <div className="account-setting-icon">
              ◉
            </div>

            <div>
              <strong>
                Discord Authentication
              </strong>

              <p>
                Your profile, level and credits
                are synchronized through your account.
              </p>
            </div>

          </div>

          <div className="settings-status">
            <span className="status-dot" />
            SERVER-SIDE ACCOUNT SYNC READY
          </div>

        </article>

        <article className="settings-card">

          <div className="settings-card-head">
            <div>
              <span className="section-kicker">
                ABOUT
              </span>

              <h3>
                Project Flashback
              </h3>
            </div>

            <span className="settings-card-number">
              04
            </span>
          </div>

          <div className="about-list">

            <div>
              <span>
                VERSION
              </span>

              <strong>
                0.1.0
              </strong>
            </div>

            <div>
              <span>
                BUILD
              </span>

              <strong>
                12.50
              </strong>
            </div>

            <div>
              <span>
                CHANGELIST
              </span>

              <strong>
                13137020
              </strong>
            </div>

          </div>

        </article>

      </section>

    </main>
  );
}

function SettingRow({
  title,
  description,
  enabled,
  onClick,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="setting-row"
      onClick={onClick}
    >
      <span className="setting-copy">
        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>
      </span>

      <span
        className={
          enabled
            ? "toggle active"
            : "toggle"
        }
      >
        <span />
      </span>
    </button>
  );
}