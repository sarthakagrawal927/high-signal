"""News + blog RSS adapter — reads sources.yaml, extracts via Trafilatura."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from typing import Iterator
import xml.etree.ElementTree as ET

import httpx

from ..seed import load_sources
from ..types import Event


_HTTP = httpx.Client(
    headers={"User-Agent": "high-signal/0.1 (+https://github.com/sarthakagrawal927)"},
    follow_redirects=True,
    timeout=30.0,
)


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def _parse_rfc822(s: str) -> datetime | None:
    try:
        d = parsedate_to_datetime(s)
        return d.astimezone(timezone.utc) if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _parse_iso(s: str) -> datetime | None:
    try:
        d = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return d.astimezone(timezone.utc) if d.tzinfo else d.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def _extract_body(url: str) -> str:
    try:
        import trafilatura

        r = _HTTP.get(url)
        if r.status_code != 200:
            return ""
        text = trafilatura.extract(r.text, include_comments=False, include_tables=False) or ""
        return text[:30_000]
    except Exception:
        return ""


def _parse_feed(xml_text: str) -> list[dict]:
    """Tiny RSS/Atom parser — returns list of {title, link, pub} dicts."""
    out: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return out
    # RSS 2.0
    for item in root.iter():
        tag = item.tag.split("}")[-1]
        if tag in {"item", "entry"}:
            title = ""
            link = ""
            pub = ""
            for child in item:
                ctag = child.tag.split("}")[-1]
                if ctag == "title":
                    title = (child.text or "").strip()
                elif ctag == "link":
                    link = child.get("href") or (child.text or "").strip()
                elif ctag in {"pubDate", "published", "updated"}:
                    pub = (child.text or "").strip()
            if link:
                out.append({"title": title, "link": link, "pub": pub})
    return out


def fetch_rss(source: dict, since: datetime, fetch_body: bool = False) -> Iterator[Event]:
    """Pull a single RSS source. `source` is one entry from sources.yaml."""
    url = source.get("rss")
    if not url:
        return
    try:
        r = _HTTP.get(url)
    except Exception:
        return
    if r.status_code != 200:
        return
    items = _parse_feed(r.text)
    for it in items:
        link = it["link"]
        pub_raw = it["pub"]
        pub = _parse_rfc822(pub_raw) or _parse_iso(pub_raw)
        if pub is None:
            continue
        if pub < since:
            continue
        body = _extract_body(link) if fetch_body else ""
        raw_hash = _hash(source["id"], link)
        yield Event(
            id=raw_hash[:16],
            source=f"news:{source['id']}",
            source_url=link,
            published_at=pub,
            title=it.get("title") or None,
            content=body or None,
            primary_entity_id=None,  # filled later by entity extractor
            raw_hash=raw_hash,
        )


def fetch_all(days: int = 1, tier_max: int = 2, fetch_body: bool = True) -> list[Event]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    out: list[Event] = []
    for src in load_sources():
        if src.get("type") != "blog" and src.get("type") != "news_outlet":
            continue
        if int(src.get("tier", 99)) > tier_max:
            continue
        out.extend(fetch_rss(src, since, fetch_body=fetch_body))
    return out
