"""Orchestrator: source → events → cluster by entity → signal candidate → review draft."""

from __future__ import annotations

import argparse
from collections import defaultdict
from typing import Literal

from .extract.entities import primary_entity
from .graph import spillover_ids
from .seed import load_entities
from .sources import edgar, github, gov, ir, news, reddit, youtube
from .types import Event
from .generator import generate
from .writer import emit

Source = Literal[
    "edgar", "news", "reddit", "ir", "github", "youtube", "gov", "all"
]


def fetch(source: Source, days: int) -> list[Event]:
    out: list[Event] = []
    if source in {"edgar", "all"}:
        tickers = [e.ticker for e in load_entities() if e.ticker and e.type == "public"]
        # 8-K is event-driven; 10-Q/K only checked weekly to keep volume bounded
        forms = ("8-K", "10-Q", "10-K") if days >= 7 else ("8-K",)
        out.extend(edgar.fetch_recent(tickers[:80], days=days, forms=forms))
    if source in {"news", "all"}:
        out.extend(news.fetch_all(days=days, tier_max=2, fetch_body=True))
    if source in {"reddit", "all"}:
        out.extend(reddit.fetch_all(days=days))
    if source in {"ir", "all"}:
        out.extend(ir.fetch_all())
    if source in {"github", "all"}:
        out.extend(github.fetch_all(days=max(days, 7)))
    if source in {"gov", "all"}:
        out.extend(gov.fetch_all(days=max(days, 3)))
    if source in {"youtube", "all"}:
        out.extend(youtube.fetch_all(days=max(days, 7)))
    return out


def _spillover_candidates(primary: str) -> list[str]:
    """Hop-decayed BFS over the relationship graph — top peers/suppliers/customers."""
    return spillover_ids(primary, hops=2, limit=12)


def cluster_and_generate(events: list[Event]) -> list[str]:
    """Cluster events by primary entity, then call LLM to draft signals."""
    by_entity: dict[str, list[Event]] = defaultdict(list)
    for ev in events:
        eid = ev.primary_entity_id
        if not eid:
            text = f"{ev.title or ''}\n{(ev.content or '')[:4000]}"
            eid = primary_entity(text)
        if eid:
            by_entity[eid].append(ev)

    written: list[str] = []
    for entity_id, evs in by_entity.items():
        distinct_urls = {e.source_url for e in evs if e.source_url}
        if len(distinct_urls) < 2:
            continue
        cand = generate(entity_id, evs, _spillover_candidates(entity_id))
        if cand:
            written.append(emit(cand))
    return written


def run(source: Source, days: int) -> dict:
    events = fetch(source, days)
    paths = cluster_and_generate(events)
    return {"events": len(events), "signals_drafted": len(paths), "paths": paths}


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--source",
        choices=["edgar", "news", "reddit", "ir", "github", "youtube", "gov", "all"],
        default="all",
    )
    p.add_argument("--days", type=int, default=1)
    args = p.parse_args()
    out = run(args.source, args.days)
    print(out)


if __name__ == "__main__":
    main()
