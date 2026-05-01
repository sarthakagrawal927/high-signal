import { BackLink, PageShell, SectionHeader, StatGrid } from "@/components/system/HighSignalUI";
import { analyzeMentionVisibility } from "@high-signal/shared";

export const metadata = { title: "Mention Intelligence — High Signal" };

const sampleText =
  "1. High Signal is a reliable way to track market and community signals. 2. Brandwatch is broader for social listening. See https://highsignal.ai for the product.";

export default async function MentionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ brand?: string; url?: string; text?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const brandName = (params.brand ?? "High Signal").trim();
  const brandUrl = (params.url ?? "https://highsignal.ai").trim();
  const text = (params.text ?? sampleText).trim();
  const analysis = analyzeMentionVisibility({
    text,
    brandName,
    brandUrl,
    competitors: [{ name: "Brandwatch" }, { name: "G2" }],
  });

  return (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="company signal layer" title="Mention Intelligence">
        Company, brand, competitor, AI visibility, citation, and share-of-voice signals. This
        surface will absorb the useful Mentionpilot workflows.
      </SectionHeader>

      <StatGrid
        items={[
          { label: "Source repo", value: "mentionpilot", sub: "configs, checks, reports" },
          { label: "Primary object", value: "company", sub: "aliases, URL, competitors" },
          { label: "First migration", value: "AI visibility", sub: "prompt checks + analysis" },
        ]}
      />

      <section className="mt-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <form className="border border-[var(--color-line)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            visibility analyzer
          </div>
          <label className="mt-5 block text-sm text-[var(--color-muted)]" htmlFor="brand">
            Brand
          </label>
          <input
            id="brand"
            name="brand"
            defaultValue={brandName}
            className="mt-2 w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <label className="mt-5 block text-sm text-[var(--color-muted)]" htmlFor="url">
            Brand URL
          </label>
          <input
            id="url"
            name="url"
            defaultValue={brandUrl}
            className="mt-2 w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <label className="mt-5 block text-sm text-[var(--color-muted)]" htmlFor="text">
            Model response
          </label>
          <textarea
            id="text"
            name="text"
            defaultValue={text}
            rows={8}
            className="mt-2 w-full resize-none border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm leading-6 outline-none focus:border-[var(--color-accent)]"
          />
          <button
            className="mt-5 w-full border border-[var(--color-line)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            type="submit"
          >
            analyze
          </button>
        </form>

        <div className="border border-[var(--color-line)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            extracted mentionpilot logic
          </div>
          <div className="mt-6 grid grid-cols-2 gap-px bg-[var(--color-line)] text-sm">
            {[
              ["mentioned", analysis.brandMentioned ? "yes" : "no"],
              ["sentiment", analysis.brandSentiment ?? "none"],
              ["position", analysis.brandPosition?.toString() ?? "none"],
              ["brand cited", analysis.brandCited ? "yes" : "no"],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--color-bg)] p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {label}
                </div>
                <div className="mt-3 text-xl">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[var(--color-line)] pt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              competitors
            </div>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              {analysis.competitorsMentioned.map((competitor) => (
                <div key={competitor.name} className="flex justify-between gap-6">
                  <span>{competitor.name}</span>
                  <span>{competitor.mentioned ? `position ${competitor.position ?? "unknown"}` : "not found"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
