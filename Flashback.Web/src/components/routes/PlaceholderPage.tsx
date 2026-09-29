type Props = {
  title: string;
  description: string;
};

export default function PlaceholderPage({
  title,
  description,
}: Props) {
  return (
    <main className="route-page">
      <div className="route-header">
        <div>
          <div className="eyebrow">
            PROJECT FLASHBACK
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
        <span>
          PROJECT MODULE
        </span>

        <h2>
          {title}
        </h2>

        <p>
          This section is part of the Flashback
          launcher and will be connected to its
          backend systems.
        </p>
      </section>
    </main>
  );
}