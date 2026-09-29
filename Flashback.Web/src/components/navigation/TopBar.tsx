import type { Account } from "../../types/account";

type Props = {
  account: Account | null;
};

export default function TopBar({
  account,
}: Props) {
  const displayName =
    account?.profile?.displayName ??
    account?.discordUsername ??
    account?.username ??
    "GUEST";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-online">
          <span className="topbar-online-dot" />
          ONLINE
        </div>

        <div className="topbar-build">
          BUILD 12.50
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-account">
          <div className="topbar-account-copy">
            <span>
              ACCOUNT
            </span>

            <strong>
              {displayName}
            </strong>
          </div>

          <div className="topbar-avatar">
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
        </div>
      </div>
    </header>
  );
}