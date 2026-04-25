"""SEC EDGAR 8-K adapter — pulls material events for tracked tickers."""

from __future__ import annotations

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Iterator

from ..types import Event


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def fetch_8k(tickers: list[str], since: datetime) -> Iterator[Event]:
    """Yield 8-K filings for given tickers since `since`.

    Uses `edgartools` lazily — import inside fn so module loads without it.
    """
    try:
        from edgar import Company, set_identity
    except ImportError as e:
        raise RuntimeError(
            "edgartools not installed — `uv sync` in python/ingest first"
        ) from e

    # SEC requires identity for fair-use access
    import os

    set_identity(os.environ.get("SEC_USER_AGENT", "high-signal research@example.com"))

    for ticker in tickers:
        try:
            co = Company(ticker)
        except Exception:
            continue
        try:
            filings = co.get_filings(form="8-K")
        except Exception:
            continue
        for filing in filings:
            try:
                filed_at = datetime.fromisoformat(str(filing.filing_date))
                if filed_at.tzinfo is None:
                    filed_at = filed_at.replace(tzinfo=timezone.utc)
            except Exception:
                continue
            if filed_at < since:
                continue
            url = getattr(filing, "filing_url", None) or getattr(filing, "url", "")
            title = f"{ticker} 8-K: {getattr(filing, 'items', '')}"
            content = ""
            try:
                content = (filing.text() or "")[:50_000]
            except Exception:
                pass
            raw_hash = _hash(ticker, str(filed_at), url)
            yield Event(
                id=raw_hash[:16],
                source="edgar_8k",
                source_url=url,
                published_at=filed_at,
                title=title,
                content=content,
                primary_entity_id=ticker,
                raw_hash=raw_hash,
            )


def fetch_recent(tickers: list[str], days: int = 7) -> list[Event]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return list(fetch_8k(tickers, since))
