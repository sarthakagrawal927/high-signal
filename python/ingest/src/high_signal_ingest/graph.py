"""Spillover graph — NetworkX-backed BFS with weighted decay.

Loads `relationships.csv` once into a directed multigraph keyed by relationship type.
Given a primary entity, returns a ranked list of likely-affected peers / suppliers /
customers up to N hops away, scored by edge-weight product with hop-decay.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Iterable

import networkx as nx

from .seed import load_relationships


# Directional intent — when an edge fires, which direction does the spillover usually run?
# (the peer/competitor edges are bidirectional; supplier/customer carry direction)
_FORWARD: set[str] = {"supplier", "customer", "partner", "subsidiary"}
_BIDIRECTIONAL: set[str] = {"peer", "competitor"}


@lru_cache(maxsize=1)
def _graph() -> nx.MultiDiGraph:
    g: nx.MultiDiGraph = nx.MultiDiGraph()
    for r in load_relationships():
        g.add_edge(
            r.from_entity_id,
            r.to_entity_id,
            key=r.type,
            weight=r.weight,
            type=r.type,
        )
        if r.type in _BIDIRECTIONAL:
            g.add_edge(
                r.to_entity_id,
                r.from_entity_id,
                key=r.type,
                weight=r.weight,
                type=r.type,
            )
    return g


def _hop_decay(hop: int, base: float = 0.6) -> float:
    """0.6 at hop 1, 0.36 at hop 2, ..."""
    return base**hop


def spillover(
    primary: str,
    hops: int = 2,
    types: Iterable[str] | None = None,
    min_score: float = 0.10,
    limit: int = 12,
) -> list[tuple[str, float, list[str]]]:
    """Return [(entity_id, score, path), ...] for entities likely to move with `primary`.

    Score = product of edge weights × hop-decay; capped to top-`limit` results.
    `types` filter restricts which relationship types contribute (default: all).
    """
    g = _graph()
    if primary not in g:
        return []

    type_filter = set(types) if types else None
    best: dict[str, tuple[float, list[str]]] = {}

    queue: list[tuple[str, float, list[str], int]] = [(primary, 1.0, [primary], 0)]
    while queue:
        node, score, path, hop = queue.pop(0)
        if hop >= hops:
            continue
        for _, dst, data in g.out_edges(node, data=True):
            if dst == primary:
                continue
            if type_filter and data.get("type") not in type_filter:
                continue
            new_score = score * float(data.get("weight", 1.0)) * _hop_decay(hop + 1)
            if new_score < min_score:
                continue
            if dst in best and best[dst][0] >= new_score:
                continue
            new_path = path + [dst]
            best[dst] = (new_score, new_path)
            queue.append((dst, new_score, new_path, hop + 1))

    ranked = sorted(best.items(), key=lambda kv: kv[1][0], reverse=True)[:limit]
    return [(node, sc, p) for node, (sc, p) in ranked]


def spillover_ids(primary: str, **kwargs) -> list[str]:
    return [eid for eid, _, _ in spillover(primary, **kwargs)]


def graph_summary() -> dict:
    g = _graph()
    return {
        "nodes": g.number_of_nodes(),
        "edges": g.number_of_edges(),
        "in_degree_top": sorted(
            ((n, d) for n, d in g.in_degree()), key=lambda x: x[1], reverse=True
        )[:10],
        "out_degree_top": sorted(
            ((n, d) for n, d in g.out_degree()), key=lambda x: x[1], reverse=True
        )[:10],
    }


__all__ = ["spillover", "spillover_ids", "graph_summary"]
