"""IR (investor relations) page poller — checks IR pages for press releases."""

from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Iterator
from urllib.parse import urljoin

import httpx

from ..seed import load_entities
from ..types import Event


_HTTP = httpx.Client(
    headers={"User-Agent": "high-signal/0.1 ir-ingest"},
    follow_redirects=True,
    timeout=30.0,
)


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def poll_ir_page(entity_id: str, ir_url: str) -> Iterator[Event]:
    """Fetch IR landing page + extract press-release links via Trafilatura."""
    try:
        import trafilatura

        r = _HTTP.get(ir_url)
        if r.status_code != 200:
            return
        # Extract structured links + dates if possible. Fallback: top-level extraction.
        extracted = trafilatura.extract(
            r.text, include_links=True, include_comments=False, output_format="json"
        )
    except Exception:
        return
    if not extracted:
        return
    import json as _json

    try:
        doc = _json.loads(extracted)
    except Exception:
        return
    text = doc.get("text", "") or ""
    if not text:
        return
    raw_hash = _hash("ir", entity_id, ir_url, str(datetime.now(timezone.utc).date()))
    yield Event(
        id=raw_hash[:16],
        source=f"ir:{entity_id}",
        source_url=ir_url,
        published_at=datetime.now(timezone.utc),
        title=f"{entity_id} IR snapshot",
        content=text[:20_000],
        primary_entity_id=entity_id,
        raw_hash=raw_hash,
    )


def fetch_all() -> list[Event]:
    out: list[Event] = []
    for e in load_entities():
        if e.ir_url:
            out.extend(poll_ir_page(e.id, e.ir_url))
    return out
