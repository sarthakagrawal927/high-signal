import { api, type TrackBucket } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track record — High Signal" };

export default async function TrackRecordPage() {
  let buckets: TrackBucket[] = [];
  try {
    const r = await api.trackRecord();
    buckets = r.buckets;
  } catch {
    /* offline */
  }

  const overall = buckets.reduce(
    (acc, b) => {
      acc.hit += b.hit;
      acc.miss += b.miss;
      acc.push += b.push;
      acc.total += b.total;
      return acc;
    },
    { hit: 0, miss: 0, push: 0, total: 0 },
  );
  const overallHitRate =
    overall.hit + overall.miss > 0 ? overall.hit / (overall.hit + overall.miss) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <a
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
      >
        ← high signal
      </a>
      <header className="mt-3 border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-medium tracking-tight">Track record</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Every published signal is auto-scored against forward returns. Hit / miss / push
          buckets, public + versioned. No retroactive edits.
        </p>
      </header>

      <section className="mt-10 grid grid-cols-2 gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
        {[
          ["Hit rate", overallHitRate != null ? `${(overallHitRate * 100).toFixed(0)}%` : "—"],
          ["Hits", overall.hit],
          ["Misses", overall.miss],
          ["Pushes", overall.push],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-zinc-950 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {k}
            </div>
            <div className="nums mt-3 text-2xl font-medium">{String(v)}</div>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          by signal type
        </h2>
        {buckets.length === 0 ? (
          <div className="mt-6 border border-dashed border-zinc-800 p-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            no scored signals yet — first cycle completes 60d after first publish
          </div>
        ) : (
          <table className="mt-6 w-full text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <tr>
                <th className="border-b border-zinc-800 py-2 text-left">type</th>
                <th className="border-b border-zinc-800 py-2 text-right">total</th>
                <th className="border-b border-zinc-800 py-2 text-right">hit</th>
                <th className="border-b border-zinc-800 py-2 text-right">miss</th>
                <th className="border-b border-zinc-800 py-2 text-right">push</th>
                <th className="border-b border-zinc-800 py-2 text-right">hit-rate</th>
              </tr>
            </thead>
            <tbody className="nums">
              {buckets
                .slice()
                .sort((a, b) => (b.hitRate ?? 0) - (a.hitRate ?? 0))
                .map((b) => (
                  <tr key={b.signalType}>
                    <td className="border-b border-zinc-900 py-2 font-mono text-xs">
                      {b.signalType}
                    </td>
                    <td className="border-b border-zinc-900 py-2 text-right">{b.total}</td>
                    <td className="border-b border-zinc-900 py-2 text-right text-emerald-400">
                      {b.hit}
                    </td>
                    <td className="border-b border-zinc-900 py-2 text-right text-rose-400">
                      {b.miss}
                    </td>
                    <td className="border-b border-zinc-900 py-2 text-right text-zinc-500">
                      {b.push}
                    </td>
                    <td className="border-b border-zinc-900 py-2 text-right">
                      {b.hitRate != null ? `${(b.hitRate * 100).toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
