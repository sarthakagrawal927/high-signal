# signals/

Git-versioned, append-only signal log. Each signal is one markdown file at `signals/YYYY-MM-DD/<slug>.md` with frontmatter:

```markdown
---
slug: nvda-h100-lead-time-cut
signal_type: lead_time_shift
primary_entity: NVDA
direction: up
confidence: medium
predicted_window_days: 20
published_at: 2026-05-01T14:30:00Z
evidence_urls:
  - https://example.com/source-1
  - https://example.com/source-2
spillover_entity_ids: [ASML, AMAT, LRCX]
supersedes:
---

Body of the signal — what changed, why it matters, evidence walkthrough, scenario reasoning, confidence calibration notes.
```

Conventions:
- Append-only. Never edit a published signal in place — supersede with a new one.
- Slugs are kebab-case. Stable.
- Evidence URLs are immutable archives where possible (archive.org, archive.ph) or stable canonical URLs.
- The signal markdown is the source of truth. The DB row mirrors it for query speed.
