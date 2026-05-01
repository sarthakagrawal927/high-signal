# Legacy Extraction Ledger

Date: 2026-05-01

This ledger tracks what has been extracted from the legacy Fleet projects before
they are archived. The rule is simple: archive only after the needed behavior is
present in High Signal or explicitly rejected.

## Mentionpilot

Status: extracted for archive.

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
- Mention check execution and result writing moved into
  `workers/api/src/lib/mention-execution.ts` and wired to check creation.
- High Signal badge widget script added at `/products/badge/widget.js`.
- Reddit, Hacker News, and Product Hunt monitor sweeps moved into
  `workers/api/src/lib/external-monitors.ts` and exposed at
  `/products/mentions/configs/:id/monitors`.
- Reddit public search semantics, moved into the High Signal API community
  route as `searchRedditMentions`.
- Product framing for company-level signal extraction, now the
  `/mentions` surface.

Still useful as source material:
- Existing research docs on AI visibility and monitoring competitors.

Rejected for direct copy:
- Mentionpilot web styling and dashboard shell, because High Signal owns the
  design language now.
- Full old worker route graph, because it should be reintroduced behind High
  Signal product boundaries rather than kept as a parallel API.
- GEO, directory submission, and AXP crawler UX surfaces are not copied as
  standalone products. Their crawler/scoring ideas are source material for a
  later High Signal "site readiness" product, not a blocker for retiring
  Mentionpilot from Fleet.

## Agent Mode

Status: extracted for archive.

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
- Reddit research execution and AI/fallback summary generation moved into
  `workers/api/src/lib/community-research.ts` and wired to tracked-community
  digest creation.

Still useful as source material:
- Any remaining subreddit workflow edge cases not covered by the migrated
  product routes.

Rejected for direct copy:
- The old Agent Mode brand and generic research shell.
- The older standalone Next app structure, because it would duplicate High
  Signal's web app and design system.
- Google-token admin/auth scaffolding, because High Signal uses Clerk.

## Archive Gate

Archive gate result:
- High Signal now has execution paths for the required mention and community
  workflows.
- Equivalent tests exist for migrated contract and analyzer behavior.
- Monitor, badge, and research-generation behavior is either ported or
  explicitly rejected above.
- Legacy repos are clean and pushed.

Remaining High Signal backlog after archive:
- Enforce API ownership with the final Clerk/server auth boundary rather than
  caller-provided owner query/header values.
- Convert scheduled community digest generation from on-demand route execution
  into a recurring queue/cron workflow.
- Decide whether the rejected GEO/directory/AXP ideas deserve a separate
  High Signal site-readiness product later.
