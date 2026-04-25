import { api, type SignalRow } from "@/lib/api";
import { SignalCard } from "@/components/molecules/SignalCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Signals — High Signal" };

export default async function SignalsPage() {
  let signals: SignalRow[] = [];
  try {
    const r = await api.signals();
    signals = r.signals;
  } catch {
    /* api offline / empty */
  }
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Header />
      {signals.length === 0 ? (
        <Empty />
      ) : (
        <div className="mt-8 border-t border-zinc-800">
          {signals.map((s) => (
            <SignalCard key={s.id} s={s} />
          ))}
        </div>
      )}
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-zinc-800 pb-6">
      <a
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
      >
        ← high signal
      </a>
      <h1 className="mt-3 text-3xl font-medium tracking-tight">Signals</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Every published signal cites at least two sources, predicts direction with a confidence
        band, and is auto-scored on the public hit-rate ledger.
      </p>
    </header>
  );
}

function Empty() {
  return (
    <div className="mt-12 border border-dashed border-zinc-800 p-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-zinc-500">
      no signals published yet — first cards drop after phase 1
    </div>
  );
}
