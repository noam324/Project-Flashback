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

export default function App() {
  const [page, setPage] =
    useState<Page>("home");

  const account =
    useAccountStore(
      (state) => state.account
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
    void hydrate();
  }, [hydrate]);

  return (
    <AppFrame>
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

        {page === "locker" && (
          <PlaceholderPage
            title="Locker"
            description="Manage your equipped and owned cosmetics."
          />
        )}

        {page === "item-shop" && (
          <PlaceholderPage
            title="Item Shop"
            description="Browse the current item shop."
          />
        )}

        {page === "tournaments" && (
          <PlaceholderPage
            title="Tournaments"
            description="Project Flashback competitive events."
          />
        )}

        {page === "leaderboards" && (
          <PlaceholderPage
            title="Leaderboards"
            description="Player statistics and rankings."
          />
        )}

        {page === "settings" && (
          <PlaceholderPage
            title="Settings"
            description="Launcher and account configuration."
          />
        )}
      </section>
    </AppFrame>
  );
}