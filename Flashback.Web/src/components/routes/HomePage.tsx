import type { Account } from "../../types/account";
import type { Page } from "../../types/navigation";

type Props = {
  account: Account | null;
  onNavigate: (page: Page) => void;
};

export default function HomePage({
  account,
  onNavigate,
}: Props) {
  const level =
    account?.profile?.level ?? 1;

  const credits =
    account?.profile?.flashbackCredits ?? 0;

  return (
    <main className="route-page">
      <section className="home-layout">
        <div className="home-main">

          <div className="hero-card">
            <div className="hero-overlay" />

            <div className="hero-content">
              <div className="eyebrow">
                PROJECT FLASHBACK
              </div>

              <h1>
                CLASSIC
                <br />
                BATTLE ROYALE
              </h1>

              <p>
                Your classic Fortnite-era
                experience through Project
                Flashback.
              </p>

              <div className="hero-actions">
                <button
                  className="button primary large"
                  onClick={() =>
                    onNavigate("library")
                  }
                >
                  OPEN LIBRARY
                </button>

                <button
                  className="button ghost large"
                  onClick={() =>
                    onNavigate("news")
                  }
                >
                  VIEW NEWS
                </button>
              </div>

              <div className="hero-status">
                <span className="status-dot" />

                <span>
                  GAME STATUS
                </span>

                <strong>
                  ONLINE
                </strong>
              </div>
            </div>

            <div className="hero-build">
              <span>
                CURRENT BUILD
              </span>

              <strong>
                12.50
              </strong>

              <small>
                CL 13137020
              </small>
            </div>
          </div>

          <div className="home-stats">
            <Stat
              label="V-BUCKS"
              value={String(credits)}
            />

            <Stat
              label="LEVEL"
              value={String(level)}
            />

            <Stat
              label="WINS"
              value="0"
            />

            <Stat
              label="KILLS"
              value="0"
            />
          </div>
        </div>

        <aside className="home-news">
          <div className="section-heading">
            <div>
              <div className="eyebrow">
                LATEST
              </div>

              <h2>
                News
              </h2>
            </div>

            <button
              className="text-button"
              onClick={() =>
                onNavigate("news")
              }
            >
              VIEW ALL
            </button>
          </div>

          <NewsCard
            title="Project Flashback"
            description="The launcher is being rebuilt into a complete desktop experience."
            date="LATEST"
          />

          <NewsCard
            title="Classic Build"
            description="Fortnite 12.50 • CL 13137020 is available in the library."
            date="BUILD"
          />

          <NewsCard
            title="Discord Accounts"
            description="Your account and progression are connected to your Discord login."
            date="ACCOUNT"
          />
        </aside>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="stat-box">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function NewsCard({
  title,
  description,
  date,
}: {
  title: string;
  description: string;
  date: string;
}) {
  return (
    <article className="news-mini-card">
      <div className="news-mini-icon">
        PF
      </div>

      <div>
        <div className="news-mini-date">
          {date}
        </div>

        <h3>
          {title}
        </h3>

        <p>
          {description}
        </p>
      </div>
    </article>
  );
}