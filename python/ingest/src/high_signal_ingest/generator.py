"""Signal generator — uses an LLM to draft signal candidates from events.

Inputs: a clustered set of events about an entity over a window.
Output: SignalCandidate(s) ready for human review.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from typing import Iterable

import httpx

from .seed import signal_type_ids
from .types import Event, EvidenceItem, SignalCandidate

_PROMPT_TEMPLATE = """You are a signal extractor for AI-infra / semiconductor markets.
Given source events for one primary entity, decide if there is a meaningful
DIRECTIONAL signal worth publishing. Be conservative — most events are noise.

Output STRICT JSON (no commentary):
{
  "publish": true|false,
  "signal_type": "<one of: __SIGNAL_TYPES__>",
  "direction": "up|down|neutral",
  "confidence": "low|medium|high",
  "predicted_window_days": <int 5-90>,
  "spillover_entity_ids": ["TSMC","ASML",...],
  "headline": "<<= 90 chars>",
  "body_md": "<150-400 word evidence walkthrough citing each source by URL>"
}

Rules:
- "publish": true ONLY when there is a clear material change beyond noise
- Cite ≥ 2 distinct sources in body_md as inline links
- "confidence" calibration:
  - low: single weak source or rumor
  - medium: 2 corroborating sources
  - high: official filing/press release + corroborating coverage
- "spillover_entity_ids" must be a subset of the provided spillover candidates
- Window: capex 30-60d, lead-time 15-30d, design-win 60-90d, restriction 5-20d, earnings 5-15d
"""


def _prompt() -> str:
    return _PROMPT_TEMPLATE.replace("__SIGNAL_TYPES__", ", ".join(signal_type_ids()))


def _slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or "signal"


def _ai_complete(prompt: str, content: str) -> dict | None:
    """Call OpenAI-compatible endpoint configured via env.

    Defaults to Hugging Face Inference Router when only HF_TOKEN is set.
    """
    key = os.environ.get("AI_API_KEY") or os.environ.get("HF_TOKEN")
    base = os.environ.get("AI_BASE_URL") or (
        "https://router.huggingface.co/v1" if os.environ.get("HF_TOKEN") else None
    )
    model = os.environ.get("AI_MODEL", "meta-llama/Llama-3.3-70B-Instruct")
    if not base or not key:
        return None
    try:
        r = httpx.post(
            f"{base.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": content},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
            timeout=60.0,
        )
        if r.status_code != 200:
            return None
        msg = r.json()["choices"][0]["message"]["content"]
        return json.loads(msg)
    except Exception:
        return None


def generate(
    primary_entity_id: str,
    events: Iterable[Event],
    spillover_candidates: list[str],
) -> SignalCandidate | None:
    evs = list(events)
    if not evs:
        return None
    blob = "\n\n".join(
        f"--- SOURCE {i + 1}: {e.source_url}\nDATE: {e.published_at.isoformat()}\nTITLE: {e.title}\nCONTENT:\n{(e.content or '')[:4000]}"
        for i, e in enumerate(evs)
    )
    user = (
        f"PRIMARY ENTITY: {primary_entity_id}\n"
        f"SPILLOVER CANDIDATES: {', '.join(spillover_candidates)}\n\n"
        f"EVENTS:\n{blob}"
    )
    out = _ai_complete(_prompt(), user)
    if not out or not out.get("publish"):
        return None
    allowed_signal_types = set(signal_type_ids())
    if out.get("signal_type") not in allowed_signal_types:
        return None
    headline = out.get("headline", "signal")
    return SignalCandidate(
        slug=f"{primary_entity_id.lower()}-{_slugify(headline)}",
        signal_type=out["signal_type"],
        primary_entity_id=primary_entity_id,
        direction=out["direction"],
        confidence=out["confidence"],
        predicted_window_days=int(out.get("predicted_window_days", 20)),
        published_at=datetime.now(timezone.utc),
        evidence=[
            EvidenceItem(
                url=e.source_url,
                source_type=e.source.split(":")[0],
                excerpt=(e.content or "")[:300] if e.content else None,
                published_at=e.published_at,
            )
            for e in evs
        ],
        spillover_entity_ids=[
            s for s in out.get("spillover_entity_ids", []) if s in spillover_candidates
        ],
        body_md=out.get("body_md", ""),
    )
