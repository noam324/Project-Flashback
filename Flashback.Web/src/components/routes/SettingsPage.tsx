import { useEffect, useState } from "react";

type Settings = {
  launchOnStartup: boolean;
  closeToTray: boolean;
  animations: boolean;
  compactMode: boolean;
};

type SettingsPageProps = {
  sessionToken: string | null;
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
    const raw =
      localStorage.getItem(STORAGE_KEY);

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

export default function SettingsPage({
  sessionToken,
}: SettingsPageProps) {
  const [settings, setSettings] =
    useState<Settings>(loadSettings);

  const [buildPath, setBuildPath] =
    useState("Auto-detected");

  const [message, setMessage] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );
  }, [settings]);

  useEffect(() => {
    if (!sessionToken) {
      setIsAdmin(false);
      return;
    }

    let mounted = true;

    void fetch("/api/admin/status", {
      headers: {
        Authorization:
          `Bearer ${sessionToken}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const data =
          (await response.json()) as {
            isAdmin?: boolean;
          };

        return data.isAdmin === true;
      })
      .then((admin) => {
        if (mounted) {
          setIsAdmin(admin);
        }
      })
      .catch(() => {
        if (mounted) {
          setIsAdmin(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [sessionToken]);

  async function chooseBuildLocation() {
    try {
      const tauri =
        (window as Window & {
          __TAURI_INTERNALS__?: unknown;
        }).__TAURI_INTERNALS__;

      if (!tauri) {
        setMessage(
          "Open the desktop launcher to change the Build location."
        );
        return;
      }

      const { open } =
        await import(
          "@tauri-apps/plugin-dialog"
        );

      const { invoke } =
        await import(
          "@tauri-apps/api/core"
        );

      const selected =
        await open({
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
    setMessage(
      "Settings restored to defaults."
    );
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
          type="button"
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
            type="button"
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
                Your Project Flashback account is
                synchronized through Discord.
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

      {isAdmin && sessionToken && (
        <AdminPanel
          sessionToken={sessionToken}
        />
      )}
    </main>
  );
}

function AdminPanel({
  sessionToken,
}: {
  sessionToken: string;
}) {
  type Player = {
    id: string;
    username: string;
    discordUsername: string;
    discordUserId: string;
    displayName: string;
    avatarUrl: string | null;
  };

  type LockerItem = {
    itemKey: string;
    itemName: string;
    category: string;
  };

  type LockerResponse = {
    fullLockerAccess: boolean;
    items: LockerItem[];
  };

  const [query, setQuery] =
    useState("");

  const [players, setPlayers] =
    useState<Player[]>([]);

  const [selectedPlayer, setSelectedPlayer] =
    useState<Player | null>(null);

  const [locker, setLocker] =
    useState<LockerResponse>({
      fullLockerAccess: false,
      items: [],
    });

  const [itemKey, setItemKey] =
    useState("");

  const [itemName, setItemName] =
    useState("");

  const [category, setCategory] =
    useState("Cosmetic");

  const [busy, setBusy] =
    useState(false);

  const [adminMessage, setAdminMessage] =
    useState("");

  async function api(
    path: string,
    options?: RequestInit
  ) {
    const response =
      await fetch(path, {
        ...options,
        headers: {
          ...(options?.headers ?? {}),
          Authorization:
            `Bearer ${sessionToken}`,
        },
      });

    if (!response.ok) {
      const data =
        await response
          .json()
          .catch(() => null) as
          | { error?: string }
          | null;

      throw new Error(
        data?.error ??
        `Request failed (${response.status}).`
      );
    }

    return response;
  }

  async function searchPlayers() {
    setBusy(true);
    setAdminMessage("");

    try {
      const response =
        await api(
          `/api/admin/players?query=${encodeURIComponent(query)}`
        );

      setPlayers(
        (await response.json()) as Player[]
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Player search failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadLocker(
    player: Player
  ) {
    setSelectedPlayer(player);
    setBusy(true);
    setAdminMessage("");

    try {
      const response =
        await api(
          `/api/admin/players/${player.id}/locker`
        );

      setLocker(
        (await response.json()) as LockerResponse
      );
    } catch (error) {
      setLocker({
        fullLockerAccess: false,
        items: [],
      });

      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Could not load locker."
      );
    } finally {
      setBusy(false);
    }
  }

  async function setFullLocker(
    enabled: boolean
  ) {
    if (!selectedPlayer) {
      return;
    }

    setBusy(true);
    setAdminMessage("");

    try {
      await api(
        `/api/admin/players/${selectedPlayer.id}/locker/full`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            enabled,
          }),
        }
      );

      await loadLocker(
        selectedPlayer
      );

      setAdminMessage(
        enabled
          ? "Full Locker enabled."
          : "Full Locker disabled."
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Could not update Full Locker."
      );

      setBusy(false);
    }
  }

  async function giveItem() {
    if (!selectedPlayer) {
      setAdminMessage(
        "Select a player first."
      );
      return;
    }

    if (!itemKey.trim()) {
      setAdminMessage(
        "Enter an item key."
      );
      return;
    }

    setBusy(true);
    setAdminMessage("");

    try {
      await api(
        `/api/admin/players/${selectedPlayer.id}/locker/item`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            itemKey:
              itemKey.trim(),
            itemName:
              itemName.trim() ||
              itemKey.trim(),
            category:
              category.trim() ||
              "Cosmetic",
          }),
        }
      );

      setItemKey("");
      setItemName("");

      await loadLocker(
        selectedPlayer
      );

      setAdminMessage(
        "Item granted."
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Could not give item."
      );

      setBusy(false);
    }
  }

  async function removeItem(
    key: string
  ) {
    if (!selectedPlayer) {
      return;
    }

    setBusy(true);
    setAdminMessage("");

    try {
      await api(
        `/api/admin/players/${selectedPlayer.id}/locker/item/${encodeURIComponent(key)}`,
        {
          method: "DELETE",
        }
      );

      await loadLocker(
        selectedPlayer
      );

      setAdminMessage(
        "Item removed."
      );
    } catch (error) {
      setAdminMessage(
        error instanceof Error
          ? error.message
          : "Could not remove item."
      );

      setBusy(false);
    }
  }

  return (
    <section className="admin-panel">
      <div className="settings-card-head">
        <div>
          <span className="section-kicker">
            ADMIN
          </span>

          <h3>
            Player Management
          </h3>

          <p className="admin-note">
            Server-side controls for
            Project Flashback account
            entitlements.
          </p>
        </div>

        <span className="settings-card-number">
          05
        </span>
      </div>

      {adminMessage && (
        <div className="settings-message">
          {adminMessage}
        </div>
      )}

      <div className="admin-search-row">
        <input
          className="admin-input"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void searchPlayers();
            }
          }}
          placeholder="Username, Discord name, or Discord ID"
        />

        <button
          className="button secondary"
          type="button"
          disabled={busy}
          onClick={() =>
            void searchPlayers()
          }
        >
          SEARCH
        </button>
      </div>

      <div className="admin-player-list">
        {players.length === 0 ? (
          <div className="admin-empty">
            Search for a player to manage.
          </div>
        ) : (
          players.map((player) => (
            <button
              type="button"
              key={player.id}
              className={
                selectedPlayer?.id === player.id
                  ? "admin-player active"
                  : "admin-player"
              }
              onClick={() =>
                void loadLocker(player)
              }
            >
              <span className="admin-player-avatar">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt=""
                  />
                ) : (
                  player.displayName
                    .slice(0, 1)
                    .toUpperCase()
                )}
              </span>

              <span className="admin-player-copy">
                <strong>
                  {player.displayName}
                </strong>

                <small>
                  @{player.discordUsername}
                </small>
              </span>
            </button>
          ))
        )}
      </div>

      {selectedPlayer && (
        <div className="admin-locker">
          <div className="admin-locker-head">
            <div>
              <span className="section-kicker">
                SELECTED PLAYER
              </span>

              <h4>
                {selectedPlayer.displayName}
              </h4>
            </div>

            <span className="admin-selected-id">
              Discord ID: {selectedPlayer.discordUserId}
            </span>
          </div>

          <div className="admin-full-locker">
            <div>
              <strong>
                Full Locker Access
              </strong>

              <small>
                Project-managed entitlement.
              </small>
            </div>

            <button
              type="button"
              className={
                locker.fullLockerAccess
                  ? "button primary"
                  : "button secondary"
              }
              disabled={busy}
              onClick={() =>
                void setFullLocker(
                  !locker.fullLockerAccess
                )
              }
            >
              {locker.fullLockerAccess
                ? "DISABLE"
                : "ENABLE"}
            </button>
          </div>

          <div className="admin-grant-grid">
            <input
              className="admin-input"
              value={itemKey}
              onChange={(event) =>
                setItemKey(event.target.value)
              }
              placeholder="Item key"
            />

            <input
              className="admin-input"
              value={itemName}
              onChange={(event) =>
                setItemName(event.target.value)
              }
              placeholder="Display name"
            />

            <input
              className="admin-input"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              placeholder="Category"
            />

            <button
              type="button"
              className="button primary"
              disabled={busy}
              onClick={() =>
                void giveItem()
              }
            >
              GIVE ITEM
            </button>
          </div>

          <div className="admin-item-list">
            {locker.items.length === 0 ? (
              <div className="admin-empty">
                No individually granted items.
              </div>
            ) : (
              locker.items.map((item) => (
                <div
                  className="admin-item"
                  key={item.itemKey}
                >
                  <div>
                    <strong>
                      {item.itemName}
                    </strong>

                    <small>
                      {item.category} · {item.itemKey}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="button ghost"
                    disabled={busy}
                    onClick={() =>
                      void removeItem(
                        item.itemKey
                      )
                    }
                  >
                    REMOVE
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </section>
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
      type="button"
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
