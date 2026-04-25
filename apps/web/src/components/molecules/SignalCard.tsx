import Link from "next/link";
import type { SignalRow } from "@/lib/api";
import { DirectionPill } from "../atoms/DirectionPill";
import { ConfidenceBadge } from "../atoms/ConfidenceBadge";

export function SignalCard({ s }: { s: SignalRow }) {
  const headline = (s.bodyMd ?? "").split("\n")[0].replace(/^#\s*/, "") || s.slug;
  return (
    <Link
      href={`/signals/${s.slug}`}
      className="group block border-b border-zinc-800 py-6 transition-colors hover:bg-white/[0.02]"
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          <span>{new Date(s.publishedAt).toISOString().slice(0, 10)}</span>
          <span className="text-zinc-700">·</span>
          <span className="text-[var(--color-accent)]">{s.primaryEntityId}</span>
          <span className="text-zinc-700">·</span>
          <span>{s.signalType.replaceAll("_", " ")}</span>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={s.confidence} />
          <DirectionPill direction={s.direction} />
        </div>
      </div>
      <h3 className="mt-3 text-lg font-medium tracking-tight text-zinc-100 group-hover:text-white">
        {headline}
      </h3>
      {s.spilloverEntityIds.length > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-1.5 font-mono text-[10px] text-zinc-500">
          <span className="uppercase tracking-[0.18em]">spillover</span>
          {s.spilloverEntityIds.slice(0, 8).map((eid) => (
            <span key={eid} className="border border-zinc-800 px-1.5 py-0.5 text-zinc-400">
              {eid}
            </span>
          ))}
          {s.spilloverEntityIds.length > 8 && (
            <span className="text-zinc-600">+{s.spilloverEntityIds.length - 8}</span>
          )}
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 font-mono text-[10px] text-zinc-500">
        <span>
          window <span className="nums text-zinc-300">{s.predictedWindowDays}d</span>
        </span>
        <span>
          evidence <span className="nums text-zinc-300">{s.evidenceUrls.length}</span>
        </span>
      </div>
    </Link>
  );
}
