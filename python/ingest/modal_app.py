"""Modal deploy: scheduled ingest + signal generation."""

from __future__ import annotations

import modal

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install_from_pyproject("pyproject.toml")
    .copy_local_dir("src/high_signal_ingest", "/root/high_signal_ingest")
    .env({"PYTHONPATH": "/root"})
)

app = modal.App("high-signal-ingest")


@app.function(image=image, schedule=modal.Cron("0 6 * * *"), timeout=1200, secrets=[modal.Secret.from_name("high-signal")])
def daily_ingest():
    from high_signal_ingest.pipeline import run

    return run("all", days=1)


@app.function(image=image, timeout=600, secrets=[modal.Secret.from_name("high-signal")])
def manual(source: str = "all", days: int = 1):
    from high_signal_ingest.pipeline import run

    return run(source, days)  # type: ignore[arg-type]


if __name__ == "__main__":
    with app.run():
        print(daily_ingest.remote())
