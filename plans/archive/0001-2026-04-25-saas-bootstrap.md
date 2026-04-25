# Plan 0001 — V0 wedge + bootstrap

Status: draft
Created: 2026-04-25

## Decisions to lock before code
- **Wedge**: pick one — AI infra / semis | Indian public markets | enterprise SaaS categories
- **Horizon**: weekly | monthly | quarterly
- **Buyer**: sector analyst | market researcher | serious retail | operator
- **Naming**: confirm `High Signal` is usable or pick alternate (collision with High Signal Labs / HQ)

## Bootstrap steps
1. `pnpm init` workspace at root, scaffold `apps/web` with Next.js 16
2. `wrangler init` workers/api (Hono), workers/ingest (cron + queue consumer)
3. Drizzle + D1 schema in `packages/db` — `entities`, `relationships`, `events`, `signals`, `evidence`, `scores`
4. Seed entity list for chosen wedge (~50 companies)
5. First source adapter: news RSS → `events` → `signals`
6. Web: entity page + signal card + watchlist
7. Weekly digest cron + email send

## Out of scope for V0
- Multi-wedge support
- Vector search (defer until evidence retrieval becomes the bottleneck)
- Backtest UI (CLI-only first)
- Premium licensed datasets

## Risks
- Source quality drift — set up source-level hit-rate tracking from day 1
- Entity resolution is hard — start manual, layer LLM-assist, never trust auto blindly
- Premature dashboard — ship signal logic before UI polish
