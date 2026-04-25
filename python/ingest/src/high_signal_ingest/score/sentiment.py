"""FinBERT sentiment baseline — simple positive/negative/neutral on text."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

Label = Literal["positive", "negative", "neutral"]


@lru_cache(maxsize=1)
def _pipeline():
    try:
        from transformers import pipeline  # type: ignore

        return pipeline(
            "sentiment-analysis",
            model="ProsusAI/finbert",
            tokenizer="ProsusAI/finbert",
        )
    except Exception:
        return None


def score(text: str) -> tuple[Label, float]:
    """Return (label, confidence)."""
    p = _pipeline()
    if p is None or not text:
        return ("neutral", 0.0)
    try:
        out = p(text[:512])[0]
        return (out["label"].lower(), float(out["score"]))  # type: ignore[arg-type]
    except Exception:
        return ("neutral", 0.0)
