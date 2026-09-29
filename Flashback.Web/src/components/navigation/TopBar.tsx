import type { Account } from "../../types/account";

type Props = {
  account: Account | null;
};

export default function TopBar({
  account,
}: Props) {
  const credits =
    account?.profile
      ?.flashbackCredits ?? 0;

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="status-dot" />

        <span>
          FLASHBACK ONLINE
        </span>
      </div>

      <div className="topbar-right">
        <div className="wallet">
          <span className="wallet-icon">
            V
          </span>

          <span>
            {credits}
          </span>
        </div>

        <div className="profile-mini">
          {account
            ? (
                account.profile
                  ?.displayName ??
                account.discordUsername ??
                account.username
              )
            : "GUEST"}
        </div>
      </div>
    </header>
  );
}