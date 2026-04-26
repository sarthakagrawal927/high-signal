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
- DIRECTION calibration — DO NOT default to "up". This is the most important rule.
  Before deciding direction, write out (silently) BOTH the bull case AND the bear case
  the headline implies for the primary entity, then pick whichever is materially supported.
  - Misses, guidance cuts, layoffs, export restrictions, supply-chain hits,
    short reports, IP losses, design losses, regulator probes, capex CUT,
    inventory build, ASP decline, share-loss → "down"
  - Beats, raises, design wins, capex bumps, partnership ups, ASP up,
    share gains, lead-time tightening on a SHIPPING product → "up"
  - PR fluff, vague AI mentions, anniversary news, conflicting reports,
    sector rallies without entity-specific cause → "neutral" OR publish=false
- Negative-side examples that are EASY TO MISS (treat as "down"):
  * "X considering layoffs" — down
  * "Y postpones launch" — down
  * "Customer Z shifts allocation away from W" — down for W
  * "Supplier shutdown forces production pause" — down for affected
  * "Z's [product] underperforms benchmarks" — down
- Refuse-to-publish bias: if you cannot find ≥2 corroborating sources or the
  story is generic AI-stock-rally coverage, publish=false. Better to miss
  than to flood the feed with bullish noise.
- Treat the supplied event timestamps as the *as-of* moment. Reason ONLY from
  facts in the provided sources or knowledge that predates the latest source.
  Do NOT use any knowledge of events that occurred after the last source date.
"""


def _prompt() -> str:
    return _PROMPT_TEMPLATE.replace("__SIGNAL_TYPES__", ", ".join(signal_type_ids()))


def _slugify(s: str) -> str:
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:80] or "signal"


PROMPT_VERSION = "v2"


def _ai_complete(prompt: str, content: str) -> tuple[dict | None, dict]:
    """Call OpenAI-compatible endpoint. Returns (parsed_json, audit_meta).

    `audit_meta` is always populated (model + reason + latency + raw response
    if any) so callers can persist a llm_run row even on failure.
    """
    import time

    # Default to user's free-ai-gateway (OpenAI-compatible router across CF
    # Workers AI / HF Router / Groq / etc., open-auth, project-scoped quotas).
    base = os.environ.get(
        "AI_BASE_URL", "https://free-ai-gateway.sarthakagrawal927.workers.dev/v1"
    )
    key = os.environ.get("AI_API_KEY") or os.environ.get("HF_TOKEN") or "open"
    model = os.environ.get("AI_MODEL", "auto")
    project_id = os.environ.get("AI_PROJECT_ID", "high-signal")
    meta: dict = {
        "model": model,
        "prompt_version": PROMPT_VERSION,
        "reason": None,
        "raw_response": None,
        "latency_ms": None,
        "tokens_in": None,
        "tokens_out": None,
        "request_user": content[:8000],
    }
    if not base:
        meta["reason"] = "no_base_url"
        return None, meta
    started = time.monotonic()
    try:
        r = httpx.post(
            f"{base.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "project_id": project_id,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": content},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
            timeout=60.0,
        )
        meta["latency_ms"] = int((time.monotonic() - started) * 1000)
        if r.status_code != 200:
            meta["reason"] = f"http_{r.status_code}"
            meta["raw_response"] = r.text[:2000]
            return None, meta
        body = r.json()
        meta["raw_response"] = body
        usage = body.get("usage") or {}
        meta["tokens_in"] = usage.get("prompt_tokens")
        meta["tokens_out"] = usage.get("completion_tokens")
        msg = body["choices"][0]["message"]["content"]
        return json.loads(msg), meta
    except Exception as exc:
        meta["latency_ms"] = int((time.monotonic() - started) * 1000)
        meta["reason"] = f"exception:{exc}"[:200]
        return None, meta


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
    out, meta = _ai_complete(_prompt(), user)
    request_blob = {"primary": primary_entity_id, "user": meta.pop("request_user", "")}

    def _record(accepted: bool, slug: str | None, reason: str | None) -> None:
        from . import audit

        audit.push_llm_run(
            signal_slug=slug,
            model=meta["model"],
            prompt_version=meta["prompt_version"],
            accepted=accepted,
            reason=reason or meta.get("reason"),
            request_json=request_blob,
            response_json=meta.get("raw_response"),
            tokens_in=meta.get("tokens_in"),
            tokens_out=meta.get("tokens_out"),
            latency_ms=meta.get("latency_ms"),
        )

    if not out:
        _record(False, None, "no_response")
        return None
    if not out.get("publish"):
        _record(False, None, "publish_false")
        return None
    allowed_signal_types = set(signal_type_ids())
    if out.get("signal_type") not in allowed_signal_types:
        _record(False, None, f"bad_signal_type:{out.get('signal_type')}")
        return None

    headline = out.get("headline", "signal")
    slug = f"{primary_entity_id.lower()}-{_slugify(headline)}"
    cand = SignalCandidate(
        slug=slug,
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
    _record(True, slug, "ok")
    return cand
