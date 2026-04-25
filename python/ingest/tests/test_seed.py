"""Smoke tests for seed loaders + entity gazetteer."""

from __future__ import annotations

from high_signal_ingest.extract.entities import gazetteer_match, primary_entity
from high_signal_ingest.seed import (
    entity_gazetteer,
    load_entities,
    load_relationships,
    load_signal_types,
    load_sources,
)


def test_entities_load() -> None:
    es = load_entities()
    assert len(es) >= 200, f"expected >=200 entities, got {len(es)}"
    ids = {e.id for e in es}
    for must in {"NVDA", "TSM", "ASML", "AMD", "MSFT", "GOOGL", "AMZN", "META"}:
        assert must in ids, f"missing {must}"


def test_relationships_load() -> None:
    rs = load_relationships()
    assert len(rs) >= 100
    # Weights bounded
    for r in rs:
        assert 0.0 < r.weight <= 1.0


def test_signal_types_load() -> None:
    ts = load_signal_types()
    assert len(ts) >= 20
    ids = {t.get("id") for t in ts}
    for must in {
        "capex_change_hyperscaler",
        "capex_change_neocloud",
        "gpu_lead_time_shift",
        "design_win",
        "export_restriction",
    }:
        assert must in ids


def test_sources_load() -> None:
    ss = load_sources()
    assert len(ss) >= 80
    tier1 = [s for s in ss if s.get("tier") == 1]
    assert len(tier1) >= 30


def test_gazetteer() -> None:
    es = load_entities()
    lut = entity_gazetteer(es)
    assert "nvda" in lut
    assert lut["nvda"] == "NVDA"


def test_gazetteer_match() -> None:
    text = "TSMC posts strong CoWoS guidance; NVDA expected to benefit."
    hits = gazetteer_match(text)
    assert "NVDA" in hits


def test_primary_entity() -> None:
    text = (
        "AMD signs multi-year supply deal with TSMC. Industry watchers note AMD's MI400 timeline."
    )
    p = primary_entity(text)
    assert p in {"AMD", "TSM"}
