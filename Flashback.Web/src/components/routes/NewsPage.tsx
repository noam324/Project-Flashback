const news = [
  {
    date: "SEPTEMBER 2026",
    title: "Project Flashback launcher rebuild",
    description:
      "The launcher interface is being rebuilt around a proper desktop-library experience.",
  },
  {
    date: "SEPTEMBER 2026",
    title: "Classic build support",
    description:
      "Fortnite 12.50 • CL 13137020 can be detected from the local installation.",
  },
  {
    date: "RECENT",
    title: "Discord authentication",
    description:
      "Accounts are connected to Discord with persistent server-side sessions.",
  },
];

export default function NewsPage() {
  return (
    <main className="route-page">
      <div className="route-header">
        <div>
          <div className="eyebrow">
            PROJECT FLASHBACK
          </div>

          <h1>News</h1>

          <p>
            Latest launcher and project updates.
          </p>
        </div>
      </div>

      <section className="news-page-list">
        {news.map((item) => (
          <article
            className="news-page-card"
            key={item.title}
          >
            <div className="news-art">
              PF
            </div>

            <div className="news-page-content">
              <span>
                {item.date}
              </span>

              <h2>
                {item.title}
              </h2>

              <p>
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}