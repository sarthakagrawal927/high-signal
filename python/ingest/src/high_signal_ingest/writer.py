"""Write signals as git-versioned markdown into ../../signals/YYYY-MM-DD/."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import yaml

from .types import SignalCandidate


SIGNALS_ROOT = Path(__file__).resolve().parents[3] / "signals"


def write_signal(candidate: SignalCandidate, root: Path | None = None) -> Path:
    root = root or SIGNALS_ROOT
    day = candidate.published_at.strftime("%Y-%m-%d")
    dir_ = root / day
    dir_.mkdir(parents=True, exist_ok=True)
    fp = dir_ / f"{candidate.slug}.md"

    front = {
        "slug": candidate.slug,
        "signal_type": candidate.signal_type,
        "primary_entity": candidate.primary_entity_id,
        "direction": candidate.direction,
        "confidence": candidate.confidence,
        "predicted_window_days": candidate.predicted_window_days,
        "published_at": candidate.published_at.isoformat(),
        "evidence_urls": [e.url for e in candidate.evidence],
        "spillover_entity_ids": candidate.spillover_entity_ids,
        "supersedes": candidate.supersedes_signal_id,
        "review_status": "draft",
    }
    body = candidate.body_md.strip()
    fp.write_text(
        f"---\n{yaml.safe_dump(front, sort_keys=False).strip()}\n---\n\n{body}\n",
        encoding="utf-8",
    )
    return fp


def write_signal_dict(d: dict, root: Path | None = None) -> Path:
    root = root or SIGNALS_ROOT
    day = datetime.fromisoformat(d["published_at"]).strftime("%Y-%m-%d")
    dir_ = root / day
    dir_.mkdir(parents=True, exist_ok=True)
    fp = dir_ / f"{d['slug']}.md"
    body = d.pop("body_md", "")
    fp.write_text(
        f"---\n{yaml.safe_dump(d, sort_keys=False).strip()}\n---\n\n{body.strip()}\n",
        encoding="utf-8",
    )
    return fp
