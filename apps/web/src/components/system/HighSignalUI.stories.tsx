import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  BackLink,
  HeroHeader,
  PageShell,
  ProductAreaGrid,
  RouteList,
  SectionHeader,
  StatGrid,
} from "./HighSignalUI";

const meta = {
  title: "Design System/High Signal UI",
  parameters: {
    docs: {
      description: {
        component:
          "Core layout primitives for the High Signal product family. These components define the shared visual language for Mentions, Communities, and Markets.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProductShell: Story = {
  render: () => (
    <PageShell>
      <HeroHeader eyebrow="v0 / signal intelligence" title="High Signal">
        Extract actionable signals from noisy public and semi-public information streams.
      </HeroHeader>
      <ProductAreaGrid
        items={[
          {
            href: "/mentions",
            title: "Mention Intelligence",
            kicker: "company",
            body: "Brand, competitor, AI visibility, citation, and share-of-voice signals.",
          },
          {
            href: "/communities",
            title: "Community Intelligence",
            kicker: "subreddit",
            body: "Community pain, demand, narrative, and product-opportunity signals.",
          },
          {
            href: "/markets",
            title: "Market Intelligence",
            kicker: "entity graph",
            body: "Evidence-backed company and sector signals with confidence and hit-rate tracking.",
          },
        ]}
      />
      <RouteList
        items={[
          { href: "/signals", title: "signal feed", sub: "unified stream" },
          { href: "/review", title: "review queue", sub: "human approval" },
          { href: "/track-record", title: "track record", sub: "market signals" },
        ]}
      />
    </PageShell>
  ),
};

export const SubProductPage: Story = {
  render: () => (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="community signal layer" title="Community Intelligence">
        Subreddit and forum signals for pain, demand, narrative shifts, product opportunities, and
        competitor mentions.
      </SectionHeader>
      <StatGrid
        items={[
          { label: "Source repo", value: "agentMode", sub: "Reddit fetcher + snapshots" },
          { label: "Primary object", value: "community", sub: "subreddits, prompts, digests" },
          { label: "First migration", value: "tracked subreddits", sub: "source-linked summaries" },
        ]}
      />
    </PageShell>
  ),
};
