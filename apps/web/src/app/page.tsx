export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-24">
      <header className="border-b border-[var(--color-line)] pb-8">
        <div className="flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          <span className="size-1.5 rounded-full bg-[var(--color-accent)]" />
          <span>v0 / pre-launch / ai-infra</span>
        </div>
        <h1 className="mt-4 text-5xl font-medium tracking-tight">High Signal</h1>
        <p className="mt-4 max-w-2xl text-[var(--color-muted)]">
          Public, evidence-backed, versioned signal log for AI infra and semiconductors. Every
          signal cites sources, predicts direction with a confidence band, and is auto-scored on a
          public hit-rate ledger.
        </p>
      </header>

      <section className="mt-12 grid grid-cols-2 gap-px border border-[var(--color-line)] bg-[var(--color-line)] sm:grid-cols-4">
        {[
          ["Signals", "0", "shipped"],
          ["Hit rate", "—", "60d window"],
          ["Entities", "37", "tracked"],
          ["Sources", "0", "ingested"],
        ].map(([k, v, sub]) => (
          <div key={k} className="bg-[var(--color-bg)] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              {k}
            </div>
            <div className="nums mt-3 text-2xl font-medium">{v}</div>
            <div className="mt-1 font-mono text-[10px] text-[var(--color-muted)]">{sub}</div>
          </div>
        ))}
      </section>

      <nav className="mt-12 flex flex-col divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] font-mono text-sm">
        {[
          ["/signals", "signal feed", "events → primary entity → spillover"],
          ["/track-record", "track record", "hit-rate by signal type, public + versioned"],
          ["/entities", "entities", "ai-infra graph + relationship map"],
          ["/digest", "weekly digest", "subscribe via rss or substack"],
        ].map(([href, title, sub]) => (
          <a
            key={href}
            href={href}
            className="group flex items-center justify-between py-4 transition-colors hover:bg-white/[0.02]"
          >
            <span className="flex items-baseline gap-4">
              <span className="text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">
                {href}
              </span>
              <span className="text-[var(--color-fg)]">{title}</span>
            </span>
            <span className="text-[var(--color-muted)]">{sub}</span>
          </a>
        ))}
      </nav>

      <footer className="mt-16 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
        evidence-first / append-only / hit-rate from day one
      </footer>
    </main>
  );
}
