import {
  BackLink,
  FeedList,
  MetricGrid,
  PageShell,
  Panel,
  SectionHeader,
} from "@/components/system/HighSignalUI";
import { api, type CommunityDigestSnapshot } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover — High Signal" };

const fallbackDigests: CommunityDigestSnapshot[] = [
  {
    id: "sample_digest_localllama",
    subreddit: "LocalLLaMA",
    period: "week",
    snapshotDate: "2026-05-01T00:00:00.000Z",
    summaryText:
      "Open-model operators are asking for source-linked workflow monitoring, cost controls, and repeatable agent state.",
    summary: {
      keyTrend: {
        title: "Operational visibility is becoming a buying signal",
        desc: "Community threads keep moving from model comparisons to deployment observability.",
      },
      notableDiscussions: [],
      keyAction: {
        title: "Package provenance with every digest",
        desc: "Every summary should preserve links back to source discussions before it becomes an alert.",
      },
    },
    promptUsed: "Find agent operations pain and source-linked buying signals.",
    sourceCount: 12,
    createdAt: "2026-05-01T00:00:00.000Z",
  },
];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<{ period?: "day" | "week" | "month" }>;
}) {
  const params = (await searchParams) ?? {};
  const period = params.period ?? "week";
  let digests = fallbackDigests;
  try {
    const result = await api.productCommunityDiscover(period);
    digests = result.items.length ? result.items : fallbackDigests;
  } catch {
    /* Keep the migrated surface visible before community snapshots are seeded. */
  }

  const totalSources = digests.reduce((sum, digest) => sum + digest.sourceCount, 0);

  return (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="community discovery" title="Discover">
        Source-linked subreddit intelligence from tracked community snapshots.
      </SectionHeader>

      <MetricGrid
        items={[
          { label: "period", value: period },
          { label: "digests", value: digests.length.toString() },
          { label: "sources", value: totalSources.toString() },
          { label: "surface", value: "community" },
        ]}
      />

      <section className="mt-10 grid gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <Panel eyebrow="period">
          <div className="mt-5 flex gap-2 font-mono text-[10px] uppercase tracking-[0.18em]">
            {(["day", "week", "month"] as const).map((option) => (
              <a
                key={option}
                href={`/discover?period=${option}`}
                className={`border px-3 py-2 ${
                  option === period
                    ? "border-[var(--color-accent)] text-[var(--color-fg)]"
                    : "border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
                }`}
              >
                {option}
              </a>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="latest digest" title={`r/${digests[0]?.subreddit ?? "community"}`}>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            {digests[0]?.summary?.keyTrend?.desc ?? digests[0]?.summaryText}
          </p>
        </Panel>
      </section>

      <FeedList
        eyebrow="source-linked archive"
        empty="No community digests found."
        items={digests.map((digest) => ({
          href: `/communities/${encodeURIComponent(digest.subreddit)}/${digest.period}`,
          kicker: `r/${digest.subreddit} / ${digest.period} / ${digest.snapshotDate.slice(0, 10)}`,
          title: digest.summary?.keyTrend?.title ?? digest.subreddit,
          body: digest.summaryText,
        }))}
      />
    </PageShell>
  );
}
