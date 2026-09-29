import { useEffect, useState } from "react";

import AppFrame from "./components/core/AppFrame";
import Sidebar from "./components/navigation/Sidebar";
import TopBar from "./components/navigation/TopBar";

import HomePage from "./components/routes/HomePage";
import LibraryPage from "./components/routes/LibraryPage";
import NewsPage from "./components/routes/NewsPage";
import PlaceholderPage from "./components/routes/PlaceholderPage";

import { useAccountStore } from "./store/accountStore";

import type { Page } from "./types/navigation";

import "./index.css";

function DiscordLoginScreen({
  loading,
  status,
  onLogin,
}: {
  loading: boolean;
  status: string;
  onLogin: () => void;
}) {
  return (
    <div className="auth-screen">
      <div className="auth-glow" />

      <div className="auth-card">
        <div className="auth-mark">
          PF
        </div>

        <span className="auth-kicker">
          PROJECT FLASHBACK
        </span>

        <h1>
          CONNECT YOUR
          <br />
          <span>DISCORD ACCOUNT</span>
        </h1>

        <p>
          Sign in before entering the launcher.
          Your Flashback account and progression
          stay connected to your Discord identity.
        </p>

        <button
          type="button"
          className="button discord-button"
          onClick={onLogin}
          disabled={loading}
        >
          <span>
            {loading
              ? "OPENING DISCORD..."
              : "CONTINUE WITH DISCORD"}
          </span>

          <span>
            →
          </span>
        </button>

        {status && (
          <div className="auth-status">
            {status}
          </div>
        )}

        <div className="auth-footer">
          <span>
            SECURE ACCOUNT GATE
          </span>

          <span>
            PROJECT FLASHBACK
          </span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] =
    useState<Page>("home");

  const [hydrated, setHydrated] =
    useState(false);

  const account =
    useAccountStore(
      (state) => state.account
    );

  const loading =
    useAccountStore(
      (state) => state.loading
    );

  const loginStatus =
    useAccountStore(
      (state) => state.loginStatus
    );

  const hydrate =
    useAccountStore(
      (state) => state.hydrate
    );

  const loginWithDiscord =
    useAccountStore(
      (state) => state.loginWithDiscord
    );

  const logout =
    useAccountStore(
      (state) => state.logout
    );

  useEffect(() => {
    let mounted = true;

    void hydrate().finally(() => {
      if (mounted) {
        setHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
  }, [hydrate]);

  return (
    <AppFrame>
      {!hydrated ? (
        <div className="auth-loading">
          <div className="auth-loading-mark">
            PF
          </div>

          <span>
            LOADING PROJECT FLASHBACK
          </span>
        </div>
      ) : !account ? (
        <DiscordLoginScreen
          loading={loading}
          status={loginStatus}
          onLogin={() =>
            void loginWithDiscord()
          }
        />
      ) : (
        <>
          <Sidebar
            page={page}
            account={account}
            loginStatus={loginStatus}
            onNavigate={setPage}
            onLogin={() =>
              void loginWithDiscord()
            }
            onLogout={() =>
              void logout()
            }
          />

          <section className="workspace">
            <TopBar
              account={account}
            />

            {page === "home" && (
              <HomePage
                account={account}
                onNavigate={setPage}
              />
            )}

            {page === "library" && (
              <LibraryPage />
            )}

            {page === "news" && (
              <NewsPage />
            )}

            {page === "tournaments" && (
              <PlaceholderPage
                title="Tournaments"
                description="Project Flashback competitive events."
              />
            )}

            {page === "settings" && (
              <PlaceholderPage
                title="Settings"
                description="Launcher and account configuration."
              />
            )}
          </section>
        </>
      )}
    </AppFrame>
  );
}