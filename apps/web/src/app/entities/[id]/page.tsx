import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { SignalCard } from "@/components/molecules/SignalCard";

export const dynamic = "force-dynamic";

export default async function EntityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data;
  try {
    data = await api.entity(id);
  } catch {
    return notFound();
  }
  const { entity, relationships, signals } = data;

  const groups = new Map<string, typeof relationships>();
  for (const r of relationships) {
    const k = r.fromEntityId === entity.id ? `out:${r.type}` : `in:${r.type}`;
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <a
        href="/entities"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
      >
        ← entities
      </a>
      <header className="mt-3 border-b border-zinc-800 pb-6">
        <div className="flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {entity.ticker && <span className="text-[var(--color-accent)]">{entity.ticker}</span>}
          {entity.country && <span>{entity.country}</span>}
          {entity.sector && <span>{entity.sector}</span>}
          <span>{entity.type}</span>
        </div>
        <h1 className="mt-2 text-3xl font-medium tracking-tight">{entity.name}</h1>
      </header>

      <section className="mt-10">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          relationships
        </h2>
        <div className="mt-4 grid gap-x-8 gap-y-4 md:grid-cols-2">
          {Array.from(groups.entries()).map(([k, rs]) => {
            const [dir, type] = k.split(":");
            return (
              <div key={k}>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {dir === "out" ? `→ ${type}` : `← ${type}`}{" "}
                  <span className="nums">{rs.length}</span>
                </div>
                <ul className="mt-2 space-y-1">
                  {rs.map((r) => {
                    const other = r.fromEntityId === entity.id ? r.toEntityId : r.fromEntityId;
                    return (
                      <li key={r.id} className="flex items-baseline justify-between gap-2 border-b border-zinc-900 py-1.5">
                        <a
                          href={`/entities/${other}`}
                          className="font-mono text-xs text-zinc-200 hover:text-white"
                        >
                          {other}
                        </a>
                        <span className="nums font-mono text-[10px] text-zinc-500">
                          w {r.weight.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          recent signals
        </h2>
        {signals.length === 0 ? (
          <div className="mt-4 border border-dashed border-zinc-800 p-6 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
            no signals yet
          </div>
        ) : (
          <div className="mt-4 border-t border-zinc-800">
            {signals.map((s) => (
              <SignalCard key={s.id} s={s} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
