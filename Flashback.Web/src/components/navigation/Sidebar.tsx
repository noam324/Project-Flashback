import type { Account } from "../../types/account";
import type { Page } from "../../types/navigation";

type Props = {
  page: Page;
  account: Account | null;
  loginStatus: string;
  onNavigate: (page: Page) => void;
  onLogin: () => void;
  onLogout: () => void;
};

type NavItem = {
  page: Page;
  label: string;
  icon: string;
};

const navigation: NavItem[] = [
  {
    page: "home",
    label: "Home",
    icon: "⌂",
  },
  {
    page: "library",
    label: "Play",
    icon: "▶",
  },
  {
    page: "news",
    label: "News",
    icon: "▤",
  },
  {
    page: "tournaments",
    label: "Tournaments",
    icon: "♜",
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
  const displayName =
    account?.profile?.displayName ??
    account?.discordUsername ??
    account?.username ??
    "Guest";

  const level =
    account?.profile?.level ?? 1;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          PF
        </div>

        <div>
          <span className="sidebar-brand-top">
            PROJECT
          </span>

          <strong className="sidebar-brand-bottom">
            FLASHBACK
          </strong>
        </div>
      </div>

      <div className="sidebar-section-label">
        LAUNCHER
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const active =
            page === item.page;

          return (
            <button
              type="button"
              key={item.page}
              className={
                active
                  ? "sidebar-nav-item active"
                  : "sidebar-nav-item"
              }
              onClick={() =>
                onNavigate(item.page)
              }
            >
              <span className="sidebar-nav-icon">
                {item.icon}
              </span>

              <span className="sidebar-nav-label">
                {item.label}
              </span>

              {active && (
                <span className="sidebar-active-bar" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-account-panel">
        <div className="sidebar-account-card">
          <div className="sidebar-avatar">
            {account?.discordAvatarUrl ? (
              <img
                src={account.discordAvatarUrl}
                alt=""
              />
            ) : (
              displayName
                .slice(0, 1)
                .toUpperCase()
            )}
          </div>

          <div className="sidebar-account-copy">
            <strong>
              {displayName}
            </strong>

            <span>
              LEVEL {level}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-account-button"
          onClick={account ? onLogout : onLogin}
        >
          {account
            ? "LOG OUT"
            : "LOGIN WITH DISCORD"}
        </button>

        {!account &&
          loginStatus && (
            <div className="sidebar-login-status">
              {loginStatus}
            </div>
          )}
      </div>

      <div className="sidebar-footer">
        <span>
          PROJECT FLASHBACK
        </span>

        <span>
          v0.1.0
        </span>
      </div>
    </aside>
  );
}