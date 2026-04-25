# agents.md — high-signal

## Purpose
**Public, evidence-backed, versioned signal log for AI infra / semiconductors.** Every signal cites sources, predicts direction with a confidence band, and is auto-scored for forward returns on a public hit-rate ledger. Research artifact first — product later, if at all.

Full product brief: `SPEC.md`. Active build plan: `plans/0001-research-artifact-first.md`.

## Locked decisions
- **Wedge**: AI infra / semiconductors only
- **Horizon**: weekly digest + on-event signal cards
- **Audience**: retail-prosumer + sector analyst on Twitter / Substack (no paid product Y1)
- **Output channels**: public web page + RSS + Twitter thread per signal + weekly Substack digest
- **Codename**: `high-signal` (rebrand TBD post-traction; collision with High Signal Labs / HQ)

## Stack
- **Web**: Next.js 16 (App Router, Turbopack) — `apps/web`
- **API**: Hono on Cloudflare Workers — `workers/api`
- **DB**: Cloudflare D1 + Drizzle — schema in `packages/db`
- **Python ingestion + scoring**: edgartools, Trafilatura, GLiNER, GLiREL, NetworkX, FinBERT, VectorBT — runs on Modal.com — `python/ingest`
- **Signal store**: git-versioned markdown under `signals/YYYY-MM-DD/<slug>.md` — append-only, never rewritten
- **Auth**: NextAuth v5 (Google OAuth) — only for admin / review queue
- **Testing**: Vitest (TS), pytest (Python), Playwright (e2e)
- **Deploy**: Vercel (web) + Cloudflare Workers (API + cron) + Modal (ingest)
- **Package manager**: pnpm workspace + uv (Python)

## Planned repo structure
```
apps/
  web/                 # Next.js — signal feed, entity pages, hit-rate ledger, digest archive
packages/
  db/                  # Drizzle schema (entities, events, signals, evidence, relationships, score_runs)
  shared/              # Types shared by web + workers
workers/
  api/                 # Hono — REST/RPC for web app + cron triggering Modal jobs
python/
  ingest/              # Source adapters, entity/relation extraction, signal generator
    sources/           # edgar.py, news.py, reddit.py, ir.py, ...
    extract/           # gliner_ner.py, glirel_relations.py
    score/             # finbert_sentiment.py, backtest.py
    seed/              # ai_infra_entities.csv, relationships.csv
signals/               # git-versioned signal markdown files (append-only)
plans/                 # Active plans (archive prior versions in plans/archive/)
research/              # Domain notes, source experiments, prompt drafts, market research
```

## Architecture pillars
- **Evidence-first** — no signal ships without ≥ 2 cited sources
- **Spillover map** — event → direct impact → 2nd-order entities via supplier/customer/peer edges
- **Versioned signal memory** — signal log is git; corrections are new signals citing prior
- **Confidence as a band** — `low` / `medium` / `high`, calibrated post-hoc against hit-rate
- **Public hit-rate ledger from day 1** — moat that competitors can't copy without rebuilding
- **Manual review queue** — first 4 weeks, every signal + every new graph edge gates through human review

## UI direction (locked)
**Futurist + very clean.** Visual credibility = signal credibility.
- Dark default. Monochrome zinc base. One accent (cyan-400) only on directional signals.
- Geist Sans + Geist Mono. Tabular numerals on every metric.
- 1px lines, no shadows, no rounded-3xl. Whitespace generous.
- Reference points: Linear, Vercel admin, Stripe Atlas, Bloomberg terminal, Perplexity detail views.
- Animations only on state change (signal published, hit-rate update). No decorative motion.

## saas-maker integrations
Reuse user's `@saas-maker/*` packages instead of rebuilding:
- `@saas-maker/ai` — AI provider in web + worker (signal generation, summarization)
- `@saas-maker/ops` — worker observability
- `@saas-maker/foundry-db` — D1/Drizzle helpers in worker
- `@saas-maker/foundry-email` — weekly digest email
- `@saas-maker/analytics-sdk` — usage events on web
- `@saas-maker/feedback-widget` — feedback on every signal card
- `@saas-maker/waitlist-widget` — pre-launch landing
- `@saas-maker/{eslint,prettier,tsconfig}-config` — shared tooling

## Quality gates
- Cite or kill — minimum 2 sources per signal
- No retroactive edits — corrections via new commits citing the prior signal
- Spillover edges flagged `unverified` until reviewed once
- Per-source hit-rate logged; cull underperformers
- Weekly self-audit: signals shipped, hit-rate by type, sources broken, entities missed

## Out of scope (resist)
- Multi-wedge expansion before hit-rate is real
- Agent UI / chat-over-docs (saturated by AlphaSense, Brightwave, Hebbia)
- Licensed datasets (premature)
- Vector retrieval (defer until evidence search is the bottleneck)
- Paid SaaS, billing, multi-tenancy
- Mobile app, Discord/Slack alerts (RSS + email + Twitter is enough)

## Active context

### Built (2026-04-25)
- **Monorepo scaffolded** — pnpm workspace, web + api + db + shared, plus `python/ingest`
- **Drizzle schema + 0000 migration** — entities, relationships, events, signals, evidence, score_runs
- **Seed data** in `python/ingest/src/high_signal_ingest/seed/`:
  - `ai_infra_entities.csv` — 274 entities across the full AI-infra stack
  - `relationships.csv` — 175 curated supplier/customer/peer/partner edges with citations
  - `signal_types.yaml` — 31 signal types with extraction patterns + windows + spillover hints
  - `sources.yaml` — 168 sources (74 tier-1) across IR, news, blogs, SEC, Reddit, X, GitHub, conferences, gov
- **Python ingest pipeline** — `sources/{edgar,news,reddit,ir}.py`, `extract/entities.py` (gazetteer + GLiNER), `score/{sentiment,backtest}.py`, `generator.py` (LLM signal drafter), `writer.py` (markdown to `signals/`), `pipeline.py` (orchestrator)
- **Modal deploy** — `modal_app.py` with daily cron @ 06:00 UTC
- **Worker API (Hono on CF Workers)** — routes: `/signals`, `/signals/:slug`, `/signals/by-entity/:id`, `/entities`, `/entities/:id`, `/track-record`, `/track-record/series`, `/digest/weekly`, `/digest/rss`; cron handler triggers Modal
- **Web app (Next.js 16, Tailwind v4, futurist UI)** — pages: `/`, `/signals`, `/signals/[slug]`, `/entities`, `/entities/[id]`, `/track-record`, `/digest`, OG image route, 404
- **Components** — `DirectionPill`, `ConfidenceBadge`, `SignalCard` atoms+molecules
- **Scripts** — `scripts/seed-d1.ts` (CSV → D1), `scripts/sync-signals.ts` (markdown → D1)

### Next concrete actions for user
1. `pnpm install` at repo root
2. `cd python/ingest && uv sync`
3. `wrangler d1 create high-signal-db` → paste id into `workers/api/wrangler.toml`
4. `pnpm db:migrate:local && pnpm db:seed:local`
5. Set env: `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`, `SEC_USER_AGENT` (Modal Secret named `high-signal`)
6. `pnpm dev` — runs web + worker
7. `cd python/ingest && uv run python -m high_signal_ingest.pipeline --source news --days 1` to draft first signals into `signals/draft/`
8. Manual review: open drafts → flip frontmatter `review_status: published` → commit → `pnpm signals:sync:local`
