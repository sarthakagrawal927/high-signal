"""Modal deploy: scheduled ingest + scoring."""

from __future__ import annotations

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_pyproject("pyproject.toml")
    .copy_local_dir("src/high_signal_ingest", "/root/high_signal_ingest")
    .env({"PYTHONPATH": "/root"})
)

app = modal.App("high-signal-ingest")
secrets = [modal.Secret.from_name("high-signal")]


@app.function(image=image, schedule=modal.Cron("0 6 * * *"), timeout=1200, secrets=secrets)
def daily_ingest() -> dict:
    from high_signal_ingest.pipeline import run

    return run("all", days=1)


@app.function(image=image, schedule=modal.Cron("30 22 * * *"), timeout=900, secrets=secrets)
def daily_score() -> dict:
    """22:30 UTC — runs after US market close to score matured signals."""
    from high_signal_ingest.score.runner import run

    return run()


@app.function(image=image, timeout=600, secrets=secrets)
def manual_ingest(source: str = "all", days: int = 1) -> dict:
    from high_signal_ingest.pipeline import run

    return run(source, days)  # type: ignore[arg-type]


@app.function(image=image, timeout=600, secrets=secrets)
def manual_score() -> dict:
    from high_signal_ingest.score.runner import run

    return run()


# Web endpoints — Worker cron POSTs here to trigger jobs without waiting.
@app.function(image=image, timeout=900, secrets=secrets)
@modal.fastapi_endpoint(method="POST", requires_proxy_auth=False)
def trigger_ingest(payload: dict) -> dict:
    from high_signal_ingest.pipeline import run

    source = str(payload.get("source", "all"))
    days = int(payload.get("days", 1))
    return run(source, days=days)  # type: ignore[arg-type]


@app.function(image=image, timeout=900, secrets=secrets)
@modal.fastapi_endpoint(method="POST", requires_proxy_auth=False)
def trigger_score(_payload: dict) -> dict:
    from high_signal_ingest.score.runner import run

    return run()


if __name__ == "__main__":
    with app.run():
        print(daily_ingest.remote())
