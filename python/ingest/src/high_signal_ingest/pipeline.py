"""Orchestrator: source → events → extract → signal candidates → review queue."""

from __future__ import annotations

import argparse
from typing import Literal

Source = Literal["edgar", "news", "reddit", "ir"]


def run(source: Source, since: str) -> int:
    """Pull events from `source` since `since`, return count."""
    # TODO: dispatch to sources/{source}.py
    print(f"[pipeline] source={source} since={since}")
    return 0


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["edgar", "news", "reddit", "ir"], required=True)
    parser.add_argument("--since", default="1d")
    args = parser.parse_args()
    n = run(args.source, args.since)
    print(f"[pipeline] events ingested: {n}")


if __name__ == "__main__":
    main()
