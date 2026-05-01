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
- Reddit public search semantics, moved into the High Signal API community
  route as `searchRedditMentions`.
- Product framing for company-level signal extraction, now the
  `/mentions` surface.

Still useful as source material:
- Prompt/config/check CRUD flows and report generation routes.
- Badge widget and public trust surface.
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

Still useful as source material:
- Tracked subreddit create/update workflow.
- Research prompt execution flow.
- Discover and subreddit archive pages.

Rejected for direct copy:
- The old Agent Mode brand and generic research shell.
- The older standalone Next app structure, because it would duplicate High
  Signal's web app and design system.

## Archive Gate

Do not archive or remove `mentionpilot` or `agentMode` until:
- High Signal has production routes for the required mention and community
  workflows.
- Equivalent tests exist for migrated behavior.
- Legacy repos have been pushed.
- GitHub repository archive flags have been set.
- Fleet directory removal is done only after the archive step succeeds.
