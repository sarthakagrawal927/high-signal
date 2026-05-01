import { BackLink, PageShell, RouteList, SectionHeader } from "@/components/system/HighSignalUI";

export const metadata = { title: "Market Intelligence — High Signal" };

export default function MarketsPage() {
  return (
    <PageShell>
      <BackLink />
      <SectionHeader eyebrow="market signal layer" title="Market Intelligence">
        Evidence-backed company and sector signals with entity graphs, confidence bands, spillover
        relationships, and a public track record.
      </SectionHeader>

      <RouteList
        items={[
          { href: "/signals", title: "signals", sub: "published and draft-aware feed" },
          { href: "/entities", title: "entities", sub: "company and sector graph" },
          { href: "/sectors", title: "sectors", sub: "market pressure by category" },
          { href: "/track-record", title: "track record", sub: "hit-rate by signal type" },
          { href: "/digest", title: "digest", sub: "weekly rollup" },
        ]}
      />
    </PageShell>
  );
}
