"""Relation extraction — GLiREL stub. Gates through manual review queue."""

from __future__ import annotations

from typing import Iterable


def extract_relations(text: str, entities: Iterable[str]) -> list[dict]:
    """Return list of {from, to, type, score, evidence}.

    GLiREL is heavy; for v0 we return [] and rely on:
      1) hand-curated `relationships.csv`
      2) manual review queue (see `review.py`)
    """
    return []
