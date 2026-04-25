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
Pre-bootstrap. Spec at `SPEC.md`. Build plan at `plans/0001-research-artifact-first.md`. Market + OSS research at `research/market-and-oss.md`.

## Quick links
- Spec: `SPEC.md`
- Plan: `plans/0001-research-artifact-first.md`
- Research: `research/market-and-oss.md`
- Stack + conventions: `agents.md`

## Naming
Codename `high-signal` collides with High Signal Labs / High Signal HQ. Final brand TBD post-traction.
