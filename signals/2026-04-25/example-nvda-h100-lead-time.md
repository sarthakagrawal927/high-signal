---
slug: example-nvda-h100-lead-time
signal_type: gpu_lead_time_shift
primary_entity: NVDA
direction: up
confidence: medium
predicted_window_days: 20
published_at: 2026-04-25T18:00:00Z
evidence_urls:
  - https://example.com/source-1
  - https://example.com/source-2
spillover_entity_ids:
  - TSM
  - SK_HYNIX
  - ASML
supersedes: null
review_status: draft
---

# Example: NVDA H100 lead times reportedly shortening — read with skepticism

This is a **template signal** demonstrating the markdown format expected by `scripts/sync-signals.ts`. It is not a real signal. Delete this file before the first real ingest cycle, or flip `review_status` to `draft` and use it as a smoke-test fixture.

## What changed

Two independent reports indicate H100 lead times moved from ~12 weeks down to ~8 weeks for tier-2 buyers, while remaining stretched for hyperscaler-direct allocations. If sustained, this implies channel inventory is normalizing and Blackwell handover is tracking ahead of schedule. ([source 1](https://example.com/source-1), [source 2](https://example.com/source-2)).

## Why it matters

Lead-time shifts are a leading indicator for both **NVDA gross-margin guide** (less spot premium) and **HBM allocation** dynamics (SK Hynix / Samsung / Micron). A normalizing channel is consistent with the Blackwell ramp consuming TSMC CoWoS slots that previously bottlenecked H100 packaging.

## Spillover map

- **TSM (CoWoS-L bottleneck)** — capacity expansion narrative re-tightens if Blackwell ramp accelerates.
- **SK_HYNIX (HBM3e primary)** — incremental ASP support if Blackwell volume is in line with the new schedule.
- **ASML (lithography)** — second-order, slower window.

## Confidence — calibration

`medium` because the two sources corroborate but neither is an official disclosure. A `high` rating would require either an NVDA earnings comment or a TSMC IR confirmation. Window: 20 days, consistent with prior lead-time shifts in this product cycle.

## What would invalidate this

- NVDA guides next earnings to slower-than-expected Blackwell ramp.
- TSMC IR pushes back on CoWoS-L expansion timeline.
- SK Hynix / Micron HBM3e ASPs print weak.

If invalidated, this signal will be superseded with a corrected one citing this note, not edited in place.
