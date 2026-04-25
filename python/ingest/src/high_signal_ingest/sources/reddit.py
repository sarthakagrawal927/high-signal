"""Reddit adapter — uses the public JSON endpoint (no auth needed for read-only)."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Iterator

import httpx

from ..types import Event


_HTTP = httpx.Client(
    headers={"User-Agent": "high-signal/0.1 reddit-ingest"},
    follow_redirects=True,
    timeout=30.0,
)

DEFAULT_SUBS = [
    "hardware",
    "semiconductors",
    "AMD_Stock",
    "NVDA_Stock",
    "MachineLearning",
    "LocalLLaMA",
    "datacenter",
]


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def fetch_subreddit(sub: str, since: datetime, limit: int = 100) -> Iterator[Event]:
    url = f"https://www.reddit.com/r/{sub}/new.json?limit={limit}"
    try:
        r = _HTTP.get(url)
    except Exception:
        return
    if r.status_code != 200:
        return
    data = r.json().get("data", {}).get("children", [])
    for c in data:
        d = c.get("data", {})
        created = d.get("created_utc")
        if not created:
            continue
        pub = datetime.fromtimestamp(float(created), tz=timezone.utc)
        if pub < since:
            continue
        permalink = "https://reddit.com" + d.get("permalink", "")
        title = d.get("title", "")
        body = d.get("selftext", "")
        if d.get("score", 0) < 20:
            # Skip low-signal posts
            continue
        raw_hash = _hash("reddit", sub, permalink)
        yield Event(
            id=raw_hash[:16],
            source=f"reddit:{sub}",
            source_url=permalink,
            published_at=pub,
            title=title or None,
            content=body or None,
            primary_entity_id=None,
            raw_hash=raw_hash,
        )


def fetch_all(days: int = 1, subs: list[str] | None = None) -> list[Event]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    out: list[Event] = []
    for sub in subs or DEFAULT_SUBS:
        out.extend(fetch_subreddit(sub, since))
    return out
