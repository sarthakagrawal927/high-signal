"""Prediction-market adapter — Polymarket + Manifold Markets.

Pulls AI-infra / semi-related markets and emits both Event objects (for audit)
and quote dicts (for direct /admin/quotes push). Quotes are time-series so we
re-poll every 4h via cron-markets.yml.
"""

from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any

import httpx

from ..extract.entities import gazetteer_match
from ..types import Event


LOGGER = logging.getLogger(__name__)
USER_AGENT = "high-signal/0.1 markets-ingest"

POLYMARKET_BASE = "https://gamma-api.polymarket.com/markets"
MANIFOLD_BASE = "https://api.manifold.markets/v0/search-markets"

DEFAULT_KEYWORDS: list[str] = [
    "NVIDIA",
    "AI chip",
    "TSMC",
    "OpenAI",
    "AGI",
    "GPU",
    "semiconductor",
    "ASML",
    "data center",
    "Stargate",
]


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def _resolve_entity(text: str) -> str | None:
    hits = gazetteer_match(text or "")
    return hits[0] if hits else None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _safe_float(v: Any) -> float | None:
    try:
        if v is None or v == "":
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


# --- Polymarket -------------------------------------------------------------


def _poly_url(slug: str | None, market_id: str) -> str:
    if slug:
        return f"https://polymarket.com/event/{slug}"
    return f"https://polymarket.com/market/{market_id}"


def fetch_polymarket(keywords: list[str] | None = None, days: int = 30) -> tuple[list[Event], list[dict]]:
    """Pull active Polymarket markets matching keywords. Returns (events, quotes)."""
    kws = keywords or DEFAULT_KEYWORDS
    events: list[Event] = []
    quotes: list[dict] = []
    seen_ids: set[str] = set()
    timeout = httpx.Timeout(20.0, connect=10.0)
    headers = {"User-Agent": USER_AGENT}
    fetched_at = _now()

    with httpx.Client(headers=headers, timeout=timeout, follow_redirects=True) as client:
        for kw in kws:
            try:
                r = client.get(
                    POLYMARKET_BASE,
                    params={"active": "true", "limit": 100, "search": kw},
                )
                if r.status_code != 200:
                    LOGGER.debug("polymarket %s status=%s", kw, r.status_code)
                    continue
                data = r.json()
            except (httpx.HTTPError, ValueError) as exc:
                LOGGER.debug("polymarket %s error: %s", kw, exc)
                continue

            markets = data if isinstance(data, list) else data.get("data") or []
            for m in markets:
                mid = str(m.get("id") or m.get("conditionId") or "")
                if not mid or mid in seen_ids:
                    continue
                seen_ids.add(mid)
                question = (m.get("question") or m.get("title") or "").strip()
                if not question:
                    continue
                slug = m.get("slug")
                url = _poly_url(slug, mid)

                # Polymarket "outcomePrices" can be a JSON-string list like '["0.42","0.58"]'
                prob = _extract_poly_prob(m)
                if prob is None:
                    continue
                volume = _safe_float(m.get("volumeNum") or m.get("volume"))
                resolved = bool(m.get("closed") or m.get("resolved"))
                resolved_outcome = None
                if resolved:
                    resolved_outcome = m.get("winningOutcome") or m.get("resolution")

                entity_id = _resolve_entity(question)
                raw_hash = _hash("polymarket", mid, fetched_at.strftime("%Y%m%d%H"))
                events.append(
                    Event(
                        id=raw_hash[:16],
                        source="market:polymarket",
                        source_url=url,
                        published_at=fetched_at,
                        title=question[:300],
                        content=f"Polymarket consensus on '{question}': YES={prob:.2%}",
                        primary_entity_id=entity_id,
                        raw_hash=raw_hash,
                    )
                )
                quotes.append(
                    {
                        "source": "polymarket",
                        "marketId": mid,
                        "entityId": entity_id,
                        "question": question[:500],
                        "outcome": "yes",
                        "prob": prob,
                        "volume": volume,
                        "resolved": resolved,
                        "resolvedOutcome": resolved_outcome,
                        "marketUrl": url,
                        "fetchedAt": fetched_at.isoformat(),
                    }
                )
    return events, quotes


def _extract_poly_prob(m: dict) -> float | None:
    """Polymarket returns YES price either as `lastTradePrice`, `outcomePrices`, or implied."""
    direct = _safe_float(m.get("lastTradePrice"))
    if direct is not None and 0 <= direct <= 1:
        return direct
    op = m.get("outcomePrices")
    if isinstance(op, str):
        try:
            import json

            op = json.loads(op)
        except Exception:
            op = None
    if isinstance(op, list) and op:
        v = _safe_float(op[0])
        if v is not None and 0 <= v <= 1:
            return v
    bid = _safe_float(m.get("bestBid"))
    ask = _safe_float(m.get("bestAsk"))
    if bid is not None and ask is not None:
        return (bid + ask) / 2
    return None


# --- Manifold ---------------------------------------------------------------


def fetch_manifold(keywords: list[str] | None = None) -> tuple[list[Event], list[dict]]:
    """Pull Manifold Markets matching keywords. Returns (events, quotes)."""
    kws = keywords or DEFAULT_KEYWORDS
    events: list[Event] = []
    quotes: list[dict] = []
    seen_ids: set[str] = set()
    timeout = httpx.Timeout(20.0, connect=10.0)
    headers = {"User-Agent": USER_AGENT}
    fetched_at = _now()

    with httpx.Client(headers=headers, timeout=timeout, follow_redirects=True) as client:
        for kw in kws:
            try:
                r = client.get(MANIFOLD_BASE, params={"term": kw, "limit": 25})
                if r.status_code != 200:
                    LOGGER.debug("manifold %s status=%s", kw, r.status_code)
                    continue
                data = r.json()
            except (httpx.HTTPError, ValueError) as exc:
                LOGGER.debug("manifold %s error: %s", kw, exc)
                continue

            markets = data if isinstance(data, list) else data.get("markets") or []
            for m in markets:
                mid = str(m.get("id") or "")
                if not mid or mid in seen_ids:
                    continue
                seen_ids.add(mid)
                question = (m.get("question") or "").strip()
                if not question:
                    continue
                # Manifold uses "BINARY", "MULTIPLE_CHOICE", etc. Only handle binary cleanly.
                outcome_type = (m.get("outcomeType") or "").upper()
                prob = _safe_float(m.get("probability"))
                if outcome_type != "BINARY" or prob is None:
                    continue
                url = m.get("url") or f"https://manifold.markets/market/{m.get('slug') or mid}"
                volume = _safe_float(m.get("volume"))
                resolved = bool(m.get("isResolved"))
                resolved_outcome = m.get("resolution") if resolved else None
                entity_id = _resolve_entity(question)
                raw_hash = _hash("manifold", mid, fetched_at.strftime("%Y%m%d%H"))

                events.append(
                    Event(
                        id=raw_hash[:16],
                        source="market:manifold",
                        source_url=url,
                        published_at=fetched_at,
                        title=question[:300],
                        content=f"Manifold consensus on '{question}': YES={prob:.2%}",
                        primary_entity_id=entity_id,
                        raw_hash=raw_hash,
                    )
                )
                quotes.append(
                    {
                        "source": "manifold",
                        "marketId": mid,
                        "entityId": entity_id,
                        "question": question[:500],
                        "outcome": "binary",
                        "prob": prob,
                        "volume": volume,
                        "resolved": resolved,
                        "resolvedOutcome": resolved_outcome,
                        "marketUrl": url,
                        "fetchedAt": fetched_at.isoformat(),
                    }
                )
    return events, quotes


# --- Aggregate + push -------------------------------------------------------


def fetch_all(
    keywords: list[str] | None = None, days: int = 30
) -> tuple[list[Event], list[dict]]:
    """Run both Polymarket + Manifold. Returns (events, quotes)."""
    events: list[Event] = []
    quotes: list[dict] = []
    try:
        e1, q1 = fetch_polymarket(keywords, days=days)
        events.extend(e1)
        quotes.extend(q1)
    except Exception as exc:
        LOGGER.warning("polymarket fetch failed: %s", exc)
    try:
        e2, q2 = fetch_manifold(keywords)
        events.extend(e2)
        quotes.extend(q2)
    except Exception as exc:
        LOGGER.warning("manifold fetch failed: %s", exc)
    return events, quotes


def push_quotes(quotes: list[dict]) -> int:
    """POST quotes to /admin/quotes. Mirrors writer.push_signal pattern."""
    if not quotes:
        return 0
    api = os.environ.get("API_BASE")
    tok = os.environ.get("ADMIN_TOKEN")
    if not api or not tok:
        LOGGER.info("push_quotes skipped — API_BASE or ADMIN_TOKEN missing")
        return 0
    total = 0
    chunk = 100
    with httpx.Client(timeout=30.0) as client:
        for i in range(0, len(quotes), chunk):
            batch = quotes[i : i + chunk]
            try:
                r = client.post(
                    f"{api.rstrip('/')}/admin/quotes",
                    headers={
                        "Authorization": f"Bearer {tok}",
                        "Content-Type": "application/json",
                    },
                    json={"quotes": batch},
                )
                if r.status_code >= 400:
                    LOGGER.warning("push_quotes %s %s", r.status_code, r.text[:200])
                    continue
                total += len(batch)
            except httpx.HTTPError as exc:
                LOGGER.warning("push_quotes error: %s", exc)
    return total
