# high-signal/python/ingest

Python ingestion + scoring runtime. Source adapters, entity/relation extraction, signal generation, backtest.

## Setup
```bash
cd python/ingest
uv sync
```

## Layout
```
src/
  high_signal_ingest/
    sources/        # edgar.py, news.py, reddit.py, ir.py
    extract/        # gliner_ner.py, glirel_relations.py
    score/          # finbert_sentiment.py, backtest.py
    seed/           # ai_infra_entities.csv, relationships.csv
    pipeline.py     # orchestrator
modal_app.py        # Modal deploy entry
tests/
```

## Run locally
```bash
uv run python -m high_signal_ingest.pipeline --source edgar --since 1d
```

## Deploy to Modal
```bash
uv run modal deploy modal_app.py
```
