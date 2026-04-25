"""Forward-return backtest using yfinance + simple percentage windows.

VectorBT is heavier; for v0 we use yfinance directly and hand-roll the math.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Literal

Outcome = Literal["hit", "miss", "push", "pending"]


def forward_return(ticker: str, published_at: datetime, window_days: int) -> float | None:
    """Return forward return % from `published_at` over `window_days` business days."""
    try:
        import yfinance as yf  # type: ignore
    except ImportError:
        return None
    end = datetime.utcnow()
    target_end = published_at + timedelta(days=int(window_days * 1.6))  # buffer for weekends
    if target_end > end:
        return None
    try:
        hist = yf.Ticker(ticker).history(
            start=published_at.date().isoformat(),
            end=target_end.date().isoformat(),
            interval="1d",
        )
        if len(hist) < 2:
            return None
        start_px = float(hist["Close"].iloc[0])
        end_px = float(hist["Close"].iloc[min(window_days, len(hist) - 1)])
        return (end_px / start_px - 1.0) * 100.0
    except Exception:
        return None


def classify(direction: str, ret_pct: float | None, push_band: float = 0.5) -> Outcome:
    if ret_pct is None:
        return "pending"
    if abs(ret_pct) < push_band:
        return "push"
    if direction == "up" and ret_pct > 0:
        return "hit"
    if direction == "down" and ret_pct < 0:
        return "hit"
    if direction == "neutral":
        return "push" if abs(ret_pct) < 2.0 else "miss"
    return "miss"
