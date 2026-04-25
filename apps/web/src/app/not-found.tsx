export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center px-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
        404 / signal lost
      </div>
      <h1 className="mt-3 text-2xl font-medium tracking-tight">Not found</h1>
      <a
        href="/"
        className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-accent)]"
      >
        ← home
      </a>
    </main>
  );
}
