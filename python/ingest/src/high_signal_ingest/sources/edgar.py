"""SEC EDGAR adapter — 8-K events, 10-Q/K MD&A, 13F insider holdings."""

from __future__ import annotations

import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Iterable, Iterator

from ..types import Event


# Forms most likely to carry directional signals
DEFAULT_FORMS: tuple[str, ...] = ("8-K", "10-Q", "10-K")


def _hash(*parts: str) -> str:
    return hashlib.sha256("␟".join(parts).encode("utf-8")).hexdigest()


def _ensure_identity() -> None:
    from edgar import set_identity

    set_identity(os.environ.get("SEC_USER_AGENT", "high-signal research@example.com"))


def fetch_filings(
    tickers: list[str],
    since: datetime,
    forms: Iterable[str] = DEFAULT_FORMS,
) -> Iterator[Event]:
    """Yield filings for given tickers + form types since `since`."""
    try:
        from edgar import Company
    except ImportError as e:
        raise RuntimeError("edgartools not installed — uv sync first") from e

    _ensure_identity()

    for ticker in tickers:
        try:
            co = Company(ticker)
        except Exception:
            continue
        for form in forms:
            try:
                filings = co.get_filings(form=form)
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
                title = f"{ticker} {form}: {getattr(filing, 'items', '')}".strip()
                content = ""
                try:
                    # 10-Q/K bodies are huge — keep first 50k chars (MD&A is up front)
                    content = (filing.text() or "")[:50_000]
                except Exception:
                    pass
                raw_hash = _hash(ticker, form, str(filed_at), url)
                yield Event(
                    id=raw_hash[:16],
                    source=f"edgar_{form.lower().replace('-', '')}",
                    source_url=url,
                    published_at=filed_at,
                    title=title,
                    content=content,
                    primary_entity_id=ticker,
                    raw_hash=raw_hash,
                )


def fetch_recent(
    tickers: list[str], days: int = 7, forms: Iterable[str] = DEFAULT_FORMS
) -> list[Event]:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    return list(fetch_filings(tickers, since, forms=forms))


# Backwards-compat alias
def fetch_8k(tickers: list[str], since: datetime) -> Iterator[Event]:
    return fetch_filings(tickers, since, forms=("8-K",))
