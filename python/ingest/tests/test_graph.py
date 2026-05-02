"""Spillover graph tests — uses real relationships.csv."""

from __future__ import annotations

from high_signal_ingest.graph import graph_summary, spillover, spillover_ids


def test_graph_summary_loaded() -> None:
    s = graph_summary()
    assert s["nodes"] >= 30
    assert s["edges"] >= 100


def test_nvda_has_spillover() -> None:
    out = spillover("NVDA", hops=2, limit=15)
    ids = {eid for eid, _, _ in out}
    # At least one of the canonical AI-infra adjacencies should fire
    assert ids & {"TSM", "ASML", "SK_HYNIX", "AVGO", "AMAT", "LRCX"}


def test_spillover_ranked_descending() -> None:
    out = spillover("MSFT", hops=2, limit=10)
    if len(out) >= 2:
        for a, b in zip(out, out[1:]):
            assert a[1] >= b[1]


def test_spillover_filter_by_type() -> None:
    # TSM has supplier out-edges (→ NVDA, AMD, ...) and competitor out-edges (→ SMIC)
    out_supplier = spillover("TSM", hops=1, types={"supplier"}, limit=20)
    out_competitor = spillover("TSM", hops=1, types={"competitor"}, limit=20)
    s_ids = {x[0] for x in out_supplier}
    c_ids = {x[0] for x in out_competitor}
    assert s_ids != c_ids


def test_unknown_entity_returns_empty() -> None:
    assert spillover_ids("DOES_NOT_EXIST") == []
