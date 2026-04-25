# High Signal

Public, evidence-backed, versioned signal log for **AI infra / semiconductors**. Every signal cites sources, predicts direction with a confidence band, gets auto-scored on a public hit-rate ledger.

Research artifact first. Product later, if at all. The honesty is the moat.

## What it does
- Ingests SEC 8-Ks, IR pages, top semis news, Reddit, GitHub releases, hiring signals
- Extracts events + entities + relationships
- Predicts direction + 2nd-order spillover via supplier/customer/peer graph
- Publishes signal cards + weekly digest
- Auto-backtests every signal — public hit-rate ledger updated continuously

## Why this wedge
- Small entity graph (~150 names) — tractable solo
- News-dense, retail-attentive, spillover-dominant alpha pattern (TSMC capex → ASML → HBM → cloud capex → power names)
- Existing incumbents (AlphaSense, Brightwave, Daloopa) own enterprise research workflows; nobody ships a directed spillover graph + public hit-rate
- Source layer is fully covered by OSS — no licensed feeds required for v0

## Status
Scaffolded. Worker API + Next.js web + Python ingest + 274 entities + 175 relationships + 31 signal types + 168 sources all committed. Awaiting first ingest cycle.

## Architecture
```
apps/web              Next.js 16 + Tailwind v4 — futurist + clean UI
workers/api           Hono on Cloudflare Workers + D1 binding + cron
packages/db           Drizzle schema + migrations (sqlite/D1)
packages/shared       Cross-package types
python/ingest         uv-managed: edgartools, Trafilatura, GLiNER, FinBERT, yfinance
  └ deploys to Modal  Daily cron @ 06:00 UTC triggers full ingest
signals/              Git-versioned, append-only signal markdown
scripts/              CSV→D1 + signals.md→D1 sync
```

## Quickstart
```bash
# 1. Node deps
pnpm install

# 2. Python deps
cd python/ingest && uv sync && cd -

# 3. Cloudflare D1
wrangler d1 create high-signal-db        # paste the id into workers/api/wrangler.toml
pnpm db:migrate:local
pnpm db:seed:local                       # loads 274 entities + 175 relationships

# 4. Env (.dev.vars + Modal Secret named `high-signal`)
#   AI_BASE_URL, AI_API_KEY, AI_MODEL
#   SEC_USER_AGENT="your-name your@email"

# 5. Dev
pnpm dev                                 # web (3000) + worker (8787)

# 6. Draft signals
cd python/ingest && uv run python -m high_signal_ingest.pipeline --source news --days 1

# 7. Review + publish
#   - open signals/<date>/<slug>.md
#   - flip review_status: published
#   - git commit
pnpm signals:sync:local
```

## Quick links
- Spec: `SPEC.md`
- Plan: `plans/0001-research-artifact-first.md`
- Research: `research/market-and-oss.md`
- Stack + conventions: `agents.md`
- Seed corpus: `python/ingest/src/high_signal_ingest/seed/`
- Example signal: `signals/2026-04-25/example-nvda-h100-lead-time.md`

## Deploy
- Web → Vercel (`apps/web`)
- API → Cloudflare Workers (`cd workers/api && pnpm deploy`)
- Ingest → Modal (`cd python/ingest && uv run modal deploy modal_app.py`)

## Naming
Codename `high-signal` collides with High Signal Labs / High Signal HQ. Final brand TBD post-traction.
