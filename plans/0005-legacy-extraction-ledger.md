# Legacy Extraction Ledger

Date: 2026-05-01

This ledger tracks what has been extracted from the legacy Fleet projects before
they are archived. The rule is simple: archive only after the needed behavior is
present in High Signal or explicitly rejected.

## Mentionpilot

Status: partially extracted.

Extracted:
- AI visibility response analyzer, moved into `@high-signal/shared` as
  `analyzeMentionVisibility`.
- Brand config, prompt, check, and result contracts mapped into
  `@high-signal/shared` as High Signal product contracts.
- Prompt, config, check, result, schedule, and badge-enabled persistence mapped
  into High Signal D1 tables.
- Product dashboard read route added at `/products/dashboard` so the web app can
  render persisted migration objects behind the High Signal boundary.
- First authenticated dashboard destination surface added at `/dashboard` for
  brand checks and tracked communities.
- Product-scoped mention config, prompt, check, report, and badge data routes
  added under `/products/mentions/*` and `/products/badge/:configId`.
- Reddit public search semantics, moved into the High Signal API community
  route as `searchRedditMentions`.
- Product framing for company-level signal extraction, now the
  `/mentions` surface.

Still useful as source material:
- AI check execution engine and result-writing workflow behind the prompt/check
  routes.
- Badge widget embed script and public trust UI surface.
- Geo, directory, HN, Product Hunt, and AXP monitors.
- Existing research docs on AI visibility and monitoring competitors.

Rejected for direct copy:
- Mentionpilot web styling and dashboard shell, because High Signal owns the
  design language now.
- Full old worker route graph, because it should be reintroduced behind High
  Signal product boundaries rather than kept as a parallel API.

## Agent Mode

Status: partially extracted.

Extracted:
- Subreddit metadata lookup, moved into the High Signal API as
  `/communities/reddit/:subreddit`.
- Community Intelligence product framing, now the `/communities` surface.
- Source-linked Reddit mention path, combined with Mentionpilot's Reddit search
  implementation.
- Source-linked summary contract (`keyTrend`, `notableDiscussions`,
  `keyAction`, and `sourceId`) moved into `@high-signal/shared` and surfaced on
  `/communities`.
- Tracked community contract moved into `@high-signal/shared` and represented
  on `/dashboard`.
- Tracked community and digest snapshot persistence moved into High Signal D1
  tables and exposed through `/products/dashboard`.
- Product-scoped tracked community and digest write routes added under
  `/products/communities/tracked/*`.
- Discover and subreddit archive pages ported into High Signal at `/discover`
  and `/communities/[subreddit]/[period]`.
- Public digest discovery and archive API routes added under
  `/products/communities/discover` and
  `/products/communities/:subreddit/:period/digests`.

Still useful as source material:
- Research prompt execution flow and scheduled digest generation.
- Any remaining subreddit workflow edge cases not covered by the migrated
  product routes.

Rejected for direct copy:
- The old Agent Mode brand and generic research shell.
- The older standalone Next app structure, because it would duplicate High
  Signal's web app and design system.

## Archive Gate

Do not archive or remove `mentionpilot` or `agentMode` until:
- High Signal has production execution paths for the required mention and
  community workflows, not only route surfaces.
- Equivalent tests exist for migrated behavior.
- Mentionpilot monitor crawlers, badge embed/public trust surfaces, and
  AgentMode scheduled research generation are either ported or explicitly
  rejected.
- API ownership is enforced with the final Clerk/server auth boundary rather
  than caller-provided owner query/header values.
- Legacy repos have been pushed.
- GitHub repository archive flags have been set.
- Fleet directory removal is done only after the archive step succeeds.
