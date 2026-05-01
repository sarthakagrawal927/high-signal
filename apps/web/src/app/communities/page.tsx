import { BackLink, PageShell, SectionHeader, StatGrid } from "@/components/system/HighSignalUI";
import { api } from "@/lib/api";

export const metadata = { title: "Community Intelligence — High Signal" };

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ subreddit?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const subreddit = (params.subreddit ?? "LocalLLaMA").replace(/^r\//i, "").trim();
  const query = (params.q ?? "AI agents").trim();
  const [communityResult, mentionsResult] = await Promise.allSettled([
    api.redditCommunity(subreddit),
    api.redditMentions(query, 8),
  ]);
  const community = communityResult.status === "fulfilled" ? communityResult.value.community : null;
  const mentions = mentionsResult.status === "fulfilled" ? mentionsResult.value.mentions : [];

  return (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="community signal layer" title="Community Intelligence">
        Subreddit and forum signals for pain, demand, narrative shifts, product opportunities, and
        competitor mentions. This surface will absorb AgentMode's Reddit workflow.
      </SectionHeader>

      <StatGrid
        items={[
          { label: "Source repo", value: "agentMode", sub: "Reddit fetcher + snapshots" },
          { label: "Primary object", value: "community", sub: "subreddits, prompts, digests" },
          { label: "First migration", value: "tracked subreddits", sub: "source-linked summaries" },
        ]}
      />

      <section className="mt-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
        <form className="border border-[var(--color-line)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            subreddit lookup
          </div>
          <label className="mt-5 block text-sm text-[var(--color-muted)]" htmlFor="subreddit">
            Subreddit
          </label>
          <input
            id="subreddit"
            name="subreddit"
            defaultValue={subreddit}
            className="mt-2 w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <label className="mt-5 block text-sm text-[var(--color-muted)]" htmlFor="q">
            Mention query
          </label>
          <input
            id="q"
            name="q"
            defaultValue={query}
            className="mt-2 w-full border border-[var(--color-line)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <button
            className="mt-5 w-full border border-[var(--color-line)] px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-[var(--color-fg)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            type="submit"
          >
            refresh
          </button>
        </form>

        <div className="border border-[var(--color-line)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
            live reddit source
          </div>
          {community ? (
            <>
              <a className="mt-5 block text-2xl font-medium hover:text-[var(--color-accent)]" href={community.url}>
                r/{community.name}
              </a>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
                {community.description || community.title}
              </p>
              <div className="mt-6 grid grid-cols-3 gap-px bg-[var(--color-line)] text-sm">
                <div className="bg-[var(--color-bg)] p-3">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">subs</div>
                  <div className="mt-2">{community.subscribers.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--color-bg)] p-3">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">active</div>
                  <div className="mt-2">{community.activeUsers?.toLocaleString() ?? "unknown"}</div>
                </div>
                <div className="bg-[var(--color-bg)] p-3">
                  <div className="font-mono text-[10px] uppercase text-[var(--color-muted)]">nsfw</div>
                  <div className="mt-2">{community.nsfw ? "yes" : "no"}</div>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-[var(--color-muted)]">Reddit source unavailable.</p>
          )}
        </div>
      </section>

      <section className="mt-10 border-y border-[var(--color-line)]">
        <div className="py-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
          mention search
        </div>
        <div className="divide-y divide-[var(--color-line)]">
          {mentions.map((mention) => (
            <a key={`${mention.type}-${mention.id}`} href={mention.permalink} className="block py-5 hover:text-[var(--color-accent)]">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                r/{mention.subreddit} · {mention.type} · score {mention.score}
              </div>
              <div className="mt-2 text-lg">{mention.title || mention.body || "Untitled mention"}</div>
              {mention.selftext ? (
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{mention.selftext}</p>
              ) : null}
            </a>
          ))}
          {mentions.length === 0 ? (
            <p className="py-5 text-sm text-[var(--color-muted)]">No Reddit mentions returned for this query.</p>
          ) : null}
        </div>
      </section>
    </PageShell>
  );
}
