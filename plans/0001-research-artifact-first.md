# Plan 0001 — Research-Artifact-First

Status: active
Created: 2026-04-25
Supersedes: `archive/0001-2026-04-25-saas-bootstrap.md` (SaaS-bootstrap framing — replaced after deciding to optimize for compounding research value over revenue)

## North star
Ship a **public, evidence-backed, versioned signal log for AI-infra / semiconductors** — accuracy claims auditable in real time. Product later, if at all. The artifact is the moat.

## Locked decisions
- **Wedge**: AI infra / semiconductors. Small entity graph (~50-200 names), news-dense, retail attention high, spillover dominant.
- **Horizon**: weekly digest + on-event signal cards (latency budget for cards: < 4 hours after source publish).
- **Audience (not "buyer")**: retail-prosumer + sector analyst on Twitter / Substack. No paid product Y1.
- **Output channels**: public web page + RSS + Twitter thread per signal + weekly Substack digest.
- **Naming**: ship under codename `high-signal`. Final brand decision post-traction (collision with High Signal Labs / HQ flagged in SPEC).
- **Hit-rate ledger is public from day 1.** Brutal honesty is the unique moat — every signal logged, every prediction scored, no retroactive edits.

## Architecture pillars
- **Python ingestion + scoring** (edgartools, Trafilatura, GLiNER, GLiREL, NetworkX, FinBERT, VectorBT) — runs as scheduled jobs, output goes to D1.
- **TS Next.js web** for signal cards, entity pages, hit-rate ledger, weekly digest archive.
- **Cloudflare Workers + D1** for API + cron triggering Python jobs.
- **Modal.com** for Python ingestion runtime (already used in `reel-maker` — known pattern).
- **Git-versioned signal log** — every signal committed as a markdown file under `signals/YYYY-MM-DD/<slug>.md` with frontmatter (entities, direction, confidence, evidence URLs, predicted-window). Web app reads from git. Edits = new commits, never rewrites.

## Phase plan

### Phase 0 — Foundations (week 1)
- Repo scaffold: pnpm workspace, `apps/web`, `packages/db`, `workers/api`, `python/ingest`, `signals/`
- Drizzle schema in `packages/db`: `entities`, `events`, `signals`, `evidence`, `relationships`, `score_runs`
- Wrangler + D1 set up; Modal deploy stub for Python jobs
- Seed entity list: ~150 AI-infra companies (NVDA, AMD, AVGO, TSMC, ASML, AMAT, LRCX, KLAC, MU, HBM suppliers, hyperscalers, power names, Indian semis, etc.)
- Manual relationship seed: supplier → customer, foundry → fabless, peer sets

### Phase 1 — Ingestion + first signal (weeks 2-3)
- Source adapters in `python/ingest/sources/`:
  - SEC EDGAR 8-Ks (via edgartools) — material events
  - Company IR + blog RSS (Trafilatura)
  - Top 30 AI-infra news outlets (Trafilatura)
  - Reddit (r/hardware, r/semiconductors, r/AMD_Stock, r/NVDA_Stock)
- Entity extraction: GLiNER zero-shot with seed entity gazetteer
- Signal generator (LLM-assisted): event → affected primary entity → direct sentiment + confidence + evidence bundle
- Output: first signal markdown committed to `signals/`
- Web: signal card route renders any signal markdown

### Phase 2 — Spillover graph (weeks 4-5)
- Relation extraction: GLiREL on news + filings → triples
- Merge into NetworkX graph; persist edges in D1
- Spillover algo v0: BFS 2 hops with edge-weighted decay; output predicted-affected entity set with direction
- Manual review queue — human approves edges + spillover sets before publish (kills early hallucination problem)
- Signal cards now render: primary entity + 2nd-order entities + evidence
- First weekly digest published

### Phase 3 — Hit-rate ledger (weeks 6-7)
- Backtest harness using VectorBT — for every published signal, compute forward returns over predicted window (5d / 20d / 60d)
- Score: directional hit / miss / push (within ±0.5σ band)
- Public `/track-record` page — sortable by signal type, sector, time, primary entity
- Versioned `score_runs` — each rescore is a new row, not a mutation
- Twitter bot posts weekly hit-rate update

### Phase 4 — Compound (week 8+)
- Add: GitHub releases (semis tooling repos), job postings (AI-infra hiring signals), earnings transcripts (Quartr-style — start with company IR, no licensed feeds)
- Refine spillover weights using observed historical hit-rates
- Consider: subscriber-only deeper digest (only after hit-rate page shows real edge)

## Quality gates
- No signal ships without ≥ 2 cited sources
- Confidence is a band, not a number — `low` / `medium` / `high`, calibrated post-hoc against hit-rate
- No retroactive edits — corrections are new signals citing the prior one
- Spillover edges flagged `unverified` until manually reviewed once
- Weekly self-audit — count signals shipped, hit-rate by type, sources broken, entities missed

## Out of scope (resist)
- Multi-wedge (resist semis → AI software → biotech expansion until hit-rate is real)
- Full agent UI, chat over docs, deep research workflows (saturated by AlphaSense / Brightwave / Hebbia)
- Licensed datasets (premature; defer to Phase 5)
- Vector retrieval (defer until evidence search becomes a real bottleneck — graph + full-text covers v0)
- Paid SaaS, billing, multi-tenancy
- Mobile app
- Discord / Slack alerts (RSS + email + Twitter is enough)

## Success criteria (12 weeks in)
- ≥ 50 signals shipped publicly
- ≥ 12 weekly digests published
- Hit-rate page live with at least one full backtest cycle (60d signals from week 1 maturing in week 9)
- ≥ 500 subscribers (Substack + RSS combined)
- ≥ 1 unsolicited inbound from sector analyst / fund / journalist citing the work

## Risks + mitigations
- **Source quality drift** → log per-source signal counts + per-source hit-rate from day 1; cull underperformers
- **Entity resolution drift** → manual seed gazetteer; add LLM-resolution only for new entities, always reviewed
- **Hallucinated relationships** → gate every new edge through manual review queue for first 4 weeks; auto-publish only after edge type has ≥ 90% precision in review
- **Hit-rate looks bad early** → expected; honesty is the moat; ship anyway. If post-week-12 hit-rate < random for the wedge, halt and reassess premise
- **Burnout** → 2 signals + 1 digest is the weekly minimum, not the goal; if can't sustain, scope to monthly cadence

## Next concrete actions
1. `pnpm init` workspace
2. Scaffold `apps/web` (Next.js 16) + `workers/api` (Hono) + `python/ingest` (uv-managed)
3. Drizzle schema + first migration
4. Seed entity CSV in `python/ingest/seed/ai_infra_entities.csv`
5. First adapter: SEC EDGAR 8-K poll → log to `signals/draft/`
