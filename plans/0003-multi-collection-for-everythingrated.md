# Plan 0003 — Multi-collection support for EverythingRated

**Status:** **DEFERRED** (2026-04-26) — do not schedule. Design retained for future revisit.
**Created:** 2026-04-26
**Counterpart:** `/Users/sarthakagrawal/Desktop/fleet/everythingrated/plans/0002-signal-ingest.md` (the consumer-side plan; this file is the producer-side commitment)

## Why deferred

After committing this plan I challenged the premise with the owner. Conclusion: turning high-signal into a multi-collection engine to serve EverythingRated v0 is overconnection.

- **high-signal's own positioning is "research artifact first, product later, if at all"** (see README). Adding a `collection` partition, a second seed, an authed API surface, and a downstream consumer turns it into a multi-tenant platform. That is a real complexity tax on a repo that explicitly chose to stay focused.
- **Reuse for the consumer is shallow** — Reddit + HN + Modal cron (~2.5 days). The classifier (FinBERT) is the wrong tool for dev-tool slang, the gazetteer is different, signal cards and the hit-rate ledger don't apply. Not enough reuse to justify a permanent contract.
- **Forever-coupling.** Every change to `entities.{collection,slug}` or `events.{sentimentLabel,sentimentScore,intent}` becomes a breaking change for an external repo. The cost is paid on every future schema decision in here.
- **Option B is worst-of-both.** With one consumer, either no cross-repo wiring is correct (consumer rolls its own minimal poller), or Option C is correct (extract a `signal-engine` package both repos depend on). Option B was picked because Option C "needed multiple consumers to justify"; with one consumer, Option B inherits the cost without the leverage.

## What stays / what reverts

- **Stay:** this plan file itself, as the design archive. `agents.md` carries a one-line *Considered and deferred* pointer back here so future readers can find the analysis without polluting "Locked decisions".
- **Reverted from `agents.md`** (initially merged 2026-04-26, reverted same-day after the overconnection re-evaluation): the *Downstream consumers* section listing EverythingRated, and the *Multi-collection engine* locked-decision bullet. The engine is single-collection and AI-infra-only; nothing was shipped.
- **Do not implement:** the schema/seed/API/auth diffs enumerated below. None have been built. If you came here intending to ship a PR from this plan, stop and re-read the *Why deferred* section first.

## Trigger to revisit

Reopen this plan only when **all three** are true:

1. EverythingRated has validated its rating UX with real users (≥ 50 raters across ≥ 5 items) and external sentiment becomes the next-tier blocker for the product.
2. high-signal has shipped its own AI-infra wedge to a state the owner would call "production reliable" — i.e., daily cron has run unattended for ≥ 4 weeks, hit-rate ledger has ≥ 20 closed signals, and the public surface has external readers.
3. A third consumer of the engine is concretely planned (not hypothetical).

If 1 + 2 are true but 3 is not, EverythingRated should grow ~50 lines of standalone Reddit/HN polling and skip cross-service entirely. If all three are true, **start the revisit from Option C** (extract a `signal-engine` workspace package both repos depend on) — do not resurrect Option B by default.

The design below is preserved verbatim because the schema diff, intent taxonomy, route shapes, and lint-gate idea are all reusable artifacts regardless of whether the eventual architecture is B or C.

---

## Why this exists

A sibling repo at `/Users/sarthakagrawal/Desktop/fleet/everythingrated/` (multi-axis ratings POC, niche = AI dev tools) wants to read public sentiment + mention volume from this engine instead of building its own ingest stack. Decision recorded: high-signal is the single ingest engine across the portfolio. EverythingRated is a downstream HTTP consumer.

The producer constraint is the locked wedge — **AI infra / semiconductors only on the public surface**. AI dev tools (Cursor, Claude Code, Aider, Windsurf, etc.) must enter the engine without polluting that narrative. Architecture picked is **Option B — multi-collection engine**: one D1, one ingest, one cron; entities partitioned by `collection`. The public web filters to `collection = ai_infra` so the AI-infra story stays clean. EverythingRated subscribes to `collection = ai_dev_tools` via authed API.

Full rationale and rejected alternatives (A: extend wedge, C: extract `signal-engine` package): see the counterpart plan.

## Scope of this plan — only what changes inside high-signal

### 1. Schema (`packages/db/src/schema.ts`)
- `entities`: add `collection: text` (default `"ai_infra"`, indexed) and `slug: text` (indexed; unique per `(collection, slug)`).
- `events`: add `sentimentLabel: text`, `sentimentScore: real`, `intent: text`.
- New migration: `0001_collections_and_event_sentiment.sql` (current head is `0000`).

### 2. Seed (`python/ingest/src/high_signal_ingest/seed/`)
- `__init__.py` — `load_entities(collection: str = "ai_infra")` reads the matching CSV.
- New `ai_dev_tools_entities.csv` — ~15 rows: Cursor, Claude Code, Windsurf, GitHub Copilot, Aider, Cline, Continue, Codeium, Tabnine, Sourcegraph Cody, plus 5 reserve.
- Existing `ai_infra_entities.csv` and `relationships.csv` get a `collection` column set to `ai_infra`. Backfill via the same loader.

### 3. Sources config (`python/ingest/src/high_signal_ingest/seed/sources.yaml`)
- Tag every source with `collections: [ai_infra]` or `[ai_dev_tools]` or both.
- Add for `ai_dev_tools`:
  - Reddit: `r/cursor`, `r/ChatGPTCoding`, `r/ClaudeAI` (plus `r/LocalLLaMA` already present, retag to both).
  - News: HN front page already in news for `ai_infra` — extend with `collections: [ai_infra, ai_dev_tools]`. Add `https://hnrss.org/newest?q=cursor+OR+claude-code+OR+windsurf+OR+aider`.

### 4. Reddit adapter (`python/ingest/src/high_signal_ingest/sources/reddit.py`)
- Replace hardcoded `DEFAULT_SUBS` with `subs_for(collection)` reading from `sources.yaml`.

### 5. Pipeline (`python/ingest/src/high_signal_ingest/pipeline.py`)
- New `--collection ai_dev_tools` flag. Builds the gazetteer only from that collection's entities so a "Cursor" mention in r/semiconductors does not mistag.
- After entity tagging, invoke `score/intent.py` (new) to set `intent` on each event.
- After sentiment scoring, persist `sentimentLabel` + `sentimentScore` on each event row.

### 6. Sentiment + intent (`python/ingest/src/high_signal_ingest/score/`)
- `sentiment.py` (existing, FinBERT) — keep for `ai_infra`. Note in code that finance-tuning makes it unreliable on dev-tool slang ("sick", "fire", "trash"); a swap to a general-purpose model (DistilBERT-SST2) for the dev-tool collection is the v2 trigger if precision drops below ~0.7 on a 50-post spot check.
- New `intent.py` — small LLM classifier with a 7-label fixed taxonomy:
  - `praise`, `complaint`, `switching_to`, `switching_from`, `feature_request`, `comparison`, `neutral_mention`.
  - Below 0.5 confidence → fall back to `neutral_mention`.

### 7. API (`workers/api/src/routes/entities.ts`)
- Extend `GET /entities` to accept `?collection=` (alongside the existing `?sector=`); return the new `slug` field.
- New `GET /entities/:id/signals?since=&until=` — daily-bucketed aggregates over `events`: counts, sentiment summary, source breakdown, intent breakdown. Response shape locked in counterpart plan.
- New `GET /entities/:id/mentions?since=&until=&limit=` — paginated raw events with sentiment + intent + excerpt. Cursor-paginated.

### 8. API auth (`workers/api/src/index.ts`)
- New tiny middleware applied to `/entities/:id/signals` and `/entities/:id/mentions` only: validate `x-er-key` against env secret. Public web (`apps/web`) does not need it; only the EverythingRated route.
- Add `ER_API_KEY` to `workers/api/wrangler.toml` vars + Modal Secret. EverythingRated holds the same value in its Vercel env.

### 9. Public web (`apps/web/`)
- Every `entities` query gains `collection = ai_infra`. One-line filter at each call site. UI unchanged.

### Explicitly out of scope
- No new ingest source files.
- No new classifier model training.
- No `signals` schema rewrite — signal cards stay AI-infra-only. Dev-tool wedge gets event-level sentiment + intent without going through the full signal-card pipeline. Whether to generate signal cards for the dev-tool wedge later is the third open question in the counterpart plan and is deferred (forward-return calibration does not transfer cleanly to private dev-tool startups).

## Sequencing

Land in this order so each step is independently reviewable:

1. Schema migration + backfill `collection = "ai_infra"` on existing rows + add `slug` for current entities (slugify `name`). One PR.
2. Seed loader + `ai_dev_tools_entities.csv` + `sources.yaml` retag. One PR.
3. Reddit adapter + pipeline `--collection` flag. One PR.
4. `score/intent.py` + persist sentiment/intent on events. One PR.
5. API routes + `x-er-key` middleware. One PR.
6. `apps/web` collection filter. One PR (smallest; can ship same day as 5).

Total: ~6 small PRs. The dev-tool wedge becomes queryable after step 5; EverythingRated can wire to it after step 6.

## Open questions

These are the same three as the counterpart plan — repeated here so they appear in this repo's plans index too.

1. **Sentiment model fitness on dev-tool slang.** Spot-check 50 r/cursor posts after first ingest; swap if precision <0.7.
2. **Slug uniqueness.** `unique(collection, slug)`, not global. Locked.
3. **Signal cards for dev tools — yes or no?** Deferred. Event-level sentiment + intent is enough for EverythingRated; full directional signals would need a different scoring model since forward-return doesn't apply to private dev-tool startups.

## Risks specific to this engine

- **Brand pollution.** If the `apps/web` collection filter is missed at any call site, dev-tool signals leak into the public AI-infra surface. Mitigation: `entities.collection` is `notNull`, and a single `withCollection(query, "ai_infra")` helper in `packages/db/src/queries.ts` is the only way `apps/web` should query entities. Lint or grep gate in CI.
- **Cron cost.** Adding the dev-tool wedge to the daily Modal cron increases entity gazetteer size (~290 → ~305) and source set (~168 → ~175). Negligible. If it ever isn't, split into two cron schedules — one per collection.
- **Hit-rate ledger contamination.** The public hit-rate ledger is calibrated on AI-infra signal cards only. Dev-tool wedge produces no signal cards in this plan, so no contamination risk. Re-evaluate if open question 3 resolves to "yes."

## Source of authority

If this plan and `0002-signal-ingest.md` ever drift, this file owns the producer-side spec (schema, ingest, API surface, auth). The counterpart owns the consumer-side spec (composite UX, caching, EverythingRated's `/[slug]` data shape). Cross-references — not duplication — are the goal.
