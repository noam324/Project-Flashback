import type { Page } from "../../types/navigation";
import type { Account } from "../../types/account";

type Props = {
  page: Page;
  account: Account | null;
  loginStatus: string;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
  onLogout: () => void;
};

const items: {
  page: Page;
  label: string;
  icon: string;
}[] = [
  {
    page: "home",
    label: "Home",
    icon: "⌂",
  },
  {
    page: "library",
    label: "Library",
    icon: "▣",
  },
  {
    page: "news",
    label: "News",
    icon: "▤",
  },
  {
    page: "locker",
    label: "Locker",
    icon: "◇",
  },
  {
    page: "item-shop",
    label: "Item Shop",
    icon: "◈",
  },
  {
    page: "tournaments",
    label: "Tournaments",
    icon: "♜",
  },
  {
    page: "leaderboards",
    label: "Leaderboards",
    icon: "↗",
  },
  {
    page: "settings",
    label: "Settings",
    icon: "⚙",
  },
];

export default function Sidebar({
  page,
  account,
  loginStatus,
  onNavigate,
  onLogin,
  onLogout,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          PF
        </div>

        <div>
          <div className="brand-top">
            PROJECT
          </div>

          <div className="brand-bottom">
            FLASHBACK
          </div>
        </div>
      </div>

      <div className="sidebar-label">
        NAVIGATION
      </div>

      <nav className="nav-list">
        {items.map((item) => (
          <button
            key={item.page}
            className={
              page === item.page
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              onNavigate(item.page)
            }
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-account">
        {account ? (
          <>
            <div className="account-card">
              <div className="account-avatar">
                {(
                  account.profile
                    ?.displayName ??
                  account.discordUsername ??
                  account.username ??
                  "P"
                )
                  .slice(0, 1)
                  .toUpperCase()}
              </div>

              <div className="account-details">
                <strong>
                  {account.profile
                    ?.displayName ??
                    account.discordUsername ??
                    account.username}
                </strong>

                <span>
                  Level{" "}
                  {account.profile
                    ?.level ?? 1}
                </span>
              </div>
            </div>

            <button
              className="account-action"
              onClick={onLogout}
            >
              LOG OUT
            </button>
          </>
        ) : (
          <>
            <button
              className="discord-login"
              onClick={onLogin}
            >
              LOGIN WITH DISCORD
            </button>

            {loginStatus && (
              <div className="login-status-small">
                {loginStatus}
              </div>
            )}
          </>
        )}
      </div>

      <div className="sidebar-footer">
        PROJECT FLASHBACK
        <span>v0.1.0</span>
      </div>
    </aside>
  );
}