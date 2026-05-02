"""Contract tests for signal generation gates."""

from __future__ import annotations

from datetime import datetime, timezone

from high_signal_ingest import generator, pipeline
from high_signal_ingest.types import Event


def _event(source_url: str, entity_id: str = "NVDA") -> Event:
    return Event(
        id=source_url.rsplit("/", 1)[-1],
        source="news:test",
        source_url=source_url,
        published_at=datetime(2026, 4, 25, tzinfo=timezone.utc),
        title="NVIDIA lead times changed",
        content="NVIDIA B200 lead times changed materially.",
        primary_entity_id=entity_id,
        raw_hash=source_url,
    )


def test_cluster_skips_single_source(monkeypatch) -> None:
    calls = 0

    def fake_generate(*_args, **_kwargs):
        nonlocal calls
        calls += 1
        return None

    monkeypatch.setattr(pipeline, "generate", fake_generate)

    assert pipeline.cluster_and_generate([_event("https://example.com/a")]) == []
    assert calls == 0


def test_generator_rejects_unknown_signal_type(monkeypatch) -> None:
    monkeypatch.setenv("AI_BASE_URL", "https://ai.example")
    monkeypatch.setenv("AI_API_KEY", "test")
    monkeypatch.setattr(
        generator,
        "_ai_complete",
        lambda *_args, **_kwargs: (
            {
                "publish": True,
                "signal_type": "capex_change",
                "direction": "up",
                "confidence": "medium",
                "predicted_window_days": 20,
                "spillover_entity_ids": [],
                "headline": "NVIDIA capex signal",
                "body_md": "Body",
            },
            {"model": "test", "prompt_version": "0", "reason": None, "raw_response": None,
             "latency_ms": 0, "tokens_in": 0, "tokens_out": 0},
        ),
    )

    assert generator.generate("NVDA", [_event("https://example.com/a")], []) is None
