"""News source adapter contracts."""

from __future__ import annotations

from high_signal_ingest.sources.news import _parse_feed


def test_parse_atom_feed_link_href() -> None:
    xml = """<?xml version="1.0"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <entry>
        <title>AI infra supply update</title>
        <link href="https://example.com/signal"/>
        <updated>2026-04-25T12:00:00Z</updated>
      </entry>
    </feed>
    """

    assert _parse_feed(xml) == [
        {
            "title": "AI infra supply update",
            "link": "https://example.com/signal",
            "pub": "2026-04-25T12:00:00Z",
        }
    ]
