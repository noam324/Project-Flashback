type Props = {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: string;
};

export default function PlaceholderPage({
  title,
  description,
  eyebrow = "PROJECT FLASHBACK",
  icon = "◇",
}: Props) {
  return (
    <main className="route-page">

      <div className="route-header">

        <div>

          <div className="eyebrow">
            {eyebrow}
          </div>

          <h1>
            {title}
          </h1>

          <p>
            {description}
          </p>

        </div>

      </div>

      <section className="placeholder-panel">

        <div className="placeholder-icon">
          {icon}
        </div>

        <span className="placeholder-label">
          PROJECT MODULE
        </span>

        <h2>
          {title}
        </h2>

        <p>
          This section is part of the Project
          Flashback launcher and will be connected
          to its backend systems.
        </p>

        <div className="coming-soon">
          MODULE IN DEVELOPMENT
        </div>

      </section>

    </main>
  );
}