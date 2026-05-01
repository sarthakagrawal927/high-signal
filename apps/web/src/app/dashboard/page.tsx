import {
  BackLink,
  FeedList,
  MetricGrid,
  PageShell,
  Panel,
  SectionHeader,
} from "@/components/system/HighSignalUI";
import type { MentionBrandConfig, TrackedCommunity } from "@high-signal/shared";

export const metadata = { title: "Dashboard — High Signal" };

const brandConfig: MentionBrandConfig = {
  id: "brand_high_signal",
  companyId: "company_high_signal",
  brandName: "High Signal",
  brandAliases: ["HighSignal", "High Signal Suite"],
  brandUrl: "https://highsignalsuite.com",
  competitors: [{ name: "Brandwatch" }, { name: "G2" }],
  platforms: ["openai", "anthropic", "perplexity"],
  aiEndpointUrl: null,
  aiModel: "multi-model",
  createdAt: "2026-05-01T00:00:00.000Z",
  updatedAt: "2026-05-01T00:00:00.000Z",
};

const trackedCommunities: TrackedCommunity[] = [
  {
    id: "community_localllama",
    ownerId: "workspace_default",
    subreddit: "LocalLLaMA",
    prompt:
      "Extract operational pain, buying intent, recurring product requests, and source-linked shifts in agent infrastructure.",
    period: "week",
    isPublic: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
  {
    id: "community_saas",
    ownerId: "workspace_default",
    subreddit: "SaaS",
    prompt: "Find demand, pricing, positioning, and competitor signals for B2B software teams.",
    period: "week",
    isPublic: false,
    createdAt: "2026-05-01T00:00:00.000Z",
    updatedAt: "2026-05-01T00:00:00.000Z",
  },
];

export default function DashboardPage() {
  return (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="premium command surface" title="Signal Dashboard">
        One workspace for company mention checks, tracked communities, and market signals. This is
        the first destination surface for the Mentionpilot and Agent Mode migrations.
      </SectionHeader>

      <MetricGrid
        items={[
          { label: "brand", value: brandConfig.brandName },
          { label: "platforms", value: brandConfig.platforms.length.toString() },
          { label: "communities", value: trackedCommunities.length.toString() },
          { label: "markets", value: "live" },
        ]}
      />

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <Panel eyebrow="mention intelligence" title={brandConfig.brandName}>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
            Track AI visibility, citations, competitor mentions, and prompt-level response quality
            for {brandConfig.brandUrl}.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {brandConfig.competitors.map((competitor) => (
              <span
                key={competitor.name}
                className="border border-[var(--color-line)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]"
              >
                {competitor.name}
              </span>
            ))}
          </div>
        </Panel>

        <Panel eyebrow="community intelligence" title="Tracked subreddits">
          <div className="mt-5 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {trackedCommunities.map((community) => (
              <a
                key={community.id}
                href={`/communities?subreddit=${encodeURIComponent(community.subreddit)}`}
                className="block py-4 hover:text-[var(--color-accent)]"
              >
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  r/{community.subreddit} / {community.period}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  {community.prompt}
                </p>
              </a>
            ))}
          </div>
        </Panel>
      </section>

      <FeedList
        eyebrow="next migration surfaces"
        empty="No pending surfaces."
        items={[
          {
            href: "/mentions",
            kicker: "mentionpilot / prompt checks",
            title: "Productionize brand configs, prompts, checks, and reports",
            body: "Contracts are mapped; persistent routes and storage remain before archive parity.",
          },
          {
            href: "/communities",
            kicker: "agent mode / tracked subreddits",
            title: "Productionize tracked subreddit digests",
            body: "Source-linked summaries are mapped; prompt storage, archive pages, and scheduled snapshots remain.",
          },
        ]}
      />
    </PageShell>
  );
}
